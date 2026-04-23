# SmartSeason — Field Monitoring System

SmartSeason is a full-stack web application designed to help farm managers and field agents monitor crop progress, visualize fields on a map, and make smarter decisions using real-time weather data and insights.

What Makes It Different

Beyond basic CRUD:

 1. Interactive Map View — visualize all fields geographically
 2. Live Weather Integration — fetch real-time weather per field
 3. Smart Insights Engine — actionable recommendations based on:
    -crop type
    -growth stage
    -weather conditions
 4. Map-based Field Creation — select location directly from map (auto-fills coordinates)
 5. Role-based Access — admins vs agents

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Status Logic](#status-logic)
3. [Design Decisions](#design-decisions)
4. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
5. [Deployment Guide (Live Link)](#deployment-guide)
6. [Demo Credentials](#demo-credentials)
7. [API Reference](#api-reference)

---

## Architecture Overview

```
smartseason/
├── backend/                  # Node.js + Express API
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/         # Weather API integration
│       └── utils/            # Status logic + Insight engine
└── frontend/                 # React App
    └── src/
        ├── components/
        │   └── common/       # MapPicker, UI components
        ├── pages/            # Field views, Map view
        ├── context/          # Auth state
        └── utils/            # Axios client
```

**Stack:**
- Backend: Node.js, Express, PostgreSQL (`pg` driver), JWT, bcrypt
- Frontend: React 18<, React Router v5<, Axios, Leaflet (maps)
- Database: PostgreSQL
- External API: OpenWeather
- Hosting: Backend on Render, Frontend on Vercel

---

## Status Logic

1. **Field Status**
  Each field gets a **computed status** (never stored in the DB) based on two inputs:

  | Status       | Condition |
  |--------------|-----------|
  | `Completed`  | `stage === 'harvested'` |
  | `At Risk`    | `stage === 'ready'` AND planted > **120 days** ago (overdue harvest) |
  | `At Risk`    | `stage === 'growing'` AND planted > **90 days** ago (abnormally slow growth) |
  | `Active`     | Everything else |
  
  **Why this approach?** It is rule-based and transparent — a farm coordinator can understand exactly why a field is "At Risk" without needing ML or sensor data. The thresholds (90/120 days) are easily adjustable constants in `backend/src/utils/statusLogic.js`.
 
2. **Smart Insights Engine**
Each field generates recommendations like:

 High humidity → fungal risk
 Heat → irrigation needed
 Cold → slow growth
 
 Insights are based on:

 crop type
 growth stage
 live weather
---

3. **Weather Integration**
 For any field with coordinates:
 
 GET /api/fields/:id/weather
 
 Returns:
 
 {
   "weather": {
     "temp": 24,
     "humidity": 50,
     "condition": "Clouds"
   },
   "insights": [...]
 }

4. **Map Experience**
 Fields are displayed on an interactive map, where clicking a **marker** fetches weather **data** and **insights** for  that specific location. 
 To optimize performance, data is cached per field, preventing unnecessary API calls  on repeat interactions. The interface includes clear loading states to ensure a smooth and responsive user   experience.

5. **Map-based Location Selection**
 When creating or editing a field, users can select a location directly on the map. 
 The system automatically captures the **latitude** and **longitude** and, where possible, updates the location name. If needed, users can still enter location details manually as a fallback option.


## Design Decisions

1. **JWT over sessions** — Stateless authentication suits a deployed API that the frontend can call across domains. Tokens are stored in `localStorage` for simplicity; `httpOnly` cookies would be preferred for a production system.

2. **Computed status, not stored** — Status is derived fresh from `stage` + `planting_date` on every response. Storing it would create sync issues whenever the date changes.

3. **Role-based access in middleware AND controllers** — Routes are guarded by `requireAdmin` middleware, but the controller double-checks ownership for agents (defence in depth).

4. **PostgreSQL connection pool** — One shared `pg.Pool` instance avoids opening a new connection per request, which would exhaust DB limits fast under load.

5. **`proxy` in frontend `package.json`** — During development, CRA proxies `/api/*` calls to `localhost:5000`, so no CORS config is needed locally.

6. **Separate `migrate.js` and `seed.js`** — Keeping schema creation and demo data separate means you can re-seed without wiping the schema, and re-migrate without losing data.

---

## Step-by-Step Setup Guide

### Prerequisites

| Tool        | Version | Why |
|-------------|---------|-----|
| Node.js     | ≥ 18    | Required by React Scripts 5 and modern ES syntax |
| npm         | ≥ 9     | Comes with Node; manages packages |
| Git         | any     | Version control and deployment trigger |
| PostgreSQL  | ≥ 14    | Relational database; or use free Supabase cloud DB |

---

### STEP 1 — Install Node.js

**Why Node ≥ 18?** React Scripts 5 requires it, and Node 18 is the current LTS (Long Term Support) with security patches.

**macOS (via Homebrew — best practice: avoids permission issues with system Node):**
```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install node
node -v   # should print v18.x.x or higher
npm -v    # should print 9.x.x or higher
```

**Windows:**
Download the LTS installer from https://nodejs.org and run it. This installs both `node` and `npm`.

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

---

### STEP 2 — Install Git

**Why Git?** Git is used to push code to GitHub, which then triggers automatic deployments on Render and Vercel.

**macOS:** `brew install git`
**Windows:** Download from https://git-scm.com/download/win
**Ubuntu:** `sudo apt-get install git`

Verify: `git --version`

---

### STEP 3 — Set Up PostgreSQL (local development)

**Why PostgreSQL locally?** Running the DB locally means zero latency during development and you can inspect data freely.

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16

# Create the application database
createdb smartseason
```

**Windows:** Download the installer from https://www.postgresql.org/download/windows/ and use pgAdmin or psql.

**Ubuntu:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE DATABASE smartseason;"
sudo -u postgres psql -c "CREATE USER smartuser WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE smartseason TO smartuser;"
```

**Alternative (skip local Postgres):** Use [Supabase](https://supabase.com) free tier — create a project, copy the connection string, skip local Postgres entirely.

---

### STEP 4 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/smartseason.git
cd smartseason
```

If starting fresh (not cloning):
```bash
mkdir smartseason && cd smartseason
git init
# Copy the provided project files into this directory
```

---

### STEP 5 — Configure the Backend

```bash
cd backend
npm install
```

**Why `npm install`?** Downloads all dependencies listed in `package.json` into `node_modules/`. Never commit `node_modules/`.

Create your environment file:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/smartseason
JWT_SECRET=replace_this_with_a_long_random_string_at_least_32_chars
JWT_EXPIRES_IN=7d
OPENWEATHER_API_KEY=your_api_key
CLIENT_URL=http://localhost:3000
```

**Why a `.env` file?** Separates secrets from code. Never commit `.env` to Git — it's in `.gitignore`.

**Generate a strong JWT_SECRET (run in terminal):**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

### STEP 6 — Run Database Migrations and Seed

```bash
# Still inside backend/
node src/utils/migrate.js   # Creates all tables
node src/utils/seed.js      # Inserts demo users and sample fields
```

**Why separate migrate and seed?** Migration is a one-time schema setup. Seed is demo data you can re-run safely during development. On production, never run seed (it deletes real data first).

Expected output:
```
🌱 Running migrations...
✅ Migrations complete.

🌱 Seeding database...
✅ Seed complete.

📋 Demo Credentials:
  Admin : admin@smartseason.com  / password123
  Agent1: agent1@smartseason.com / password123
  Agent2: agent2@smartseason.com / password123
```

---

### STEP 7 — Start the Backend

```bash
npm run dev
```

This uses `nodemon` which auto-restarts the server on file changes — essential during development.

For production use `npm start` instead (no file watching overhead).

Expected output:
```
🚀 SmartSeason API running on port 5000
   ENV: development
```

Test the health endpoint: http://localhost:5000/api/health

---

### STEP 8 — Configure and Start the Frontend

Open a **new terminal window**:

```bash
cd frontend
npm install
cp .env.example .env
```

For local development the `.env` can remain as-is (the `proxy` in `package.json` handles API routing).

```bash
npm start
```

**Why `proxy` in `package.json`?** During development, React's dev server runs on port 3000 but your API is on 5000. The proxy setting forwards any `/api/*` request to `localhost:5000`, avoiding CORS issues without changing any code.

The browser will open automatically at http://localhost:3000.

---

### STEP 9 — Verify Everything Works

1. Open http://localhost:3000
2. Log in as Admin: `admin@smartseason.com` / `password123`
3. Check the Dashboard shows field stats
4. Navigate to Fields — see all sample fields
5. Click a field → view details and update history
6. Log out and log in as `agent1@smartseason.com` — only their assigned fields appear

---
### Important Notes
Weather features require an API key from OpenWeather
JWT is stored in localStorage (simplified approach for demo)
Map defaults to Nairobi coordinates

## Deployment Guide

We deploy in three parts:
1. **Database** → Supabase (free managed PostgreSQL)
2. **Backend** → Render (free Node.js hosting)
3. **Frontend** → Vercel (free React hosting, fastest CDN globally)

**Why this stack?**
- Supabase: Managed Postgres with a generous free tier; no DevOps overhead
- Render: Free tier for web services; auto-deploys from GitHub on push
- Vercel: Purpose-built for frontend SPAs; global edge network; instant deploys

---

### DEPLOY STEP 1 — Push Code to GitHub

```bash
# From the project root
git add .
git commit -m "Initial SmartSeason implementation"
git push origin main
```

Create the repo at https://github.com/new if you haven't already.

**Why GitHub?** Both Render and Vercel watch your GitHub repo and redeploy automatically whenever you push — no manual FTP or SSH needed.

---

### DEPLOY STEP 2 — Create a Free PostgreSQL Database on Supabase

1. Go to https://supabase.com → **Start your project** → Sign in with GitHub
2. Click **New Project**, choose a name (`smartseason`), set a strong DB password, pick a region close to Kenya (e.g. Frankfurt or Singapore)
3. Wait ~2 minutes for provisioning
4. Go to **Project Settings → Database → Connection string** (URI format)
5. Copy the URI — it looks like:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```
6. Keep this for the next step

**Why Supabase over Heroku Postgres?** Heroku removed its free tier. Supabase's free tier gives you 500 MB and never sleeps.

---

### DEPLOY STEP 3 — Deploy Backend to Render

1. Go to https://render.com → Sign in with GitHub
2. Click **New → Web Service**
3. Connect your GitHub repo → select the **backend** folder as root (or set `Root Directory` to `backend`)
4. Configure:
   - **Name:** `smartseason-api`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Instance Type:** Free
5. Add **Environment Variables** (click "Add Environment Variable"):
   ```
   DATABASE_URL    = [your Supabase connection string]
   JWT_SECRET      = [your generated secret]
   JWT_EXPIRES_IN  = 7d
   NODE_ENV        = production
   CLIENT_URL      = https://your-frontend.vercel.app   (update after step 4)
   ```
6. Click **Create Web Service**

Wait ~3 minutes. Render will build and deploy. You'll get a URL like `https://smartseason-api.onrender.com`.

**Run migrations on the live DB (one time only):**
```bash
# From your local machine, pointing at the Supabase DB:
DATABASE_URL="your_supabase_url" node src/utils/migrate.js
DATABASE_URL="your_supabase_url" node src/utils/seed.js
```

Or use Render's **Shell** tab to run these commands directly.

**Why Render?** Free tier, auto-deploys from Git, zero config for Node apps. Note: free tier sleeps after 15 mins of inactivity — first request takes ~30s to wake. Upgrade to paid ($7/mo) to eliminate this.

---

### DEPLOY STEP 4 — Deploy Frontend to Vercel

1. Go to https://vercel.com → Sign in with GitHub
2. Click **Add New → Project**
3. Import your GitHub repo
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Create React App (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. Add **Environment Variables**:
   ```
   REACT_APP_API_URL = https://smartseason-api.onrender.com
   ```
6. Click **Deploy**

In ~2 minutes you'll get a live URL like `https://smartseason.vercel.app`.

**Final step:** Go back to Render → your backend service → Environment → update `CLIENT_URL` to your Vercel URL → click **Save** (triggers a redeploy).

**Why Vercel?** It's the fastest option for React SPAs. Global CDN, automatic HTTPS, preview deployments for every PR, zero configuration. Industry standard for frontend deployments.

---

### Summary of Live URLs

| Component | URL |
|-----------|-----|
| Frontend  | `https://smartseason.vercel.app` |
| Backend   | `https://smartseason-api.onrender.com` |
| Health    | `https://smartseason-api.onrender.com/api/health` |

---

## Demo Credentials

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Admin   | admin@smartseason.com     | password123  |
| Agent 1 | agent1@smartseason.com    | password123  |
| Agent 2 | agent2@smartseason.com    | password123  |

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint         | Auth     | Description |
|--------|-----------------|----------|-------------|
| POST   | `/auth/login`    | Public   | Login, returns JWT |
| POST   | `/auth/register` | Admin    | Create new user |
| GET    | `/auth/me`       | Required | Get current user |

### Fields
| Method | Endpoint               | Auth   | Description |
|--------|------------------------|--------|-------------|
| GET    | `/fields`              | Any    | List fields (filtered by role) |
| GET    | `/fields/stats`        | Any    | Dashboard stats |
| GET    | `/fields/:id`          | Any    | Field detail + history |
| POST   | `/fields`              | Admin  | Create field |
| PUT    | `/fields/:id`          | Admin  | Update field |
| DELETE | `/fields/:id`          | Admin  | Delete field |
| POST   | `/fields/:id/updates`  | Any    | Log stage update / note |

### Users
| Method | Endpoint       | Auth  | Description |
|--------|----------------|-------|-------------|
| GET    | `/users`        | Admin | List all users |
| GET    | `/users/agents` | Admin | List agents + field counts |
| POST   | `/users`        | Admin | Create user |
| DELETE | `/users/:id`    | Admin | Delete user |

---

## Assumptions Made

1. A field can only be assigned to one agent at a time.
2. Both admins and agents can log field updates; admins can update any field.
3. Stage progression is not strictly enforced — a user can set any stage (real-world needs flexibility).
4. Passwords are not required to meet complexity rules beyond minimum length (can be tightened in `validate.js`).
5. The application is single-tenant (one organisation). Multi-tenancy would require a `team_id` on all tables.
