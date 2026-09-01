import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import pytest
from app.schemas.place import PlaceCreate, PlaceRead
from app.schemas.video import VideoCreate, VideoRead


class TestVideoCreate:
    def test_youtube_com_accepted(self) -> None:
        v = VideoCreate(url="https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        assert "youtube.com" in v.url

    def test_youtu_be_accepted(self) -> None:
        v = VideoCreate(url="https://youtu.be/dQw4w9WgXcQ")
        assert "youtu.be" in v.url

    def test_non_youtube_rejected(self) -> None:
        with pytest.raises(ValueError):
            VideoCreate(url="https://vimeo.com/123456789")

    def test_non_youtube_tiktok_rejected(self) -> None:
        with pytest.raises(ValueError):
            VideoCreate(url="https://www.tiktok.com/@user/video/123")


class TestVideoRead:
    def test_from_dict(self) -> None:
        now = datetime.now(UTC)
        vid_id = uuid.uuid4()
        data: dict[str, Any] = {
            "id": vid_id,
            "user_id": uuid.uuid4(),
            "url": "https://youtube.com/watch?v=abc",
            "status": "pending",
            "title": None,
            "duration_sec": None,
            "region": None,
            "theme": None,
            "creator_name": None,
            "thumbnail_url": None,
            "created_at": now,
            "updated_at": now,
        }
        v = VideoRead.model_validate(data)
        assert v.id == vid_id
        assert v.status == "pending"


class TestPlaceRead:
    def test_from_dict(self) -> None:
        now = datetime.now(UTC)
        data: dict[str, Any] = {
            "id": uuid.uuid4(),
            "video_id": uuid.uuid4(),
            "name": "경복궁",
            "category": "관광지",
            "lat": 37.5796,
            "lng": 126.9770,
            "context_start_sec": 10,
            "context_end_sec": 25,
            "confidence": 0.95,
            "google_place_id": None,
            "frame_image_url": None,
            "created_at": now,
            "updated_at": now,
        }
        place = PlaceRead.model_validate(data)
        assert place.lat == 37.5796
        assert place.lng == 126.9770
        assert place.name == "경복궁"

    def test_from_orm_with_geom(self) -> None:
        from geoalchemy2.shape import from_shape
        from shapely.geometry import Point

        @dataclass
        class MockPlace:
            id: uuid.UUID
            video_id: uuid.UUID
            name: str
            category: str | None
            geom: Any
            context_start_sec: int
            context_end_sec: int
            confidence: float
            google_place_id: str | None
            created_at: datetime
            updated_at: datetime

        now = datetime.now(UTC)
        geom = from_shape(Point(126.9770, 37.5796), srid=4326)
        mock = MockPlace(
            id=uuid.uuid4(),
            video_id=uuid.uuid4(),
            name="경복궁",
            category="관광지",
            geom=geom,
            context_start_sec=10,
            context_end_sec=25,
            confidence=0.95,
            google_place_id=None,
            created_at=now,
            updated_at=now,
        )

        place = PlaceRead.model_validate(mock)
        assert abs(place.lat - 37.5796) < 0.0001
        assert abs(place.lng - 126.9770) < 0.0001
        assert place.name == "경복궁"


class TestPlaceCreate:
    def test_geom_wkt(self) -> None:
        pc = PlaceCreate(
            video_id=uuid.uuid4(),
            name="남산타워",
            lat=37.5512,
            lng=126.9882,
        )
        assert pc.geom_wkt() == "POINT(126.9882 37.5512)"

    def test_defaults(self) -> None:
        pc = PlaceCreate(
            video_id=uuid.uuid4(),
            name="홍대입구역",
            lat=37.5563,
            lng=126.9236,
        )
        assert pc.category is None
        assert pc.confidence == 0.0
        assert pc.raw_extracted_text == ""
