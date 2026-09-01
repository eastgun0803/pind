"""Add region/theme/creator_name/thumbnail_url to videos

Revision ID: c1d4e5f6a7b8
Revises: b7c3e2f1a9d4
Create Date: 2026-08-02 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c1d4e5f6a7b8"
down_revision: str | None = "b7c3e2f1a9d4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("videos", sa.Column("region", sa.String(length=64), nullable=True))
    op.add_column("videos", sa.Column("theme", sa.String(length=64), nullable=True))
    op.add_column("videos", sa.Column("creator_name", sa.String(length=256), nullable=True))
    op.add_column("videos", sa.Column("thumbnail_url", sa.String(length=2048), nullable=True))


def downgrade() -> None:
    op.drop_column("videos", "thumbnail_url")
    op.drop_column("videos", "creator_name")
    op.drop_column("videos", "theme")
    op.drop_column("videos", "region")
