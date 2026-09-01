from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.exceptions import ForbiddenError, VideoNotFound
from app.models.place import Place
from app.models.place_event import PlaceEvent
from app.models.video import Video

router = APIRouter(prefix="/api/v1/creator", tags=["creator"])


class PlaceFunnelRead(BaseModel):
    place_id: uuid.UUID
    place_name: str
    category: str | None
    impressions: int
    clicks: int
    saves: int
    actions: int


class VideoStatsRead(BaseModel):
    video_id: uuid.UUID
    total_impressions: int
    total_clicks: int
    total_saves: int
    total_actions: int
    places: list[PlaceFunnelRead]


@router.get("/videos/{video_id}/stats", response_model=VideoStatsRead)
async def get_video_stats(
    video_id: uuid.UUID,
    current_user: uuid.UUID = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> VideoStatsRead:
    video = await db.get(Video, video_id)
    if video is None:
        raise VideoNotFound(f"video_id={video_id}")
    if video.user_id != current_user:
        raise ForbiddenError("본인 영상의 통계만 조회할 수 있습니다")

    places_result = await db.execute(select(Place).where(Place.video_id == video_id))
    places = list(places_result.scalars().all())

    counts_result = await db.execute(
        select(PlaceEvent.place_id, PlaceEvent.event_type, func.count())
        .where(PlaceEvent.video_id == video_id)
        .group_by(PlaceEvent.place_id, PlaceEvent.event_type)
    )
    counts: dict[tuple[uuid.UUID, str], int] = {
        (place_id, event_type): count for place_id, event_type, count in counts_result.all()
    }

    place_funnels = [
        PlaceFunnelRead(
            place_id=place.id,
            place_name=place.name,
            category=place.category,
            impressions=counts.get((place.id, "impression"), 0),
            clicks=counts.get((place.id, "click"), 0),
            saves=counts.get((place.id, "save"), 0),
            actions=counts.get((place.id, "action"), 0),
        )
        for place in places
    ]

    return VideoStatsRead(
        video_id=video_id,
        total_impressions=sum(p.impressions for p in place_funnels),
        total_clicks=sum(p.clicks for p in place_funnels),
        total_saves=sum(p.saves for p in place_funnels),
        total_actions=sum(p.actions for p in place_funnels),
        places=place_funnels,
    )
