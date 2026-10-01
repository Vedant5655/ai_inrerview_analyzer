from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.database.database import Base, engine
from app.database import models  # noqa: F401
from app.routers import analysis, auth, interviews, profile

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="Practice interviews and review answer-level coaching feedback. Scores are AI-generated assessments, not hiring decisions.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth.router)
app.include_router(interviews.router)
app.include_router(analysis.router)
app.include_router(profile.router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Please check the submitted information."}})


@app.exception_handler(Exception)
async def unexpected_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"success": False, "error": {"code": "INTERNAL_ERROR", "message": "Something went wrong. Please try again."}})


@app.get("/", tags=["Health"])
def health_check():
    return {"success": True, "data": {"name": settings.app_name, "ai_mode": settings.ai_mode}, "message": "API is ready"}


@app.get("/health", tags=["Health"])
def health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"success": True, "data": {"status": "ok"}, "message": "Healthy"}
