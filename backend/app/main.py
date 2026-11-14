import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from app.core.config import settings
from app.db import Base, engine, SessionLocal, ensure_columns
from app.repositories import ContentRepository, MessageRepository
from app import services
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("portfolio")
@asynccontextmanager
async def lifespan(_):
    Base.metadata.create_all(engine); ensure_columns()
    with SessionLocal() as db: ContentRepository(db).seed(force=settings.reseed_on_start)
    yield
app = FastAPI(title="Portfolio API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins.split(","), allow_methods=["GET", "POST"], allow_headers=["*"])
def get_db():
    with SessionLocal() as db: yield db
def ok(data): return {"success": True, "data": data}
@app.exception_handler(HTTPException)
async def http_err(_, e): return JSONResponse({"success": False, "error": e.detail}, e.status_code)
@app.exception_handler(RequestValidationError)
async def val_err(_, e): return JSONResponse({"success": False, "error": "Please check the form fields and try again."}, 422)
@app.get("/api/health")
def health(): return ok({"status": "healthy"})
def _route(path, key):
    @app.get(f"/api/{path}", name=path)
    def r(db=Depends(get_db)):
        d = ContentRepository(db).get(key)
        if d is None: raise HTTPException(404, "Not found")
        if key == "profile" and not settings.show_phone: d = {**d, "phone": None}
        return ok(d)
for p, k in [("profile","profile"),("projects","projects"),("education","education"),("experience","experience"),("skills","skills"),("social-links","social_links")]: _route(p, k)
class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=100); email: EmailStr
    subject: str = Field(min_length=3, max_length=150); message: str = Field(min_length=10, max_length=3000)
    website: str = ""  # honeypot
def client_ip(req: Request) -> str:
    fwd = req.headers.get("x-forwarded-for")
    if settings.trust_proxy and fwd: return fwd.split(",")[0].strip()
    return req.client.host if req.client else "unknown"
@app.post("/api/contact")
def contact(body: ContactIn, req: Request, db=Depends(get_db)):
    if body.website: return ok({"stored": True, "email_sent": True, "message": "Thanks!"})  # bots get a fake OK
    ip = client_ip(req)
    if services.rate_limited(ip): raise HTTPException(429, "Too many messages. Try again later.")
    f = dict(name=services.clean(body.name), email=body.email, subject=services.clean(body.subject), message=services.clean(body.message))
    repo = MessageRepository(db)
    try: row = repo.add(ip=ip, **f)
    except Exception:
        log.exception("Could not store contact message"); raise HTTPException(500, "Could not save your message. Please email me directly.")
    sent, status, err = services.send_email(**f)
    try: repo.set_email_status(row.id, status, err)
    except Exception: log.exception("Could not record email status")
    if sent: return ok({"stored": True, "email_sent": True, "message": "Message sent — I'll reply by email."})
    return ok({"stored": True, "email_sent": False, "message": "Your message was saved, but the email notification could not be delivered. Please also email me directly."})
