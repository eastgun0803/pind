from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from geoalchemy2 import Geography
from sqlalchemy import Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.video import Video


class Place(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "places"
    __table_args__ = (Index("places_geom_idx", "geom", postgresql_using="gist"),)

    video_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    geom: Mapped[Any] = mapped_column(Geography("POINT", srid=4326), nullable=False)
    context_start_sec: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    context_end_sec: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    raw_extracted_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    google_place_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    frame_image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    video: Mapped[Video] = relationship(back_populates="places")
