import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.video import VideoStatus


class VideoCreate(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def must_be_youtube(cls, v: str) -> str:
        if "youtube.com" not in v and "youtu.be" not in v:
            raise ValueError("YouTube URL만 지원합니다 (youtube.com 또는 youtu.be)")
        return v


class VideoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    url: str
    status: str
    title: str | None
    duration_sec: int | None
    region: str | None
    theme: str | None
    creator_name: str | None
    thumbnail_url: str | None
    created_at: datetime
    updated_at: datetime


class VideoUpdate(BaseModel):
    status: VideoStatus | None = None
    title: str | None = None
    duration_sec: int | None = None
