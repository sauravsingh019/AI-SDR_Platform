# 🤖 AI SDR — Intelligent Sales Development Representative Platform

> A production-ready, full-stack AI-powered Sales Development Representative (SDR) platform built with **Next.js 14**, **FastAPI**, **PostgreSQL**, and a resilient **multi-provider AI fallback architecture** (Gemini → Groq → OpenRouter → OpenAI). The platform combines intelligent lead qualification, live prospect sourcing, personalized outreach generation, and interactive SDR training into a unified sales enablement solution.

---

# ✨ Key Features

| Feature                                | Description                                                                                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **JWT Authentication**                 | Secure user registration and login with **bcrypt password hashing** and **JWT-based authentication**.                                                                                  |
| **Lead Management**                    | Complete CRUD functionality with inline editing, search, filtering, and pipeline management.                                                                                           |
| **AI Lead Qualification**              | Automatically evaluates leads using the **FANT framework**, categorizing them as **Hot 🔴**, **Warm 🟠**, or **Cold 🔵** through a multi-provider AI pipeline.                         |
| **AI-Powered Personalization**         | Generates personalized cold emails, LinkedIn InMails, call scripts, follow-up messages, and objection-handling battle cards for every lead.                                            |
| **SDR Training Arena 🏆**              | Interactive voice and text roleplay with AI buyer personas such as CTOs, CFOs, and VP Sales, including performance scorecards, coaching insights, and AI-generated feedback.           |
| **AI ICP Lead Generator 🧠**           | Analyzes your product's value proposition, identifies ideal customer personas, and automatically imports relevant live prospects.                                                      |
| **Live Lead Sourcing 🌐**              | Uses **httpx** together with DuckDuckGo HTML search to crawl company websites and discover publicly available LinkedIn profiles and business information.                              |
| **Outreach Sequence Builder ⛓️**       | Design and manage multi-day outreach campaigns across Email, LinkedIn, and Phone touchpoints.                                                                                          |
| **Domain Warmup & Deliverability 🛡️** | Monitor sender reputation, email deliverability, spam recovery actions, and SMTP safety metrics.                                                                                       |
| **Connection Hub 🔌**                  | Connect with leading sales and productivity platforms including HubSpot, Salesforce, Google Workspace, Outlook, Twilio, Slack, Sales Navigator, Calendly, Zapier, Zoom, and Apollo.io. |
| **Analytics Dashboard**                | Interactive KPI cards, sales pipeline analytics, sentiment tracking, team leaderboards, and visual reports powered by Recharts.                                                        |
| **Dark & Light Themes**                | Fully responsive UI with system-aware theme switching and modern animated backgrounds.                                                                                                 |

---

# 🏗️ System Architecture

```text
┌──────────────────────┐      HTTP / REST      ┌──────────────────────────┐
│   Next.js Frontend   │ ◄───────────────────► │    FastAPI Backend       │
│     (Port 3000)      │                       │      (Port 8000)         │
└──────────────────────┘                       └───────────┬──────────────┘
                                                           │
                      ┌────────────────────────────────────┼──────────────────────────┐
                      │                                    │                          │
            ┌─────────▼──────────┐          ┌─────────────▼──────────┐   ┌───────────▼──────────┐
            │   PostgreSQL DB    │          │ Multi-Provider AI       │   │ Authentication       │
            │   Users & Leads    │          │ Gemini → Groq →         │   │ JWT + bcrypt         │
            │     Port 5432      │          │ OpenRouter → OpenAI     │   │ python-jose          │
            └────────────────────┘          └─────────────────────────┘   └──────────────────────┘
```

---

# 📁 Project Structure

```text
ai-sdr/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── leads.py
│   │   │   └── ai.py
│   │   ├── services/
│   │   │   ├── ai_service_new.py
│   │   │   └── multi_provider.py
│   │   └── utils/
│   │       └── auth.py
│   ├── test_ai_keys.py
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── theme-provider.tsx
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── campaigns/
│   │   ├── training/
│   │   └── settings/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── LeadModal.tsx
│   │   ├── LeadDetailModal.tsx
│   │   └── AIDialerModal.tsx
│   └── lib/
│       ├── api.ts
│       ├── auth.tsx
│       └── notification-utils.ts
```

---

# 🚀 Setup & Installation

## Prerequisites

