# Sandeepan Podder — Portfolio
React + Vite + TypeScript + Tailwind + Framer Motion (frontend) · FastAPI + SQLAlchemy (backend).

## Run locally
Needs Node.js 20+ and Python 3.11+.
```bash
cd backend && python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt && cp .env.example .env
uvicorn app.main:app --reload          # API + docs: http://localhost:8000/docs
```
```bash
cd frontend && npm ci && npm run dev   # http://localhost:5173 (proxies /api to :8000)
```
Tests: `cd backend && pytest` · `cd frontend && npm test` · production build: `npm run build`.

## Environment variables
Backend (`backend/.env`):
| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./portfolio.db` | Database. `postgres://` / `postgresql://` URLs are auto-converted |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated frontend URLs allowed to call the API |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `587` | Mail server (STARTTLS) |
| `SMTP_USER` / `SMTP_PASSWORD` | empty | Gmail address + 16-character App Password |
| `SMTP_TIMEOUT` | `15` | Seconds before an SMTP attempt fails |
| `CONTACT_TO` | your Gmail | Where messages are delivered |
| `RATE_LIMIT_PER_HOUR` | `5` | Messages per IP per hour (in-memory, per server process) |
| `SHOW_PHONE` | `true` | `false` hides the phone number from the API and the site |
| `TRUST_PROXY` | `false` | `true` only behind a proxy you control, so the real client IP is used for rate limiting |
| `RESEED_ON_START` | `false` | `true` overwrites DB content from `seed.json` at startup (set back to `false` afterwards) |

Frontend: `VITE_API_URL` (e.g. `https://api.example.com`; leave empty locally).

## Contact form behaviour
Every valid message is saved to the database first. The API then tries SMTP and reports both results: `stored` and `email_sent`. If email fails (bad App Password, no SMTP config, network), the visitor sees that the message was saved but the notification failed, and the row's `email_status` is `failed` or `not_configured`. Gmail setup: Google Account → Security → enable 2-Step Verification → App passwords → create one → set `SMTP_PASSWORD`. Check stored messages with: `sqlite3 backend/portfolio.db "select name,subject,email_status from contact_messages"`.

## Replace content
- **CV:** copy your resume to `frontend/public/Sandeepan_Podder_CV.pdf` (exact name). Until a real PDF exists the button shows "CV coming soon" instead of a broken download.
- **Profile photo:** replace `frontend/public/profile-placeholder.svg`, or add e.g. `profile.jpg` there and set `"image": "/profile.jpg"` in `backend/app/seed.json`.
- **Project images:** files are in `frontend/public/projects/`. Replace one or set each project's `"image"` in `seed.json`. Use 16:9 (e.g. 1280×720).
- **Social links, text, projects, GitHub/demo URLs:** edit `backend/app/seed.json` (`social_links`; per project `github` and `demo` — buttons appear only when set; `location`; `phone`).
- **Applying edits:** content is loaded into the database on first start. After editing `seed.json`, either delete `backend/portfolio.db`, or start once with `RESEED_ON_START=true` (this overwrites all content sections, not contact messages). With an existing database you must do this once to get the new thumbnails and the city-only location.

## Database and PostgreSQL
SQLite is for local development. **Do not rely on SQLite in production on hosts with ephemeral disks** (most container/PaaS hosts): the file, including stored contact messages, is lost on redeploy unless you attach a persistent disk/volume. Use PostgreSQL instead:
1. Create a managed PostgreSQL database (your host's add-on, Neon, Supabase, etc.) or use `docker-compose.yml` (volume `pgdata` persists data).
2. Set `DATABASE_URL=postgresql://user:password@host:5432/dbname` on the backend. The driver (`psycopg`) is already in `requirements.txt`.
3. Start the backend: tables are created automatically; set `RESEED_ON_START=true` for the first start to load content, then back to `false`.
4. To keep old contact messages, export them from SQLite and import them into Postgres (e.g. with `pgloader` or a short script).
Schema changes later: `create_all` only creates missing tables and a small helper adds two known columns; adopt Alembic before making further schema changes.

**MongoDB is not a configuration switch.** SQLAlchemy does not support MongoDB. Moving there means writing a new repository module using a Mongo driver (e.g. PyMongo/Motor) with the same methods as `app/repositories.py`, and removing the SQLAlchemy models/engine. Routes and services stay unchanged only because they depend on those repository methods.

## Deploy
FastAPI needs a Python server; static hosts cannot run it. Frontend and backend are deployed separately.
- **Backend:** a Python-capable host (Render, Railway, Fly.io, a VPS, or the Dockerfile in `backend/`). Start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set the environment variables above, a PostgreSQL `DATABASE_URL`, and `CORS_ORIGINS=https://your-frontend-domain`.
- **Frontend:** a static host (Vercel, Netlify, Cloudflare Pages). Root `frontend`, build `npm run build`, output `dist`, env `VITE_API_URL=https://your-backend-domain`.
- **HTTPS / custom domain:** add the domain in each host's dashboard, create the DNS records it shows, and wait for the certificate (usually automatic). Update `CORS_ORIGINS` to the final frontend URL.
- **Troubleshooting:** CORS error → `CORS_ORIGINS` must match the frontend URL exactly (scheme, no trailing slash). "Saved, but email notification could not be delivered" → check the App Password and server logs. Content not updating → see "Applying edits".
