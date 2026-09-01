from __future__ import annotations

import asyncio
import tempfile
import uuid
from pathlib import Path

import httpx
import structlog

from app.settings import settings as _settings

log = structlog.get_logger()

_BUCKET = "place-frames"


async def capture_frame(video_path: Path, timestamp_sec: int) -> Path | None:
    """ffmpeg로 영상의 특정 시점 프레임 1장을 JPEG로 추출한다. 실패하면 None(best-effort)."""
    out_path = Path(tempfile.mkdtemp(prefix="pind_frame_")) / f"{uuid.uuid4()}.jpg"
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-ss",
        str(max(timestamp_sec, 0)),
        "-i",
        str(video_path),
        "-frames:v",
        "1",
        "-q:v",
        "3",
        "-y",
        str(out_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0 or not out_path.exists():
        # ffmpeg는 버전/빌드 정보를 앞에 길게 찍으므로 실제 에러는 출력 끝부분에 있다.
        log.warning(
            "frame_capture.failed", timestamp_sec=timestamp_sec, error=stderr.decode()[-500:]
        )
        return None
    return out_path


async def upload_frame(image_path: Path, place_id: uuid.UUID) -> str | None:
    """캡처한 프레임을 Supabase Storage(공개 버킷)에 업로드하고 공개 URL을 반환한다."""
    storage_path = f"{place_id}.jpg"
    upload_url = f"{_settings.supabase_url}/storage/v1/object/{_BUCKET}/{storage_path}"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                upload_url,
                headers={
                    "Authorization": f"Bearer {_settings.supabase_service_role_key}",
                    "apikey": _settings.supabase_service_role_key,
                    "Content-Type": "image/jpeg",
                    "x-upsert": "true",
                },
                content=image_path.read_bytes(),
                timeout=15.0,
            )
        if resp.status_code >= 400:
            log.warning("frame_upload.failed", status=resp.status_code, body=resp.text[:300])
            return None
    except Exception as exc:
        log.warning("frame_upload.error", error=str(exc))
        return None

    return f"{_settings.supabase_url}/storage/v1/object/public/{_BUCKET}/{storage_path}"
