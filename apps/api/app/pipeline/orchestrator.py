from __future__ import annotations

import shutil
import uuid
from pathlib import Path

import structlog
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import AsyncSessionLocal
from app.exceptions import CostLimitExceeded, DownloadFailed
from app.models.place import Place
from app.models.video import Video, VideoStatus
from app.pipeline import analyze_video, cost_guard, download, frame_capture, resolve
from app.pipeline.types import PlaceCandidate, VideoMeta
from app.settings import settings

log = structlog.get_logger()


async def process_video(video_id: uuid.UUID, url: str) -> None:
    """Full pipeline: download → analyze → resolve → save places."""
    log.info("pipeline.start", video_id=str(video_id))

    async with AsyncSessionLocal() as session:
        await _set_status(session, video_id, VideoStatus.processing)

    meta: VideoMeta | None = None
    try:
        meta = await download.download_video(url, video_id)
        log.info("pipeline.downloaded", video_id=str(video_id), duration=meta.duration_sec)

        async with AsyncSessionLocal() as session:
            await _update_meta(session, video_id, meta)

        cost_guard.check(video_id, meta.duration_sec, settings)

        analysis = await analyze_video.extract_places(meta.file_path, video_id)
        resolved = await resolve.resolve_places(analysis.places)

        async with AsyncSessionLocal() as session:
            inserted_places = await _insert_places(session, video_id, resolved)

        # 근거 프레임 캡처는 영상 파일이 지워지기 전(finally 블록 이전)에 수행해야 함
        await _capture_and_save_frames(meta.file_path, inserted_places)

        async with AsyncSessionLocal() as session:
            await _update_region_theme(session, video_id, analysis.region, analysis.theme)

        async with AsyncSessionLocal() as session:
            await _set_status(session, video_id, VideoStatus.completed)

        log.info("pipeline.done", video_id=str(video_id), places=len(resolved))

    except (CostLimitExceeded, DownloadFailed) as exc:
        log.warning("pipeline.failed", video_id=str(video_id), reason=str(exc))
        async with AsyncSessionLocal() as session:
            await _set_status(session, video_id, VideoStatus.failed)

    except Exception:
        log.exception("pipeline.error", video_id=str(video_id))
        async with AsyncSessionLocal() as session:
            await _set_status(session, video_id, VideoStatus.failed)

    finally:
        if meta and meta.file_path.parent.exists():
            shutil.rmtree(meta.file_path.parent, ignore_errors=True)


async def _set_status(session: AsyncSession, video_id: uuid.UUID, status: VideoStatus) -> None:
    await session.execute(update(Video).where(Video.id == video_id).values(status=status.value))
    await session.commit()


async def _update_meta(session: AsyncSession, video_id: uuid.UUID, meta: VideoMeta) -> None:
    await session.execute(
        update(Video)
        .where(Video.id == video_id)
        .values(
            title=meta.title,
            duration_sec=meta.duration_sec,
            creator_name=meta.creator_name,
            thumbnail_url=meta.thumbnail_url,
        )
    )
    await session.commit()


async def _update_region_theme(
    session: AsyncSession, video_id: uuid.UUID, region: str | None, theme: str | None
) -> None:
    await session.execute(
        update(Video).where(Video.id == video_id).values(region=region, theme=theme)
    )
    await session.commit()


async def _insert_places(
    session: AsyncSession, video_id: uuid.UUID, candidates: list[PlaceCandidate]
) -> list[Place]:
    places: list[Place] = []
    for c in candidates:
        place = Place(
            video_id=video_id,
            name=c.name,
            category=c.category,
            geom=f"SRID=4326;POINT({c.lng} {c.lat})",
            context_start_sec=c.context_start_sec,
            context_end_sec=c.context_end_sec,
            confidence=c.confidence,
            raw_extracted_text=c.raw_extracted_text,
            google_place_id=c.google_place_id,
        )
        session.add(place)
        places.append(place)
    await session.commit()
    return places


async def _capture_and_save_frames(video_path: Path, places: list[Place]) -> None:
    """각 장소가 등장한 시점의 영상 프레임을 캡처해 Storage에 올리고 DB에 URL을 반영한다.
    best-effort — 실패해도 파이프라인 전체를 실패시키지 않는다."""
    for place in places:
        # 등장 구간의 중간 지점을 캡처 — start 시점은 컷 전환 직후라 화면이
        # 안 정착됐거나 흐릿할 수 있어(장소명 자막이 아직 안 뜬 경우 등),
        # start~end 사이 중간을 잡으면 더 안정적인 장면이 나온다.
        end = (
            place.context_end_sec
            if place.context_end_sec > place.context_start_sec
            else place.context_start_sec
        )
        capture_sec = (place.context_start_sec + end) // 2
        frame_path = await frame_capture.capture_frame(video_path, capture_sec)
        if frame_path is None:
            continue
        try:
            url = await frame_capture.upload_frame(frame_path, place.id)
        finally:
            frame_path.unlink(missing_ok=True)
        if url is None:
            continue

        async with AsyncSessionLocal() as session:
            await session.execute(
                update(Place).where(Place.id == place.id).values(frame_image_url=url)
            )
            await session.commit()
