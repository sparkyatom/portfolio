import re, time, logging, smtplib
from collections import defaultdict, deque
from email.message import EmailMessage
from app.core.config import settings
log = logging.getLogger("portfolio")
_hits: dict[str, deque] = defaultdict(deque)
def clean(s: str) -> str: return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", "", s)).strip()
def rate_limited(ip: str) -> bool:
    q, now = _hits[ip], time.time()
    while q and now - q[0] > 3600: q.popleft()
    if len(q) >= settings.rate_limit_per_hour: return True
    q.append(now); return False
def send_email(name, email, subject, message) -> tuple[bool, str, str]:
    """Returns (delivered, status, error). Never raises; never claims success unless SMTP accepted it."""
    if not (settings.smtp_user and settings.smtp_password):
        log.warning("SMTP not configured; message stored only"); return False, "not_configured", "SMTP not configured"
    m = EmailMessage(); m["From"] = settings.smtp_user; m["To"] = settings.contact_to
    m["Reply-To"] = email; m["Subject"] = f"[Portfolio] {subject}"
    m.set_content(f"From: {name} <{email}>\n\n{message}")
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=settings.smtp_timeout) as s:
            s.starttls(); s.login(settings.smtp_user, settings.smtp_password); s.send_message(m)
        return True, "sent", ""
    except smtplib.SMTPAuthenticationError:
        log.error("SMTP authentication failed (check SMTP_USER / App Password)"); return False, "failed", "SMTP authentication failed"
    except (smtplib.SMTPException, OSError) as e:
        log.exception("Email send failed"); return False, "failed", type(e).__name__
