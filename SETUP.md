# AI SDR — Quick Start Guide

> Get up and running in under 5 minutes.

---

## 1. Database Setup

Run the setup script as PostgreSQL superuser:

```bash
psql -U postgres -f database/setup.sql
```

This creates:
- **Database:** `ai_sdr_db`
- **User:** `sdr_user` / `sdr_pass`
- **Demo login:** `demo@aisdr.com` / `demo1234`

---

## 2. Backend Setup

```bash
cd backend

python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS / Linux

pip install -r requirements.txt
cp .env.example .env
# Edit .env — add at least one AI key (or leave empty for Mock AI mode)

uvicorn app.main:app --reload --port 8000
```

- **API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs

---

## 3. Frontend Setup

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

- **App:** http://localhost:3000

---

## Mock AI Mode

No API keys? No problem. Leave all AI keys empty in `backend/.env` — the **Mock AI Simulator** activates automatically and supports:
- Full FANT lead qualification
- Personalized email generation
- End-to-end workflow testing

No external AI services needed.

---

## Application Routes

| Route | Description |
| ------------ | ------------------------------------------------------------------------ |
| `/` | Redirects to Dashboard |
| `/login` | Sign In / Register |
| `/dashboard` | Analytics dashboard with KPI cards and pipeline charts |
| `/leads` | Lead management — CRUD, AI qualification, email generation |
| `/campaigns` | Outbox email logs and campaign dispatch |
| `/settings` | Profile, API keys, theme, and notifications |

---

Once both servers are running, open **http://localhost:3000** and sign in with `demo@aisdr.com` / `demo1234`.
