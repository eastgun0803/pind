"""Add gen_random_uuid() server_default to id columns

Revision ID: b7c3e2f1a9d4
Revises: a3f8d1c2e4b5
Create Date: 2026-06-12 01:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "b7c3e2f1a9d4"
down_revision: str | None = "a3f8d1c2e4b5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute("ALTER TABLE videos ALTER COLUMN id SET DEFAULT gen_random_uuid()")
    op.execute("ALTER TABLE places ALTER COLUMN id SET DEFAULT gen_random_uuid()")


def downgrade() -> None:
    op.execute("ALTER TABLE videos ALTER COLUMN id DROP DEFAULT")
    op.execute("ALTER TABLE places ALTER COLUMN id DROP DEFAULT")
