# Civic Voice — Smart Citizen Engagement Platform

A transparent, accountability-driven platform that bridges citizens and civic authorities (BBMP, Bengaluru). **Java Full Stack Edition**: Spring Boot + PostgreSQL backend with a JavaScript (vanilla JS + Tailwind) frontend.

> **Note:** This app can run locally on your machine, **or** use the live deployment below.

## 🌍 Live Demo

The app is deployed to Render:

| Component | URL |
|---|---|
| **Frontend** | https://civicvoice-frontend-0j4b.onrender.com |
| **Backend API** | https://civicvoice-backend-t7m6.onrender.com/api |

> The local URLs below (`http://localhost:8080`, `http://localhost:3000`) only work **after you start the backend and frontend** yourself. Use the Live Demo links above to try the deployed version.

## ⚡ Quick Start (Recommended: Windows one-command)

```bat
git clone https://github.com/rishikakp/CIVIC-VOICE.git
cd CIVIC-VOICE
start-app.bat
```

`start-app.bat` starts everything in order and is safe to re-run (it skips
services that are already up):

1. **PostgreSQL** — starts the bundled local cluster (`civicvoice-backend/pgdata`)
   using `C:\Program Files\PostgreSQL\17\bin` and ensures the `civic_voice` DB exists.
2. **Backend** — runs `civicvoice-backend/target/civicvoice-backend-1.0.0.jar`
   on port 8080 (builds with Maven first only if the jar is missing) and waits
   until `GET /api/issues` responds.
3. **Frontend** — serves `civicvoice-frontend/` on port 3000 via `tools/static-server.js`
   (zero npm dependencies).

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8080/api
- Logs: `civicvoice-backend/app_out.log`, `civicvoice-backend/app_err.log`, `civicvoice-backend/pg_started.log`

## ⚡ Quick Start (Docker / manual)

Requires Docker (for PostgreSQL) and Maven 3.9+ (to build the backend):

```bash
git clone https://github.com/rishikakp/CIVIC-VOICE.git
cd CIVIC-VOICE

# Start PostgreSQL (note: uses DB name "civicvoice"; set DB_URL accordingly,
# or just use start-app.bat which uses the local cluster + civic_voice DB)
docker compose up -d

# Build and run backend
cd civicvoice-backend
mvn clean package -DskipTests
java -jar target/civicvoice-backend-1.0.0.jar

# In a second terminal — serve frontend
cd ../civicvoice-frontend
npx serve .
```

- **Backend:** http://localhost:8080 (starts after build)
- **Frontend:** http://localhost:3000

## ⚡ Quick Start (Manual Setup)

### Prerequisites
- Java 17+
- Maven 3.9+
- PostgreSQL 14+ running on `localhost:5432`
- Node.js (for frontend static server)

### 1. Database
```bash
# Create the database
psql -U postgres -h localhost -c "CREATE DATABASE civic_voice;"

# Or use the bundled script
psql -U postgres -h localhost -f db/setup-db.sql
```

> Tables are auto-created by Hibernate on startup (`spring.jpa.hibernate.ddl-auto=update`).

### 2. Backend (Spring Boot)
```bash
cd civicvoice-backend
mvn spring-boot:run
```

- **Backend URL (after starting):** http://localhost:8080
- Health check: `GET http://localhost:8080/api/issues?page=1`
- Default admin email: `admin@civicvoice.local`

### 3. Frontend (JavaScript)
```bash
cd civicvoice-frontend
npx serve .
```

- **Frontend URL (after starting):** http://localhost:3000
- Configured to call backend at http://localhost:8080/api

### Demo accounts (no password needed)
| Role | Email | Notes |
|---|---|---|
| Admin | `admin@civicvoice.local` | Full admin dashboard |
| Citizen | `citizen@civicvoice.local` | Report + track issues |
| Resident | `resident@civicvoice.local` | Vote on issues |

> Sign-in requires no password — the platform upserts a user row on first login by email.

---

## 🧱 Architecture

```
┌─────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────┐
│  Frontend (JavaScript)  │ HTTP │  Spring Boot Backend :8080   │  JPA │  PostgreSQL │
│  static HTML + Tailwind │ ───▶ │  Controllers → Services →    │ ───▶ │  :5432      │
│  fetch() REST calls     │  JSON│  Repositories (Spring Data)   │      │  civic_voice│
└─────────────────────────┘      └──────────────────────────────┘      └─────────────┘
                                        │  files
                                        ▼
                                   /uploads (local image storage)
```

