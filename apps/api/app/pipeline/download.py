from __future__ import annotations

import asyncio
import json
import tempfile
import uuid
from pathlib import Path

from app.exceptions import DownloadFailed
from app.pipeline.types import VideoMeta


async def _run_yt_dlp(*args: str) -> tuple[str, str, int]:
    """Run yt-dlp subprocess, return (stdout, stderr, returncode)."""
    proc = await asyncio.create_subprocess_exec(
        "yt-dlp",
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout_b, stderr_b = await proc.communicate()
    return stdout_b.decode(), stderr_b.decode(), proc.returncode or 0


async def download_video(url: str, video_id: uuid.UUID) -> VideoMeta:
    """Download YouTube video to a temp directory; return VideoMeta.

    Caller is responsible for deleting the temp directory when done.
    """
    tmp_dir = Path(tempfile.mkdtemp(prefix=f"pind_{video_id}_"))
    out_template = str(tmp_dir / "%(id)s.%(ext)s")

    # Step 1: Fetch metadata only (no download) to get title + duration
    stdout, stderr, rc = await _run_yt_dlp(
        "--dump-json",
        "--no-playlist",
        url,
    )
    if rc != 0:
        raise DownloadFailed(f"yt-dlp metadata failed: {stderr[:500]}")

    try:
        info = json.loads(stdout.strip().split("\n")[-1])
        title: str = info.get("title", "Unknown")
        duration_sec: int = int(info.get("duration") or 0)
        yt_id: str = info.get("id", "video")
        creator_name: str | None = info.get("uploader") or info.get("channel")
        thumbnail_url: str | None = info.get("thumbnail")
    except (json.JSONDecodeError, ValueError) as exc:
        raise DownloadFailed(f"Failed to parse yt-dlp JSON: {exc}") from exc

    # Step 2: Download video (720p max, merge to mp4).
    # H.264(avc1)를 우선 선택 — AV1/VP9는 로컬 ffmpeg 빌드에 디코더가 없어
    # 근거 프레임 캡처(frame_capture.py)가 실패할 수 있음. avc1이 없는 영상만 폴백.
    _, stderr, rc = await _run_yt_dlp(
        "--no-playlist",
        "--max-filesize",
        "500m",
        "-f",
        "bestvideo[height<=720][vcodec^=avc1]+bestaudio/best[height<=720][vcodec^=avc1]"
        "/bestvideo[height<=720]+bestaudio/best[height<=720]",
        "--merge-output-format",
        "mp4",
        "-o",
        out_template,
        url,
    )
    if rc != 0:
        raise DownloadFailed(f"yt-dlp download failed: {stderr[:500]}")

    # Resolve file path
    candidates = list(tmp_dir.glob(f"{yt_id}.*"))
    if not candidates:
        candidates = list(tmp_dir.glob("*.mp4"))
    if not candidates:
        raise DownloadFailed("Downloaded file not found in temp directory")

    return VideoMeta(
        title=title,
        duration_sec=duration_sec,
        file_path=candidates[0],
        creator_name=creator_name,
        thumbnail_url=thumbnail_url,
    )
