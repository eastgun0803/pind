import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.exceptions import (
    AuthError,
    CostLimitExceeded,
    ForbiddenError,
    PlaceNotFound,
    VideoNotFound,
    WebhookAuthError,
)
from app.routers import creator_router, places_router, video_webhook_router
from app.settings import settings

log = structlog.get_logger()

app = FastAPI(
    title="Pind API",
    version="0.1.0",
    debug=settings.debug,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Exception handlers ────────────────────────────────────────────────────────


@app.exception_handler(VideoNotFound)
async def video_not_found_handler(_: Request, exc: VideoNotFound) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(PlaceNotFound)
async def place_not_found_handler(_: Request, exc: PlaceNotFound) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(CostLimitExceeded)
async def cost_limit_handler(_: Request, exc: CostLimitExceeded) -> JSONResponse:
    return JSONResponse(status_code=402, content={"detail": str(exc)})


@app.exception_handler(WebhookAuthError)
async def webhook_auth_handler(_: Request, exc: WebhookAuthError) -> JSONResponse:
    return JSONResponse(status_code=401, content={"detail": "Unauthorized"})


@app.exception_handler(AuthError)
async def auth_error_handler(_: Request, exc: AuthError) -> JSONResponse:
    return JSONResponse(status_code=401, content={"detail": str(exc)})


@app.exception_handler(ForbiddenError)
async def forbidden_error_handler(_: Request, exc: ForbiddenError) -> JSONResponse:
    return JSONResponse(status_code=403, content={"detail": str(exc)})


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(places_router)
app.include_router(video_webhook_router)
app.include_router(creator_router)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
