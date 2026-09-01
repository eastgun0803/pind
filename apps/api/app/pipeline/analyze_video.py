from __future__ import annotations

import asyncio
import json
import re
import time
import uuid
from pathlib import Path

import structlog

from app.pipeline.types import PlaceCandidate, VideoAnalysis
from app.settings import settings as _settings

log = structlog.get_logger()

_EXTRACT_PROMPT = """당신은 여행·브이로그·관광 영상에서 구체적인 장소를 추출하는 전문가입니다.
영상을 분석하여 아래 JSON 객체 형식으로만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "region": "주요 배경 지역 (제주도, 서울, 부산, 강릉, 경주, 속초, 도쿄 등. 불가 시 \"기타\")",
  "theme": "맛집|카페|여행코스|역사|자연 중 하나 (불가 시 \"기타\")",
  "places": [
    {
      "name": "장소명 (한국어 또는 현지어 공식명)",
      "category": "식당|카페|관광지|교통|숙박|쇼핑|기타 중 하나",
      "context_start_sec": 등장_시작_초(정수),
      "context_end_sec": 등장_종료_초(정수),
      "confidence": 0.0~1.0,
      "raw_extracted_text": "이 장소를 확인한 영상 속 근거(자막·간판·음성 등)"
    }
  ]
}

규칙:
- places는 구체적인 고유 장소명만 포함 (예: "서울 어딘가" X, "경복궁" O)
- confidence 0.5 미만은 제외
- 동일 장소는 첫 등장 시간만
- places 최대 20개"""


def _upload_and_wait(client: object, file_path: Path) -> object:
    """Synchronous: upload file to Gemini Files API and wait until ACTIVE."""
    from google import genai  # type: ignore[import-untyped]

    assert isinstance(client, genai.Client)

    video_file = client.files.upload(
        file=str(file_path),
        config={"mime_type": "video/mp4"},
    )

    # Poll until file is ready (usually < 60s for short videos)
    max_wait = 300
    elapsed = 0
    while getattr(video_file.state, "name", str(video_file.state)) == "PROCESSING":
        if elapsed >= max_wait:
            raise TimeoutError("Gemini file processing timed out")
        time.sleep(10)
        elapsed += 10
        video_file = client.files.get(name=video_file.name)

    if getattr(video_file.state, "name", str(video_file.state)) == "FAILED":
        raise RuntimeError("Gemini file upload FAILED")

    return video_file


def _generate(client: object, video_file: object, model: str) -> str:
    """Synchronous: call generate_content and return response text."""
    from google import genai  # type: ignore[import-untyped]
    from google.genai import types as genai_types  # type: ignore[import-untyped]

    assert isinstance(client, genai.Client)

    response = client.models.generate_content(
        model=model,
        contents=[
            genai_types.Part.from_uri(
                file_uri=video_file.uri,
                mime_type="video/mp4",
            ),
            _EXTRACT_PROMPT,
        ],
    )
    return str(response.text or "")


def _delete_file(client: object, file_name: str) -> None:
    from google import genai  # type: ignore[import-untyped]

    assert isinstance(client, genai.Client)
    try:
        client.files.delete(name=file_name)
    except Exception:
        pass  # best-effort cleanup


def _parse_candidates(text: str, max_count: int) -> list[PlaceCandidate]:
    match = re.search(r"\[.*?\]", text, re.DOTALL)
    if not match:
        return []

    try:
        raw: list[dict[str, object]] = json.loads(match.group())
    except json.JSONDecodeError:
        return []

    candidates: list[PlaceCandidate] = []
    for item in raw[:max_count]:
        if not isinstance(item, dict):
            continue
        confidence = float(item.get("confidence") or 0.0)
        if confidence < 0.5:
            continue
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        candidates.append(
            PlaceCandidate(
                name=name,
                lat=0.0,  # filled by resolve step
                lng=0.0,
                category=str(item.get("category") or "") or None,
                context_start_sec=int(item.get("context_start_sec") or 0),
                context_end_sec=int(item.get("context_end_sec") or 0),
                confidence=confidence,
                raw_extracted_text=str(item.get("raw_extracted_text") or ""),
            )
        )
    return candidates


def _parse_region_theme(text: str) -> tuple[str | None, str | None]:
    region_match = re.search(r'"region"\s*:\s*"([^"]*)"', text)
    theme_match = re.search(r'"theme"\s*:\s*"([^"]*)"', text)
    region = region_match.group(1).strip() if region_match else None
    theme = theme_match.group(1).strip() if theme_match else None
    return (region or None), (theme or None)


async def extract_places(
    file_path: Path,
    video_id: uuid.UUID,
    max_count: int | None = None,
) -> VideoAnalysis:
    """Upload video to Gemini Files API, extract place candidates + region/theme."""
    from google import genai  # type: ignore[import-untyped]

    if max_count is None:
        max_count = _settings.max_frames_per_video

    client = genai.Client(api_key=_settings.gemini_api_key)

    log.info("gemini.upload.start", video_id=str(video_id), path=str(file_path))
    video_file = await asyncio.to_thread(_upload_and_wait, client, file_path)
    log.info("gemini.upload.done", video_id=str(video_id), file_uri=video_file.uri)

    try:
        text = await asyncio.to_thread(_generate, client, video_file, _settings.gemini_model)
    finally:
        await asyncio.to_thread(_delete_file, client, video_file.name)

    candidates = _parse_candidates(text, max_count)
    region, theme = _parse_region_theme(text)
    log.info(
        "gemini.extract.done",
        video_id=str(video_id),
        count=len(candidates),
        region=region,
        theme=theme,
    )
    return VideoAnalysis(places=candidates, region=region, theme=theme)
