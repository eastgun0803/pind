from __future__ import annotations

import uuid

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, Header, Request

from app.exceptions import WebhookAuthError
from app.pipeline.orchestrator import process_video
from app.settings import settings

log = structlog.get_logger()

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


def _verify_secret(authorization: str = Header(default="")) -> None:
    """Validate Supabase Database Webhook secret.

    Skipped when SUPABASE_WEBHOOK_SECRET is empty (local dev without webhook).
    """
    if not settings.supabase_webhook_secret:
        return
    expected = f"Bearer {settings.supabase_webhook_secret}"
    if authorization != expected:
        raise WebhookAuthError("Invalid webhook secret")


@router.post("/video-created")  # type: ignore[misc]
async def video_created(
    request: Request,
    background_tasks: BackgroundTasks,
    _: None = Depends(_verify_secret),
) -> dict[str, str]:
    """Called by Supabase Database Webhook on INSERT to public.videos."""
    payload = await request.json()
    record: dict[str, object] = payload.get("record", {})

    video_id_raw = record.get("id")
    url = str(record.get("url") or "")

    if not video_id_raw or not url:
        return {"status": "ignored", "reason": "missing id or url"}

    try:
        video_id = uuid.UUID(str(video_id_raw))
    except ValueError:
        return {"status": "ignored", "reason": "invalid uuid"}

    log.info("webhook.received", video_id=str(video_id))
    background_tasks.add_task(process_video, video_id, url)
    return {"status": "accepted", "video_id": str(video_id)}