### Layers
| Layer | Package | Responsibility |
|---|---|---|
| Controller | `com.civicvoice.controller` | REST endpoints, input binding, admin authorization |
| Service | `com.civicvoice.service` | Business logic, JPA Specifications (dynamic filters), voting |
| Repository | `com.civicvoice.repository` | Spring Data JPA persistence |
| Model | `com.civicvoice.model` | JPA entities + enums mapping to tables |
| DTO | `com.civicvoice.dto` | Request/response records, API contracts |
| Config | `com.civicvoice.config` | CORS, static upload serving, seed data |
| Exception | `com.civicvoice.exception` | Centralized error handling → consistent JSON |

---

## 🌐 REST API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Upsert user by email, returns user + `admin` flag |
| `POST` | `/api/auth/clerk` | Bearer (Clerk JWT) | Exchange Clerk JWT for app session token + user |
| `GET` | `/api/auth/me` | Bearer | Current identity (Clerk or app token) |
| `GET` | `/api/auth/admin-check?email=` | Public | Returns whether email is admin |
| `GET` | `/api/issues` | Public | Paginated list with filters (see below) |
| `GET` | `/api/issues/mine?email=&page=` | Public | Issues reported by a user |
| `POST` | `/api/issues` (multipart) | Public | Create issue with optional photo |
| `PATCH` | `/api/issues/{id}/status` | Admin | Update status (SUBMITTED/ASSIGNED/IN_PROGRESS/RESOLVED) |
| `PATCH` | `/api/issues/{id}/assign` | Admin | Assign to a field worker |
| `POST` | `/api/issues/{id}/vote` | Public | Upvote an issue |
| `GET` | `/api/admin/overview` | Admin | Dashboard stats + quick lists |

### `GET /api/issues` query parameters
`q` (search across description/location/reporter), `status`, `severity`, `type`, `area`, `queue` (`unassigned` | `critical` | `stale` = 7+ days), `email` (filter by reporter), `page`, `pageSize`.

### Example requests
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@civicvoice.local","firstName":"Admin"}'

# Create issue with photo
curl -X POST http://localhost:8080/api/issues \
  -F "description=Pothole near the bridge" -F "issueType=Roads" \
  -F "severity=CRITICAL" -F "locationName=Marathahalli, Bengaluru" \
  -F "coordinates=12.9569,77.7011" -F "email=citizen@civicvoice.local" \
  -F "image=@photo.jpg"

# Update status (admin)
curl -X PATCH "http://localhost:8080/api/issues/<id>/status?adminEmail=admin@civicvoice.local" \
  -H "Content-Type: application/json" -d '{"status":"IN_PROGRESS"}'
