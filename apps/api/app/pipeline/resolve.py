from __future__ import annotations

import asyncio
from typing import Any

import httpx
import structlog

from app.pipeline.types import PlaceCandidate
from app.settings import settings as _settings

log = structlog.get_logger()

_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"


async def _geocode_one(
    name: str, client: httpx.AsyncClient
) -> tuple[float, float, str | None] | None:
    """Return (lat, lng, google_place_id) or None if not found."""
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": _settings.google_places_api_key,
        "X-Goog-FieldMask": "places.id,places.location",
    }
    body = {"textQuery": name, "languageCode": "ko"}
    try:
        resp = await client.post(_PLACES_SEARCH_URL, json=body, headers=headers, timeout=8.0)
        data: dict[str, Any] = resp.json()
    except Exception as exc:
        log.warning("geocode.error", name=name, error=str(exc))
        return None

    if "error" in data:
        error = data["error"]
        log.warning(
            "geocode.error",
            name=name,
            status=error.get("status"),
            message=error.get("message"),
        )
        return None

    places = data.get("places", [])
    if not places:
        return None

    location = places[0].get("location", {})
    lat = location.get("latitude")
    lng = location.get("longitude")
    place_id: str | None = places[0].get("id")
    if lat is None or lng is None:
        return None
    return float(lat), float(lng), place_id


def _dedup(candidates: list[PlaceCandidate]) -> list[PlaceCandidate]:
    """Remove near-duplicate places using sentence-transformers cosine similarity."""
    if len(candidates) <= 1:
        return candidates

    try:
        from sentence_transformers import SentenceTransformer, util

        model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        names = [c.name for c in candidates]
        embeddings = model.encode(names, convert_to_tensor=True)

        keep: list[PlaceCandidate] = []
        dropped: set[int] = set()
        for i, cand in enumerate(candidates):
            if i in dropped:
                continue
            keep.append(cand)
            for j in range(i + 1, len(candidates)):
                if j in dropped:
                    continue
                sim = float(util.cos_sim(embeddings[i], embeddings[j]))
                if sim > 0.85:
                    dropped.add(j)
        return keep

    except ImportError:
        # sentence-transformers not installed → skip dedup
        log.warning("dedup.skipped", reason="sentence_transformers not available")
        return candidates


async def resolve_places(candidates: list[PlaceCandidate]) -> list[PlaceCandidate]:
    """Geocode all candidates and deduplicate. Returns only successfully geocoded places."""
    if not candidates:
        return []

    # Geocode all in parallel
    async with httpx.AsyncClient() as client:
        tasks = [_geocode_one(c.name, client) for c in candidates]
        results = await asyncio.gather(*tasks)

    resolved: list[PlaceCandidate] = []
    for cand, result in zip(candidates, results, strict=False):
        if result is None:
            log.info("geocode.skip", name=cand.name, reason="not_found")
            continue
        lat, lng, place_id = result
        cand.lat = lat
        cand.lng = lng
        cand.google_place_id = place_id
        resolved.append(cand)

    log.info("geocode.done", total=len(candidates), resolved=len(resolved))

    # Dedup in thread (model load can be slow)
    deduped = await asyncio.to_thread(_dedup, resolved)
    log.info("dedup.done", before=len(resolved), after=len(deduped))
    return deduped
