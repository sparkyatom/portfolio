"""Only this file touches the ORM. Swap it (e.g. for MongoDB) without touching services/routes."""
import json, pathlib
from sqlalchemy.orm import Session
from app.db import Content, ContactMessage
class ContentRepository:
    def __init__(self, db: Session): self.db = db
    def get(self, key: str):
        row = self.db.get(Content, key); return row.data if row else None
    def seed(self, force: bool = False):
        """Adds missing sections; with force=True overwrites every section from seed.json."""
        for k, v in json.loads((pathlib.Path(__file__).parent / "seed.json").read_text()).items():
            if force or self.db.get(Content, k) is None: self.db.merge(Content(key=k, data=v))
        self.db.commit()
class MessageRepository:
    def __init__(self, db: Session): self.db = db
    def add(self, **kw):
        m = ContactMessage(**kw); self.db.add(m); self.db.commit(); return m
    def set_email_status(self, id: int, status: str, error: str = ""):
        m = self.db.get(ContactMessage, id); m.email_status, m.email_error = status, error[:300]; self.db.commit()
