# 🤖 AI SDR — Intelligent Sales Development Representative Platform

> A full-stack, production-ready AI-powered Sales Development platform built with **Next.js 14**, **FastAPI**, **PostgreSQL**, and a **multi-provider AI fallback chain** (Gemini → Groq → OpenRouter → OpenAI).

---

## ✨ Feature Highlights

| Feature | Details |
|---|---|
| **JWT Authentication** | Secure register/login with bcrypt hashing + JWT tokens |
| **Lead CRUD** | Full Create, Read, Update, Delete with inline editing |
| **AI Lead Qualification** | FANT scoring (Hot 🔴 / Warm 🟠 / Cold 🔵) via multi-provider AI |
| **Personalized Email Generation** | Per-lead cold outreach email drafted by AI |
| **Multi-Provider AI Fallback** | Gemini → Groq → OpenRouter → OpenAI — auto-switches on failure |
| **Mock AI Simulator** | Rule-based fallback if all API keys are missing |
| **AI Dialer Modal** | Simulated call script + objection handling per lead |
| **Campaigns / Outbox** | Email log table with open rate & click rate tracking |
| **Settings Page** | Manage profile, API keys, theme toggle, notifications |
| **Dark / Light Theme** | Full system-aware dark mode with animated backgrounds |
| **Dashboard Analytics** | Pipeline charts, KPI cards, lead funnel (Recharts) |
| **Animated UI** | Floating feature cards, modal entrance animations, micro-interactions |
| **Responsive Design** | Mobile-first layout, collapsible sidebar |

---

## 🏗️ Architecture

```
┌──────────────────────┐      HTTP / REST      ┌──────────────────────────┐
│   Next.js Frontend   │ ◄───────────────────► │   FastAPI Backend         │
│   (port 3000)        │                       │   (port 8000)             │
└──────────────────────┘                       └───────────┬──────────────┘
                                                           │
                      ┌────────────────────────────────────┼──────────────────────────┐
                      │                                    │                          │
            ┌─────────▼──────────┐          ┌─────────────▼──────────┐   ┌───────────▼──────────┐
            │   PostgreSQL DB    │          │  AI Provider Chain      │   │  JWT Auth            │
            │   (port 5432)      │          │  Gemini → Groq →        │   │  python-jose +       │
            │   users + leads    │          │  OpenRouter → OpenAI    │   │  bcrypt              │
            └────────────────────┘          └────────────────────────┘   └──────────────────────┘
```

---

## 📁 Project Structure

```
ai-sdr/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, router registration
│   │   ├── config.py                # Pydantic Settings — reads .env
│   │   ├── database.py              # SQLAlchemy engine + session factory
│   │   ├── models/
│   │   │   └── models.py            # User + Lead ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py              # POST /api/auth/register, /login, GET /me
│   │   │   ├── leads.py             # Full CRUD /api/leads/
│   │   │   └── ai.py                # POST /api/ai/qualify, /generate-email
│   │   ├── services/
│   │   │   ├── ai_service.py        # Provider-agnostic AI interface
│   │   │   └── multi_provider.py    # Fallback chain: Gemini→Groq→OpenRouter→OpenAI
│   │   └── utils/
│   │       └── auth.py              # JWT encode/decode helpers
│   ├── test_ai_keys.py              # Diagnostic: tests all configured API keys
│   ├── requirements.txt             # Python dependencies
│   ├── .env                         # Your local secrets (not committed)
│   └── .env.example                 # Template for environment variables
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Root — redirects to /dashboard
│   │   ├── layout.tsx               # Root layout with ThemeProvider + Toaster
│   │   ├── globals.css              # Tailwind base + all custom animations
│   │   ├── theme-provider.tsx       # next-themes dark/light toggle wrapper
│   │   ├── login/
│   │   │   └── page.tsx             # Sign In + Register page (animated)
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Analytics dashboard with Recharts
│   │   ├── leads/
│   │   │   └── page.tsx             # Lead table, CRUD, AI triggers
│   │   ├── campaigns/
│   │   │   └── page.tsx             # Outbox email logs, campaign dispatch
│   │   └── settings/
│   │       └── page.tsx             # Profile, API keys, preferences
│   ├── components/
│   │   ├── Sidebar.tsx              # Navigation sidebar with theme toggle
│   │   ├── LeadModal.tsx            # Create / Edit lead form modal
│   │   ├── LeadDetailModal.tsx      # AI score + email viewer modal (tabbed)
│   │   └── AIDialerModal.tsx        # AI call script + objection handler modal
│   └── lib/
│       ├── api.ts                   # Axios instance + all API endpoint functions
│       ├── auth.tsx                 # Auth context + useAuth hook
│       └── notification-utils.ts   # Browser notification helpers
│
├── database/
│   └── setup.sql                    # DB init: tables, indexes, seed demo user
│
├── postman/
│   └── AI_SDR_Collection.json       # Ready-to-import Postman collection
│
├── screenshots/
│   └── *.png                        # Application screenshots
│
├── .gitignore
├── SETUP.md                         # 5-minute quick start guide
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 18+ |
| Python | 3.11+ |
| PostgreSQL | 15+ |

> **AI Keys are optional** — the app runs fully with the built-in Mock AI Simulator even without any API keys.

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-sdr.git
cd ai-sdr
```

---

### Step 2 — Database Setup

```bash
# Connect as postgres superuser and run the setup script
psql -U postgres -f database/setup.sql
```

This creates:
- Database: `ai_sdr_db`
- User: `sdr_user` / password: `sdr_pass`
- All tables, indexes, and update triggers
- Demo user: `demo@aisdr.com` / password: `demo1234`

