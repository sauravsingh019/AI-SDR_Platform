# 🤖 AI SDR – Intelligent Sales Development Representative Platform

> An enterprise-grade AI-powered Sales Development Representative (SDR) platform that automates lead qualification, prospect research, personalized outreach, AI sales coaching, and sales analytics using a resilient multi-provider AI architecture.

---

## 🌐 Live Demo : 
---

# 📌 Overview

AI SDR is a full-stack sales enablement platform built to streamline the complete outbound sales workflow.

Instead of manually researching prospects, qualifying leads, writing personalized emails, and preparing sales representatives, AI SDR automates these processes through intelligent AI agents.

The platform combines modern frontend technologies with a scalable FastAPI backend and integrates multiple AI providers with automatic fallback support, ensuring uninterrupted AI responses even if one provider becomes unavailable.

---

# ✨ Key Features

### 🔐 Secure Authentication

- JWT Authentication
- bcrypt Password Hashing
- Protected Routes
- User Registration & Login

---

### 👥 Lead Management

- Complete CRUD Operations
- Lead Pipeline Tracking
- Smart Search & Filtering
- Status Management

---

### 🤖 AI Lead Qualification

Automatically evaluates leads using the **FANT Framework**

- Fit
- Authority
- Need
- Timeline

Lead scores are categorized as:

- 🔴 Hot
- 🟠 Warm
- 🔵 Cold

---

### 📧 AI Outreach Generator

Generate personalized:

- Cold Emails
- LinkedIn InMails
- Sales Call Scripts
- Objection Handling Battle Cards

---

### 🎯 AI ICP Generator

Generate Ideal Customer Profiles based on your product description and automatically identify matching prospects.

---

### 🌍 Live Prospect Research

Automatically researches:

- Company Websites
- Business Information
- LinkedIn Profiles
- Business Emails

---

### 💬 Smart Inbox

Incoming responses are automatically classified into:

- Positive
- Neutral
- Negative

AI also generates contextual reply suggestions.

---

### 🎤 SDR Training Arena

Interactive AI roleplay simulator with multiple buyer personas:

- CTO
- CFO
- VP Sales

Provides:

- Performance Score
- Communication Analysis
- Objection Handling Review
- Closing Recommendations

---

### 📊 Analytics Dashboard

Visual dashboards for:

- Email Performance
- Lead Pipeline
- Team Leaderboard
- Conversion Metrics
- Meeting Bookings

---

### 🔌 CRM Integrations

Ready for integration with:

- Salesforce
- HubSpot
- Gmail
- Outlook
- Slack
- Twilio
- Calendly

---

# 🏗 Architecture

```
Frontend (Next.js 14)
        │
     REST API
        │
FastAPI Backend
        │
────────────────────────────
        │
        ├── PostgreSQL
        ├── JWT Authentication
        └── Multi AI Providers
                ├── Google Gemini
                ├── Groq
                ├── OpenRouter
                ├── OpenAI
                └── Mock AI Engine
```

---

# 🛠 Tech Stack

## Frontend

- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React

---

## Backend

- FastAPI
- Python
- SQLAlchemy ORM
- PostgreSQL
- JWT (python-jose)
- bcrypt
- Pydantic

---

## AI

- Google Gemini (gemini-2.0-flash)
- Groq (llama-3.3-70b-versatile)
- OpenAI (gpt-4o-mini)
- OpenRouter

---

## Database

- PostgreSQL

---

# 🚀 AI Workflow

```
Lead Created
     ↓
AI Qualification
     ↓
Prospect Research
     ↓
Outreach Generation
     ↓
Email Campaign
     ↓
Lead Response
     ↓
Sentiment Analysis
     ↓
Sales Dashboard
```

---

# ⚡ Multi-Provider AI Fallback

To ensure maximum reliability, AI SDR automatically switches providers if one becomes unavailable:

```
Google Gemini
     ↓
    Groq
     ↓
OpenRouter
     ↓
   OpenAI
     ↓
Mock AI Engine
```

This guarantees uninterrupted AI-powered features even during API rate limits or temporary outages.

---

# 📁 Project Structure

```
AI-SDR
├── frontend/
│   ├── app/            # Next.js pages & layouts
│   ├── components/     # Modals, Sidebars, and forms
│   ├── lib/            # API & Auth helper layers
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py     # FastAPI entry & demo seeding
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/     # DB models
│   │   ├── schemas/    # Serialization schemas
│   │   ├── routers/    # Auth, Leads, and AI routing endpoints
│   │   ├── services/   # sdr_ai.py & multi_provider.py cores
│   │   └── utils/      # Security utilities
│   ├── test_ai_keys.py # API validation tool
│   └── requirements.txt
│
├── database/
│   └── setup.sql       # PostgreSQL initial schemas & user seeds
│
└── README.md
```

---

# 🚀 Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/ai-sdr.git
cd ai-sdr
```

---

## 2. Database Setup

Run the setup SQL script to initialize the PostgreSQL database, schemas, and demo account seeds:

```bash
psql -U postgres -f database/setup.sql
```

This automatically creates the `ai_sdr_db` database, configured user `sdr_user` (`sdr_pass`), and imports initial data.

---

## 3. Backend Setup

Navigate to the backend directory, configure python environment, and start server:

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# macOS / Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

---

## 4. Frontend Setup

Navigate to the frontend directory, install dependencies, and start development server:

```bash
cd ../frontend

# Install dependencies
npm install

# Configure local API url pointer
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run Next.js server
npm run dev
```

---

# 🔑 Demo Credentials

Sign in using the pre-seeded account:

* **Email:** `demo@aisdr.com`
* **Password:** `demo1234`

---

# 🎯 Use Cases

- Sales Teams
- SDR Teams
- Startup Founders
- B2B SaaS Companies
- CRM Automation
- AI Sales Training
- Lead Qualification
- Outreach Automation

---

# 📈 Future Improvements

- Voice Calling AI Agent
- Email Automation
- WhatsApp Integration
- CRM Sync
- Calendar Booking AI
- Multi-language Support
- Team Collaboration
- Advanced AI Analytics

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

It helps others discover the project and motivates further development.

---

# 📄 License

Licensed under the **MIT License**.