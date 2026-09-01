from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class PlaceCandidate:
    name: str
    lat: float
    lng: float
    category: str | None = None
    context_start_sec: int = 0
    context_end_sec: int = 0
    confidence: float = 0.0
    raw_extracted_text: str = ""
    google_place_id: str | None = None


@dataclass
class VideoAnalysis:
    places: list[PlaceCandidate]
    region: str | None = None
    theme: str | None = None


@dataclass
class VideoMeta:
    title: str
    duration_sec: int
    file_path: Path
    creator_name: str | None = None
    thumbnail_url: str | None = None
