import uuid
from collections.abc import AsyncGenerator

import jwt
from fastapi import Header
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.exceptions import AuthError
from app.settings import settings

# ─────────────────────────────────────────────
# 1. Engine — 앱 전체에서 단 하나만 생성
# ─────────────────────────────────────────────
engine = create_async_engine(
    # postgresql:// → postgresql+asyncpg:// 로 변환 (비동기 드라이버 명시)
    settings.database_pool_url.replace("postgresql://", "postgresql+asyncpg://"),
    pool_size=5,
    max_overflow=10,
    # Supabase Pooler(Transaction mode) 호환 필수 설정
    connect_args={"statement_cache_size": 0},
)


# ─────────────────────────────────────────────
# 2. Session Factory — 요청마다 세션을 만들어내는 공장
# ─────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ─────────────────────────────────────────────
# 3. FastAPI 의존성 함수 — 라우터에서 Depends(get_db)로 사용
# ─────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """요청 시작 시 세션을 열고, 끝나면 자동으로 닫는다."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─────────────────────────────────────────────
# 4. get_current_user — Supabase JWT(HS256) 검증 후 user_id 반환
# ─────────────────────────────────────────────
async def get_current_user(authorization: str = Header(default="")) -> uuid.UUID:
    """Authorization: Bearer <supabase JWT> 를 검증해 user_id(sub)를 반환한다."""
    if not authorization.startswith("Bearer "):
        raise AuthError("Authorization Bearer 토큰이 없습니다")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.InvalidTokenError as exc:
        raise AuthError(f"유효하지 않은 토큰입니다: {exc}") from exc

    sub = payload.get("sub")
    if not sub:
        raise AuthError("토큰에 사용자 정보(sub)가 없습니다")

    return uuid.UUID(sub)