| Software   | Version |
| ---------- | ------- |
| Node.js    | 18+     |
| Python     | 3.11+   |
| PostgreSQL | 15+     |

---

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-sdr.git
cd ai-sdr
```

---

## 2. Database Setup

```bash
psql -U postgres -f database/setup.sql
```

This script automatically creates:

* **Database:** `ai_sdr_db`
* **Database User:** `sdr_user`
* **Password:** `sdr_pass`
* **Demo Account:** `demo@aisdr.com`
* **Demo Password:** `demo1234`

---

## 3. Backend Setup

```bash
cd backend

python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
```

Update the `.env` file with your preferred AI provider API keys. If no provider is configured, the application automatically falls back to the built-in Mock AI simulator.

Start the backend server:

```bash
uvicorn app.main:app --reload --port 8000
```

**Swagger Documentation**

```
http://localhost:8000/docs
```

---

## 4. Frontend Setup

```bash
cd frontend

npm install

echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Application URL:

```
http://localhost:3000
```

---

# 📡 API Reference

## Authentication

| Method | Endpoint             | Description                               |
| ------ | -------------------- | ----------------------------------------- |
| POST   | `/api/auth/register` | Register a new account                    |
| POST   | `/api/auth/login`    | Authenticate and receive a JWT token      |
| GET    | `/api/auth/me`       | Retrieve the authenticated user's profile |

---

## Lead Management

| Method | Endpoint           | Description                                |
| ------ | ------------------ | ------------------------------------------ |
| POST   | `/api/leads/`      | Create a new lead                          |
| GET    | `/api/leads/`      | Retrieve all leads with optional filtering |
| GET    | `/api/leads/stats` | Fetch pipeline statistics                  |
| PUT    | `/api/leads/{id}`  | Update a lead                              |
| DELETE | `/api/leads/{id}`  | Delete a lead                              |

---

## AI Services

| Method | Endpoint                 | Description                           |
| ------ | ------------------------ | ------------------------------------- |
| POST   | `/api/ai/qualify`        | Perform FANT lead qualification       |
| POST   | `/api/ai/generate-email` | Generate personalized outbound emails |
| POST   | `/api/ai/rate-pitch`     | Evaluate SDR voice or text pitches    |
| POST   | `/api/ai/icp-leads`      | Generate ICP-based live prospects     |

---

# 🤖 AI Pipeline

## Multi-Provider AI Fallback

The backend automatically switches providers whenever one becomes unavailable or reaches its quota.

```text
Request
   │
   ▼
Gemini 1.5 Flash
   │
   ▼
Groq LLaMA 3.3 70B
   │
   ▼
OpenRouter
(Claude / Mistral)
   │
   ▼
OpenAI GPT-4o Mini
   │
   ▼
Mock AI Simulator
```

This architecture ensures uninterrupted AI functionality without requiring manual intervention.

---

# 🌐 Live Lead Sourcing Engine

### Domain Intelligence

The application crawls target company websites using **httpx**, extracting:

* Website metadata
* Business descriptions
* Contact information
* Email patterns
* Public company content

### LinkedIn Discovery

The platform searches DuckDuckGo using LinkedIn-specific queries such as:

```text
site:linkedin.com/in/
```

It then parses search results to identify:

* Prospect names
* Current job titles
* Company names
* Public LinkedIn profiles

---

# 🏆 SDR Training Arena

The built-in AI coaching environment enables SDRs to practice real-world sales conversations.

### Features

* AI buyer personas (CTO, CFO, VP Sales)
* Voice and text conversations
* Web Speech API integration
* Objection-handling simulations
* Circular performance scorecards
* AI-generated coaching recommendations

Each pitch is evaluated across multiple criteria, including:

* Tone & Empathy
* Value Communication
* Objection Handling
* Confidence
* Closing Effectiveness

The system provides detailed feedback to help sales representatives continuously improve their performance.

---

# ⚡ Technology Stack

### Frontend

* Next.js 14
* React
* TypeScript
* Tailwind CSS
* ShadCN UI
* Recharts
* Framer Motion

### Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* Pydantic
* python-jose
* bcrypt
* httpx

### AI

* Google Gemini
* Groq
* OpenRouter
* OpenAI
* Multi-Provider Fallback Engine

---

# 📄 License

This project is intended for educational, research, and commercial development purposes. Feel free to customize and extend it according to your business requirements.
