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
