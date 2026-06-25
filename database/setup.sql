-- ============================================================
-- AI SDR Database Setup Script
-- Run as PostgreSQL superuser: psql -U postgres -f setup.sql
-- ============================================================

-- Create database and user
CREATE USER sdr_user WITH PASSWORD 'sdr_pass';
CREATE DATABASE ai_sdr_db OWNER sdr_user;
GRANT ALL PRIVILEGES ON DATABASE ai_sdr_db TO sdr_user;

\c ai_sdr_db;

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'converted');
CREATE TYPE lead_score  AS ENUM ('hot', 'warm', 'cold', 'unscored');

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE users (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    email            VARCHAR(255) UNIQUE NOT NULL,
    hashed_password  VARCHAR(255) NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ
);

CREATE TABLE leads (
    id                    SERIAL PRIMARY KEY,
    name                  VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) NOT NULL,
    company               VARCHAR(255),
    job_title             VARCHAR(255),
    phone                 VARCHAR(50),
    website               VARCHAR(255),
    linkedin_url          VARCHAR(500),
    industry              VARCHAR(100),
    company_size          VARCHAR(50),
    annual_revenue        VARCHAR(100),
    pain_points           TEXT,
    notes                 TEXT,
    status                lead_status DEFAULT 'new',
    score                 lead_score  DEFAULT 'unscored',
    score_reason          TEXT,
    qualification_result  TEXT,
    generated_email       TEXT,
    owner_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_leads_owner_id ON leads(owner_id);
CREATE INDEX idx_leads_status   ON leads(status);
CREATE INDEX idx_leads_score    ON leads(score);
CREATE INDEX idx_users_email    ON users(email);

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at  BEFORE UPDATE ON users  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leads_updated_at  BEFORE UPDATE ON leads  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Seed: Demo user (password: demo1234)
-- ============================================================

INSERT INTO users (name, email, hashed_password) VALUES (
    'Demo User',
    'demo@aisdr.com',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'  -- bcrypt hash of 'demo1234'
);

-- Seed leads for the demo user
INSERT INTO leads (name, email, company, job_title, industry, company_size, annual_revenue, pain_points, status, owner_id)
VALUES
  ('Priya Sharma', 'priya@techfin.io', 'TechFin Solutions', 'VP of Engineering', 'Fintech', '200-500', '$10M-$50M', 'Scaling infra, reducing deployment time', 'new', 1),
  ('Arjun Mehta', 'arjun@growthco.in', 'GrowthCo', 'CEO', 'SaaS', '10-50', '$1M-$5M', 'Lead generation and sales automation', 'contacted', 1),
  ('Sneha Patel', 'sneha@retailchain.com', 'RetailChain India', 'CTO', 'E-commerce', '500-1000', '$50M-$100M', 'Inventory management, real-time analytics', 'qualified', 1);

GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO sdr_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sdr_user;
