import os, pathlib, smtplib, pytest
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
from fastapi.testclient import TestClient
from app.main import app
from app import services
from app.core.config import settings
from app.db import SessionLocal, ContactMessage
good = dict(name="Test User", email="a@b.com", subject="Hello there", message="This is a long enough message.")
PUBLIC = ["health", "profile", "projects", "education", "experience", "skills", "social-links"]
LINKS = ["https://github.com/sparkyatom", "https://www.linkedin.com/in/sandeepan-podder-02055822a/", "https://www.instagram.com/sandeepan.podder/", "https://www.facebook.com/profile.php?id=100074809817393", "mailto:sandeepanpodder2002612@gmail.com"]
@pytest.fixture(scope="module")
def c():
    with TestClient(app) as cl: yield cl
@pytest.fixture(autouse=True)
def reset(monkeypatch):
    services._hits.clear(); monkeypatch.setattr(settings, "rate_limit_per_hour", 50)
    monkeypatch.setattr(services, "send_email", lambda **k: (True, "sent", ""))
def last(): 
    with SessionLocal() as db: return db.query(ContactMessage).order_by(ContactMessage.id.desc()).first()
@pytest.mark.parametrize("p", PUBLIC)
def test_public_endpoints(c, p):
    r = c.get(f"/api/{p}"); assert r.status_code == 200 and r.json()["success"]
def test_write_endpoints_absent(c): assert c.delete("/api/projects").status_code in (404, 405)
def test_social_links_exact(c): assert [l["url"] for l in c.get("/api/social-links").json()["data"]] == LINKS
def test_projects_have_thumbnails(c):
    ps = c.get("/api/projects").json()["data"]; assert len(ps) == 6
    for p in ps: assert (pathlib.Path(__file__).parents[2] / "frontend/public" / p["image"].lstrip("/")).exists()
def test_location_is_city_only(c):
    p = c.get("/api/profile").json()["data"]; assert p["location"] == "Habra, West Bengal, India" and "Banipur" not in str(p)
def test_phone_toggle(c, monkeypatch):
    assert c.get("/api/profile").json()["data"]["phone"] == "6295310309"
    monkeypatch.setattr(settings, "show_phone", False); assert c.get("/api/profile").json()["data"]["phone"] is None
def test_contact_email_sent(c):
    d = c.post("/api/contact", json=good).json()["data"]; assert d["stored"] and d["email_sent"] and last().email_status == "sent"
def test_contact_email_failure_not_reported_as_sent(c, monkeypatch):
    monkeypatch.setattr(services, "send_email", lambda **k: (False, "failed", "SMTPAuthenticationError"))
    d = c.post("/api/contact", json=good).json()["data"]
    assert d["stored"] and not d["email_sent"] and "could not be delivered" in d["message"]
    assert last().email_status == "failed"
def test_send_email_unconfigured(monkeypatch):
    monkeypatch.undo(); monkeypatch.setattr(settings, "smtp_password", "")
    assert services.send_email(**good)[:2] == (False, "not_configured")
def test_send_email_smtp_error(monkeypatch):
    monkeypatch.undo(); monkeypatch.setattr(settings, "smtp_user", "u"); monkeypatch.setattr(settings, "smtp_password", "p")
    def boom(*a, **k): raise smtplib.SMTPAuthenticationError(535, b"bad")
    monkeypatch.setattr(smtplib, "SMTP", boom); assert services.send_email(**good)[:2] == (False, "failed")
def test_contact_validation_and_honeypot(c):
    assert c.post("/api/contact", json={**good, "email": "bad"}).status_code == 422
    with SessionLocal() as db: n = db.query(ContactMessage).count()
    assert c.post("/api/contact", json={**good, "website": "x"}).json()["success"]
    with SessionLocal() as db: assert db.query(ContactMessage).count() == n
def test_rate_limit(c, monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_per_hour", 2)
    assert [c.post("/api/contact", json=good).status_code for _ in range(3)] == [200, 200, 429]
