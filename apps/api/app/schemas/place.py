from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator


def _geom_to_lat_lng(geom: Any) -> tuple[float, float]:
    from geoalchemy2.shape import to_shape  # type: ignore[import-untyped]

    point = to_shape(geom)
    return float(point.y), float(point.x)


class PlaceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    video_id: uuid.UUID
    name: str
    category: str | None
    lat: float
    lng: float
    context_start_sec: int
    context_end_sec: int
    confidence: float
    google_place_id: str | None
    frame_image_url: str | None
    video_url: str | None = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def extract_lat_lng(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        geom = getattr(data, "geom", None)
        result: dict[str, Any] = {
            field: getattr(data, field, None)
            for field in (
                "id",
                "video_id",
                "name",
                "category",
                "context_start_sec",
                "context_end_sec",
                "confidence",
                "google_place_id",
                "frame_image_url",
                "created_at",
                "updated_at",
            )
        }
        if geom is not None:
            result["lat"], result["lng"] = _geom_to_lat_lng(geom)
        # Populate video_url from eagerly-loaded relationship
        video = getattr(data, "video", None)
        result["video_url"] = getattr(video, "url", None) if video is not None else None
        return result


class PlaceCreate(BaseModel):
    video_id: uuid.UUID
    name: str
    category: str | None = None
    lat: float
    lng: float
    context_start_sec: int = 0
    context_end_sec: int = 0
    confidence: float = 0.0
    raw_extracted_text: str = ""
    google_place_id: str | None = None

    def geom_wkt(self) -> str:
        return f"POINT({self.lng} {self.lat})"
