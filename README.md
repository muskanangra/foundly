# Foundly

Lost-and-found web app for the JUIT university community.

---

## Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

---

## Backend

### Prerequisites

- Python 3.11+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))

### Setup

```bash
cd backend

# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your Neon (or local Postgres) connection string
# The JWT_SECRET is already filled with a strong random value
#
# ⚡ Performance tip for Neon:
#   Use the POOLED connection string (hostname contains "-pooler", e.g.
#   ep-xxx-pooler.region.aws.neon.tech) rather than the direct URL.
#   Neon's HTTP proxy reduces connection overhead and cold-start latency.
#   The first request after a few minutes idle may be slow while Neon
#   wakes — the frontend shows skeletons during this time.

# 4. Run database migrations (creates all tables + seeds 8 categories)
alembic upgrade head

# 5. Start the development server
uvicorn app.main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Make a user admin

```bash
# From the backend/ directory, with the venv active:
python -m app.scripts.make_admin someone@juit.ac.in
```

---

## Deployment

### Database — Neon PostgreSQL

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string (the hostname contains `-pooler`).  
   It looks like: `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`

### Images — Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy the **API Environment variable** — it looks like:  
   `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`

### Running migrations against production

Render's free plan has no pre-deploy step.  Run migrations from your laptop before each deploy:

```bash
cd backend
source .venv/bin/activate
DATABASE_URL="<your-neon-pooled-url>" alembic upgrade head
```

### Backend — Render free web service

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo.
3. Render will detect `render.yaml` automatically; review and confirm.
4. Set the following **environment variables** in the Render dashboard (all marked `sync: false` in render.yaml, so they are never stored in git):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `JWT_SECRET` | A long random string (e.g. `openssl rand -hex 32`) |
| `FRONTEND_ORIGINS` | Your Vercel URL, e.g. `https://foundly.vercel.app` |
| `PUBLIC_BASE_URL` | Your Render URL, e.g. `https://foundly-api.onrender.com` |
| `CLOUDINARY_URL` | Cloudinary API environment variable |

The following are pre-filled in `render.yaml` and do not need to be set manually:

| Variable | Value |
|---|---|
| `PYTHON_VERSION` | `3.12.0` |
| `JWT_EXPIRE_MINUTES` | `10080` |
| `STORAGE_BACKEND` | `cloudinary` |

> **Free tier note:** Render's free web service sleeps after 15 minutes of inactivity.
> The first request after sleep takes ~60 seconds to respond while the server wakes up.
> Foundly automatically shows a "Waking up the server…" banner during this time and
> retries the request automatically — no action needed from the user.

### Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo.
2. Set the **Root Directory** to `frontend`.
3. Add one environment variable:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Render URL, e.g. `https://foundly-api.onrender.com` |

4. Deploy. `vercel.json` already configures the SPA rewrite so deep links like `/feed` and `/chats/3` work after a browser refresh.

---

### Project structure

```
backend/
├── app/
│   ├── main.py           FastAPI app, CORS, routers, error handlers
│   ├── config.py         Settings from .env (pydantic-settings)
│   ├── database.py       SQLAlchemy engine, SessionLocal, get_db
│   ├── core/
│   │   └── security.py   bcrypt hashing, JWT, auth dependencies
│   ├── models/           SQLAlchemy ORM models (one file per table)
│   ├── schemas/          Pydantic request/response schemas
│   ├── routers/          auth, categories, items, stats, search
│   ├── services/
│   │   ├── storage.py    Image validation & save (single responsibility)
│   │   └── items.py      Item query logic (temporary text search)
│   ├── dsa/              Trie + Hash Table (Part 2)
│   └── scripts/
│       └── make_admin.py Promote a user to admin by email
├── alembic/              Migrations
├── alembic.ini
├── requirements.txt
├── .env.example
└── uploads/              Served at /uploads (git-ignored)
```
