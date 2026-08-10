# Civic Voice — Smart Citizen Engagement Platform

A transparent, accountability-driven platform that bridges citizens and civic authorities (BBMP, Bengaluru). **Java Full Stack Edition**: Spring Boot + PostgreSQL backend with a JavaScript (vanilla JS + Tailwind) frontend.

## ⚡ Quick Start

### Prerequisites
- Java 17+
- Maven 3.9+ (or use the bundled wrapper)
- PostgreSQL 14+ running on `localhost:5432`
- Node-free frontend — just serve the static files (or open `civicvoice-frontend/index.html`)

### 1. Database
```bash
psql -U postgres -h localhost -c "CREATE DATABASE civicvoice;"
```
Or run the bundled script: `db/setup-db.sql`.

> The app auto-creates tables on startup (`spring.jpa.hibernate.ddl-auto=update`) and seeds demo data if the database is empty.

### 2. Backend (Spring Boot)
```bash
cd civicvoice-backend
mvn spring-boot:run
```
Backend runs on **http://localhost:8080**.

- Health check: `GET /api/issues?page=1`
- Default admin email: `admin@civicvoice.local` (override via env `ADMIN_EMAILS`)

### 3. Frontend (JavaScript)
Serve the static folder with any static server, or open the files directly:
```bash
cd civicvoice-frontend
# any static server, e.g.:
npx serve .
```
Frontend runs on **http://localhost:3000** (or whatever port), configured to call the backend at `http://localhost:8080/api` (set `localStorage.civicvoice_api` to override).

### Demo accounts
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
│  fetch() REST calls     │  JSON│  Repositories (Spring Data)   │      │  civicvoice │
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
- **Seed data** on first startup for instant demo

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
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/civicvoice` | DB connection |
| `spring.datasource.username` | `postgres` | DB user |
| `spring.datasource.password` | `postgres` | DB password |
| `app.admin-emails` / `ADMIN_EMAILS` | `admin@civicvoice.local` | Comma-separated admin list |
| `app.upload-dir` | `uploads` | Local image storage folder |
| `server.port` | `8080` | Backend port |

Frontend: `localStorage.civicvoice_api` overrides the backend base URL (default `http://localhost:8080/api`).

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