```

---

## 🗄️ Database Design (PostgreSQL)

Tables are created automatically by Hibernate. Logical schema:

### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID (PK) | auto-generated |
| `email` | VARCHAR(320) | **UNIQUE**, NOT NULL |
| `first_name` | VARCHAR | nullable |
| `last_name` | VARCHAR | nullable |
| `image_url` | VARCHAR(1024) | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now |
| `updated_at` | TIMESTAMPTZ | NOT NULL |

### `issues`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID (PK) | auto-generated |
| `description` | TEXT | NOT NULL |
| `issue_type` | VARCHAR(120) | NOT NULL |
| `severity` | VARCHAR(20) | NOT NULL, enum |
| `status` | VARCHAR(20) | NOT NULL, enum, default `SUBMITTED` |
| `assigned_to` | VARCHAR(200) | nullable |
| `location` | VARCHAR(500) | nullable |
| `coordinates` | VARCHAR(200) | nullable (lat,lng) |
| `location_name` | VARCHAR(500) | nullable |
| `image_url` | VARCHAR(1024) | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now |
| `user_id` | UUID (FK → `users.id`) | nullable, ON DELETE SET NULL |

### `votes`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID (PK) | auto-generated |
| `issue_id` | UUID (FK → `issues.id`) | NOT NULL, ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now |

### Enums
```sql
severity: LOW, MEDIUM, HIGH, CRITICAL
status:   SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED
```

### Entity relationships
- **User 1 ──── N Issue** — one user reports many issues
- **Issue 1 ──── N Vote** — issues receive many votes

---

## 🚀 Features

### Citizen
- Report an issue in under a minute (photo + description + category + severity)
- Auto-capture GPS location (with manual override)
- Browse and vote on issues from the community
- Track status of own reports

### Admin
- Dashboard with live stats (open / resolved / critical / unassigned)
- Quick lists: unassigned, critical, in-progress
- Filters: search, status, severity, queue (`stale` = ignored 7+ days)
- One-click status updates and assignment to field workers

### Technical
- Dynamic filtering via **JPA Specifications** (no SQL injection, type-safe)
- **Pagination** on all list endpoints
- Local **image upload** served from `/uploads/**`
- Centralized **exception handling** → consistent `{ "error": "..." }` responses
- **CORS** enabled for the JS frontend
- **Seed data** is disabled (add issues via the UI or API)

---

## 📁 Project Structure

```
CIVIC-VOICE/
├── civicvoice-backend/            # Spring Boot application
│   ├── pom.xml                    # Maven config (Spring Boot 3.3, Java 17)
│   ├── src/main/java/com/civicvoice/
│   │   ├── CivicVoiceApplication.java
│   │   ├── config/                # CORS, uploads, DataInitializer
│   │   ├── controller/            # REST controllers
│   │   ├── dto/                   # Request/response records
│   │   ├── exception/             # GlobalExceptionHandler
│   │   ├── model/                 # JPA entities + enums
│   │   ├── repository/            # Spring Data repositories
│   │   └── service/               # Business logic
│   └── src/main/resources/application.properties
├── civicvoice-frontend/           # JavaScript frontend (vanilla + Tailwind)
│   ├── index.html                 # Landing + explore + voting
│   ├── login.html                 # Email sign-in
│   ├── report.html                # Report issue (photo + GPS)
│   ├── my.html                    # My issues tracker
│   ├── admin.html                 # Admin dashboard
│   └── js/ (api.js, ui.js)        # API client + UI helpers
├── db/
│   └── setup-db.sql               # Database creation script
└── README.md
```

---

## 🔧 Configuration

Environment variables / `application.properties`:

| Property | Default | Description |
|---|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/civic_voice` | DB connection |
| `spring.datasource.username` | `postgres` | DB user |
| `spring.datasource.password` | `postgres` | DB password |
| `app.admin-emails` / `ADMIN_EMAILS` | `admin@civicvoice.local` | Comma-separated admin list |
| `app.upload-dir` | `uploads` | Local image storage folder |
| `server.port` | `8080` | Backend port |

Frontend base URL resolution (`js/config.js` + `js/api.js`), in priority order:
1. `localStorage.civicvoice_api` (manual override)
2. `window.__API_BASE__` — automatically `http://localhost:8080/api` when the page is
   opened from `localhost`/`127.0.0.1`, otherwise the live Render backend.

---

## 🔐 Authentication (Clerk)

Sign-in is powered by [Clerk](https://clerk.com). `login.html` offers **Continue with
Clerk** (email/OAuth via the prebuilt Clerk UI) plus the password-less demo sign-in.

### How it works

1. The browser loads Clerk JS (`js/config.js` → `window.__CLERK_PK__`, public by design)
   and obtains a short-lived Clerk session JWT (≈60 s).
2. `POST /api/auth/clerk` exchanges it for a **Civic Voice session token** (HS256, 7 days):
   the backend verifies the Clerk JWT against the instance JWKS
   (`https://<domain>/.well-known/jwks.json`, derived from the publishable key), then
   resolves the profile (email/name/avatar) through the Clerk Backend API
   `GET /v1/users/{sub}` using the **secret key** — Clerk session tokens contain no email
   claim, so the secret key is required.
3. The app token is stored in `localStorage.civicvoice_token` and sent as
   `Authorization: Bearer …` on every API call (see `js/api.js`). Identity comes from the
   token; `email`/`adminEmail` parameters are only fallbacks for the demo login.
4. Expired/invalid tokens get `401` → the frontend clears the session and returns to
   `login.html`.

### Files & environment

| What | Where |
|---|---|
| Publishable key (public) | `civicvoice-frontend/js/config.js` → `window.__CLERK_PK__` |
| Secret key + admin list (private) | repo-root `.env` (**gitignored**), loaded by `civicvoice-backend/start-backend.bat` |
| Session signing secret | `APP_SESSION_SECRET` env, otherwise auto-generated in `civicvoice-backend/session.secret` (gitignored) |

`.env` format (never commit this file):

```bash
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
ADMIN_EMAILS=admin@civicvoice.local,you@yourdomain.com
```

> To make a **Clerk-signed-in user an admin**, add their email to `ADMIN_EMAILS`
> (Clerk rejects `.local` addresses, so use a real email when signing up with Clerk).
> Demo accounts (`admin@civicvoice.local`, …) keep working through the password-less
> demo sign-in.
>
> ⚠️ Treat `CLERK_SECRET_KEY` like a password — it grants full Backend API access.
> If a secret key is ever shared or committed, roll it in the Clerk dashboard.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.3 (Web MVC, Data JPA, Validation) |
| Build | Maven |
| Database | PostgreSQL |
| ORM | Hibernate (Spring Data JPA) |
| Frontend | JavaScript (vanilla) + Tailwind CSS |
| Storage | Local filesystem uploads |
