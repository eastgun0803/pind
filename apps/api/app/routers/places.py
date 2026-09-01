from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.deps import get_db
from app.models.place import Place
from app.schemas.place import PlaceRead

router = APIRouter(prefix="/api/v1/places", tags=["places"])


@router.get("", response_model=list[PlaceRead])  # type: ignore[misc]
async def list_places(
    video_id: uuid.UUID | None = Query(default=None, description="특정 영상의 장소만 필터"),  # noqa: B008
    ids: list[uuid.UUID] | None = Query(  # noqa: B008
        default=None, description="특정 place id 목록만 필터 (여러 영상에 걸친 컬렉션 조회용)"
    ),
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> list[Place]:
    stmt = select(Place).options(selectinload(Place.video))
    if video_id is not None:
        stmt = stmt.where(Place.video_id == video_id)
    if ids:
        stmt = stmt.where(Place.id.in_(ids))
    result = await db.execute(stmt)
    return list(result.scalars().all())
