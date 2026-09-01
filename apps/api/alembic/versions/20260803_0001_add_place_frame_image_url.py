"""Add frame_image_url to places

Revision ID: d2e5f6a7b8c9
Revises: c1d4e5f6a7b8
Create Date: 2026-08-03 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d2e5f6a7b8c9"
down_revision: str | None = "c1d4e5f6a7b8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("places", sa.Column("frame_image_url", sa.String(length=2048), nullable=True))


def downgrade() -> None:
    op.drop_column("places", "frame_image_url")
