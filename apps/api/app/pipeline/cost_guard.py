from __future__ import annotations

import uuid

from app.exceptions import CostLimitExceeded
from app.settings import Settings

# Gemini 2.5-flash video: ~$0.30/hour (conservative estimate)
_COST_PER_SEC_USD = 0.30 / 3600


def check(video_id: uuid.UUID, duration_sec: int, settings: Settings) -> None:
    """Raise CostLimitExceeded if duration or estimated cost exceeds caps."""
    if duration_sec > settings.max_video_duration_sec:
        estimated = duration_sec * _COST_PER_SEC_USD
        raise CostLimitExceeded(str(video_id), estimated, settings.max_cost_per_video_usd)

    estimated = duration_sec * _COST_PER_SEC_USD
    if estimated > settings.max_cost_per_video_usd:
        raise CostLimitExceeded(str(video_id), estimated, settings.max_cost_per_video_usd)
