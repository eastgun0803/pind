from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PlaceEvent(Base):
    """핀별 참여 이벤트 로그. 테이블은 Supabase 마이그레이션이 소유(Alembic 대상 아님) —
    이 모델은 크리에이터 대시보드 집계 조회 전용이며 INSERT는 프런트에서 직접 수행한다."""

    __tablename__ = "place_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    place_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True
    )
    video_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
