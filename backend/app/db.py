from sqlalchemy import create_engine, inspect, text, JSON, String, Text, DateTime, func
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column
from app.core.config import settings
engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False)
class Base(DeclarativeBase): pass
class Content(Base):  # one row per section: profile, projects, education...
    __tablename__ = "content"
    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)
class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100)); email: Mapped[str] = mapped_column(String(200))
    subject: Mapped[str] = mapped_column(String(150)); message: Mapped[str] = mapped_column(Text)
    ip: Mapped[str] = mapped_column(String(64), default="")
    email_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|sent|failed|not_configured
    email_error: Mapped[str] = mapped_column(String(300), default="")
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())
def ensure_columns():
    """Adds columns introduced after a DB was first created. For bigger changes use Alembic."""
    have = {c["name"] for c in inspect(engine).get_columns("contact_messages")}
    with engine.begin() as c:
        for n, ddl in (("email_status", "VARCHAR(20) DEFAULT 'pending'"), ("email_error", "VARCHAR(300) DEFAULT ''")):
            if n not in have: c.execute(text(f"ALTER TABLE contact_messages ADD COLUMN {n} {ddl}"))
