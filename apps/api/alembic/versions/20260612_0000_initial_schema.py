"""Initial schema: videos and places with PostGIS

Revision ID: a3f8d1c2e4b5
Revises:
Create Date: 2026-06-12 00:00:00.000000

"""

from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from alembic import op

revision: str = "a3f8d1c2e4b5"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "videos",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("duration_sec", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("videos_user_id_idx", "videos", ["user_id"])

    op.create_table(
        "places",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("video_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("category", sa.String(128), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.Geography(geometry_type="POINT", srid=4326),
            nullable=False,
        ),
        sa.Column("context_start_sec", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("context_end_sec", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("raw_extracted_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("google_place_id", sa.String(256), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["video_id"], ["videos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("places_video_id_idx", "places", ["video_id"])
    op.create_index("places_geom_idx", "places", ["geom"], postgresql_using="gist")


def downgrade() -> None:
    op.drop_index("places_geom_idx", table_name="places")
    op.drop_index("places_video_id_idx", table_name="places")
    op.drop_table("places")
    op.drop_index("videos_user_id_idx", table_name="videos")
    op.drop_table("videos")
    op.execute("DROP EXTENSION IF EXISTS postgis")
