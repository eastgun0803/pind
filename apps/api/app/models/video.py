from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.place import Place


class VideoStatus(enum.StrEnum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Video(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "videos"

    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=VideoStatus.pending)
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    duration_sec: Mapped[int | None] = mapped_column(nullable=True)
    region: Mapped[str | None] = mapped_column(String(64), nullable=True)
    theme: Mapped[str | None] = mapped_column(String(64), nullable=True)
    creator_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    places: Mapped[list[Place]] = relationship(back_populates="video", lazy="select")