---

### Step 3 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Linux / Mac
venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env — add your API keys (or leave as-is to use Mock AI)
```

```bash
# Start the backend server
uvicorn app.main:app --reload --port 8000
```

- **API Docs (Swagger UI):** http://localhost:8000/docs
- **Redoc:** http://localhost:8000/redoc

#### Optional: Test your API keys
```bash
python test_ai_keys.py
```

---

### Step 4 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
```

- **App URL:** http://localhost:3000

---

## 🔑 Environment Variables

### Backend — `backend/.env`

```env
# Database
DATABASE_URL=postgresql://sdr_user:sdr_pass@localhost:5432/ai_sdr_db

# Auth
SECRET_KEY=your-super-secret-key-minimum-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Provider Keys — Fallback order: Gemini → Groq → OpenRouter → OpenAI
# Set to "mock" or leave empty to skip that provider
GEMINI_API_KEY=your-gemini-api-key-here
GROQ_API_KEY=your-groq-api-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENAI_API_KEY=sk-proj-your-openai-key-here
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login — returns JWT access token |
| `GET`  | `/api/auth/me` | Get authenticated user profile |

### Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST`   | `/api/leads/` | Create a new lead |
| `GET`    | `/api/leads/` | List all leads (supports `?status=`, `?search=`) |
| `GET`    | `/api/leads/stats` | Get pipeline statistics |
| `GET`    | `/api/leads/{id}` | Get a single lead by ID |
| `PUT`    | `/api/leads/{id}` | Update a lead |
| `DELETE` | `/api/leads/{id}` | Delete a lead |

### AI Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/qualify` | Run FANT qualification on a lead |
| `POST` | `/api/ai/generate-email` | Generate personalized cold outreach email |

---

## 🤖 AI Integration Details

### Multi-Provider Fallback Chain

The backend cycles through available providers automatically:

```
Request → Gemini 1.5 Flash
            ↓ (fail / quota)
          Groq LLaMA-3.3-70B
            ↓ (fail / quota)
          OpenRouter (Claude / Mistral)
            ↓ (fail / quota)
          OpenAI GPT-4o-mini
            ↓ (all fail)
          Mock AI Simulator (always works)
```

### Lead Qualification — FANT Framework

Scores each lead across **Fit, Authority, Need, Timeline**:

| Score | Criteria |
|---|---|
| 🔴 **HOT** | Decision maker, large company, clear pain points, near-term urgency |
| 🟠 **WARM** | Good fit but missing some criteria (small team, vague timeline) |
| 🔵 **COLD** | Poor fit, no clear need, unlikely to convert near-term |

### Email Generation

Generates personalized cold outreach with:
- Subject line tailored to company + role
- Company-specific opening hook
- Value proposition tied to stated pain points
- Soft CTA (15-min call or async reply)
- Tone adapts by score: confident (Hot), consultative (Warm), curiosity-led (Cold)

### Mock AI Simulator

Activates automatically when **all** API keys are missing/empty. Produces:
- Rule-based FANT scores using job title, company size, revenue, pain points
- Segment-matched email templates (Hot / Warm / Cold tone variants)

---

## 🗄️ Database Schema

```sql
-- Users table
users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
)

-- Leads table
leads (
  id                   SERIAL PRIMARY KEY,
  name                 VARCHAR(255) NOT NULL,
  email                VARCHAR(255) NOT NULL,
  company              VARCHAR(255),
  job_title            VARCHAR(255),
  phone                VARCHAR(50),
  website              VARCHAR(500),
  linkedin_url         VARCHAR(500),
  industry             VARCHAR(255),
  company_size         VARCHAR(100),
  annual_revenue       VARCHAR(100),
  pain_points          TEXT,
  notes                TEXT,
  status               VARCHAR(50) DEFAULT 'new',     -- new|contacted|qualified|unqualified|converted
  score                VARCHAR(50) DEFAULT 'unscored', -- hot|warm|cold|unscored
  score_reason         TEXT,
  qualification_result TEXT,
  generated_email      TEXT,
  owner_id             INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
)
```

---

## 🧪 Testing with Postman

1. Import `postman/AI_SDR_Collection.json` into Postman
2. Run **Login** — token auto-saves to `{{token}}` collection variable
3. All subsequent requests use the saved token automatically
4. Sequence: **Create Lead** → saves `{{lead_id}}` → **Qualify Lead** → **Generate Email**

---

## 🛠️ Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| Next.js 14 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| Recharts | Dashboard charts |
| next-themes | Dark / Light mode |
| Lucide React | Icon library |
| Axios | HTTP client |
| react-hot-toast | Toast notifications |

### Backend
| Tool | Purpose |
|---|---|
| FastAPI | Async Python web framework |
| SQLAlchemy | ORM for PostgreSQL |
| Pydantic v2 | Data validation + settings |
| python-jose | JWT encoding/decoding |
| passlib + bcrypt | Password hashing |
| Uvicorn | ASGI server |
| httpx | Async HTTP for AI provider calls |

### Infrastructure
| Tool | Purpose |
|---|---|
| PostgreSQL 15 | Primary relational database |
| Google Gemini 1.5 Flash | Primary AI provider |
| Groq LLaMA-3.3-70B | Secondary AI provider |
| OpenRouter | Tertiary AI provider |
| OpenAI GPT-4o-mini | Quaternary AI provider |

---

## 👨‍💻 Author

Built as part of **AI SDR Intern Technical Assessment** — demonstrating full-stack development, multi-provider AI orchestration, and production-ready UI/UX.
