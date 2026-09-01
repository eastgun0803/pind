"""Unit tests for pipeline modules (no external API calls)."""

from __future__ import annotations

import uuid

import pytest
from app.exceptions import CostLimitExceeded
from app.pipeline.analyze_video import _parse_candidates
from app.pipeline.cost_guard import check
from app.settings import Settings

# ── cost_guard ────────────────────────────────────────────────────────────────


class TestCostGuard:
    def _settings(self, max_dur: int = 1800, max_cost: float = 0.50) -> Settings:
        return Settings(
            database_url="postgresql://x:x@localhost/x",
            database_pool_url="postgresql://x:x@localhost/x",
            max_video_duration_sec=max_dur,
            max_cost_per_video_usd=max_cost,
        )

    def test_ok_short_video(self) -> None:
        check(uuid.uuid4(), duration_sec=60, settings=self._settings())

    def test_raises_on_duration_exceeded(self) -> None:
        with pytest.raises(CostLimitExceeded):
            check(uuid.uuid4(), duration_sec=3600, settings=self._settings(max_dur=1800))

    def test_raises_on_cost_exceeded(self) -> None:
        # 1 hour costs ~$0.30 → exceeds $0.10 cap
        with pytest.raises(CostLimitExceeded):
            check(uuid.uuid4(), duration_sec=3600, settings=self._settings(max_cost=0.10))


# ── analyze_video._parse_candidates ──────────────────────────────────────────


class TestParseCandidates:
    def test_valid_json_array(self) -> None:
        text = """
        [
          {
            "name": "경복궁",
            "category": "관광지",
            "context_start_sec": 10,
            "context_end_sec": 30,
            "confidence": 0.95,
            "raw_extracted_text": "경복궁 방문"
          }
        ]
        """
        result = _parse_candidates(text, max_count=20)
        assert len(result) == 1
        assert result[0].name == "경복궁"
        assert result[0].confidence == pytest.approx(0.95)
        assert result[0].lat == 0.0  # not yet geocoded

    def test_low_confidence_filtered(self) -> None:
        text = (
            '[{"name": "어딘가", "confidence": 0.3, '
            '"context_start_sec": 0, "context_end_sec": 5, "raw_extracted_text": "x"}]'
        )
        result = _parse_candidates(text, max_count=20)
        assert result == []

    def test_max_count_respected(self) -> None:
        item = (
            '{{"name": "장소{i}", "confidence": 0.9, '
            '"context_start_sec": 0, "context_end_sec": 5, "raw_extracted_text": "x"}}'
        )
        items = [item.format(i=i) for i in range(10)]
        text = f"[{', '.join(items)}]"
        result = _parse_candidates(text, max_count=3)
        assert len(result) == 3

    def test_no_json_returns_empty(self) -> None:
        result = _parse_candidates("I couldn't find any places.", max_count=20)
        assert result == []

    def test_embedded_in_prose(self) -> None:
        text = (
            "Here are the places I found:\n"
            '[{"name": "남산타워", "confidence": 0.8, '
            '"context_start_sec": 5, "context_end_sec": 15, "raw_extracted_text": "남산"}]'
            "\nDone."
        )
        result = _parse_candidates(text, max_count=20)
        assert len(result) == 1
        assert result[0].name == "남산타워"
