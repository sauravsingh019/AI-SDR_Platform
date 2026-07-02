# 🚀 AI SDR — Quick Start Guide

> Get your AI SDR platform up and running in **under 5 minutes**.

---

# 1️⃣ Database Setup

Run the database setup script using a PostgreSQL superuser:

```bash
psql -U postgres -f database/setup.sql
```

The script automatically creates:

* **Database:** `ai_sdr_db`
* **Database User:** `sdr_user`
* **Password:** `sdr_pass`
* **Demo Account:** `demo@aisdr.com`
* **Demo Password:** `demo1234`

---

# 2️⃣ Backend Setup

Navigate to the backend directory and configure the Python environment.

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment

# Windows
venv\Scripts\activate

# macOS / Linux
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
```

Open the `.env` file and add at least one AI provider API key. If no API keys are provided, the application will automatically run in **Mock AI Mode**.

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

### Backend URLs

| Service    | URL                          |
| ---------- | ---------------------------- |
| API        | `http://localhost:8000`      |
| Swagger UI | `http://localhost:8000/docs` |

---

# 3️⃣ Frontend Setup

Navigate to the frontend directory and install the required dependencies.

```bash
cd frontend

npm install

echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

### Frontend URL

| Service     | URL                     |
| ----------- | ----------------------- |
| Application | `http://localhost:3000` |

---

# 🤖 Mock AI Mode

Don't have AI API keys yet? No problem.

Simply leave all AI provider keys empty in `backend/.env`, and the platform will automatically switch to the built-in **Mock AI Simulator**.

Mock AI Mode supports:

* ✅ FANT Lead Qualification
* ✅ Personalized Email Generation
* ✅ Complete Lead Management Workflow
* ✅ SDR Training & Testing
* ✅ End-to-End Application Testing

No external AI services are required.

---

# 📍 Application Routes

| Route        | Description                                                                                |
| ------------ | ------------------------------------------------------------------------------------------ |
| `/`          | Redirects to the Dashboard                                                                 |
| `/login`     | User Sign In & Registration                                                                |
| `/dashboard` | Sales analytics dashboard with KPI cards, charts, and pipeline metrics                     |
| `/leads`     | Lead management, AI qualification, personalized email generation, and CRUD operations      |
| `/campaigns` | Outreach campaigns, sequence builder, email logs, and domain warmup monitoring             |
| `/training`  | SDR Training Arena with AI buyer personas, voice/text roleplay, and performance scorecards |
| `/settings`  | User profile, API key management, theme preferences, and notification settings             |

---

# ✅ You're Ready!

Once both the backend and frontend servers are running, open:

```text
http://localhost:3000
```

Sign in using the demo credentials:

**Email**

```text
demo@aisdr.com
```

**Password**

```text
demo1234
```

You're now ready to explore the AI SDR platform, generate leads, build outreach campaigns, and practice sales conversations with AI-powered buyer personas.
