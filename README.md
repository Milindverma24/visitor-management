# IGLGATE v3.0 — Enterprise Access Management System

An industrial-grade Visitor & Access Management System designed for **Indian Glycol Limited (IGL)**. It handles secure badge printing, visitor approvals, contractor pass management, real-time occupancy counting, emergency system-wide evacuations, and Role-Based Access Control (RBAC).

---

## 🚀 Key Features

* **Visitor & Guest Management:** Pre-register visitors, check-in guests, print QR-coded security badges, and log arrival details.
* **Contractor & Vendor Portals:** Manage temporary contractors, safety certifications, valid periods, and logs.
* **Role-Based Access Control (RBAC):** Strict operational isolation with roles: `CORPORATE_SUPER_ADMIN`, `PLANT_ADMIN`, `DEPARTMENT_HEAD`, `EMPLOYEE`, and `SECURITY`.
* **Evacuation & Emergency Alarms:** Instantly trigger plant-wide alarms and retrieve live occupancy sweeps of personnel inside the industrial plants.
* **Real-time Notifications:** Support for instant SMS, Email, Telegram, and WhatsApp alerts for approvals and check-in statuses.
* **Material In/Out Tracking:** Log commercial items, tools, and vendor materials coming in and out of the facility.

---

## 🛠️ Tech Stack

* **Backend:** FastAPI (Python), SQLAlchemy ORM, Uvicorn, PostgreSQL, Redis (Caching and WebSockets).
* **Frontend:** React, Vite, TypeScript, Tailwind CSS / Custom CSS.
* **Infrastructure:** 
  - **Frontend Hosting:** Vercel
  - **Backend Hosting:** Render
  - **Email Delivery:** Brevo API
  - **Local Development:** Docker & Docker Compose (running PostgreSQL and Redis databases).

---

## 🌐 Live Deployment
**Production Link:** [https://visitor-management-iota-nine.vercel.app/](https://visitor-management-iota-nine.vercel.app/)

---

## 📁 Directory Structure

```text
visitor-management-system/
├── backend/                  # FastAPI Backend Application
│   ├── app/
│   │   ├── api/              # API Route Groups (Visitors, Users, Blacklist, Analytics, etc.)
│   │   ├── core/             # Application Settings and Configuration
│   │   ├── database/         # Database Connection & Engine Setup
│   │   ├── models/           # SQLAlchemy Database Models
│   │   ├── schemas/          # Pydantic Schemas (Input/Output validations)
│   │   ├── security/         # Authentication, JWT, and RBAC utilities
│   │   ├── services/         # Third-party Integrations (SMS/Email/Telegram)
│   │   └── utils/            # Badge layout generation & QR Utilities
│   ├── create_tables.py      # Database table initialization script
│   ├── requirements.txt      # Python Dependencies
│   └── seed_*.py             # Database seed scripts (Admin, Departments, etc.)
│
├── frontends/                # React Vite Frontend Application
│   ├── src/
│   │   ├── components/       # Reusable layout and dashboard components
│   │   ├── pages/            # View Pages (Dashboard, Blacklist, Check-In, etc.)
│   │   ├── services/         # Axios API communication services
│   │   ├── types/            # TypeScript Interface Definitions
│   │   ├── router.tsx        # Client-side router path setup
│   │   └── index.css         # Styling system base
│
├── deployment/               # Production Deployment Configurations
│   ├── docker/               # Placeholder Dockerfiles for production builds
│   └── scripts/              # Infrastructure management shell scripts
│       ├── start.sh          # Starts container services & checks DB availability
│       ├── stop.sh           # Shuts down docker containers
│       ├── backup.sh         # Generates PostgreSQL database backups
│       └── restore.sh        # Restores PostgreSQL database backups
│
├── docker-compose.yml        # Orchestration file for postgres/redis containers
├── start.sh                  # Main script for local development startup
├── stop.sh                   # Script to stop running local server processes
├── commands.txt              # Developer command reference sheet
└── login_details.md          # Default seeded admin login credentials
```

---

## 🟢 Getting Started (Local Development)

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [Python 3.10+](https://www.python.org/downloads/)
* [Node.js 18+](https://nodejs.org/)

### 2. Run Database & Cache (Docker)
Start the PostgreSQL database and Redis services:
```bash
docker compose up -d
```
*(Check [docker-compose.yml](file:///Users/milindverma/Desktop/visitor-management-system/docker-compose.yml) for configurations).*

### 3. Initialize & Seed Database
Configure your database tables and seed required system details.
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations/setup
python create_tables.py
python seed_departments.py
python seed_admin.py
python seed_igl_data.py
```
*(Use credentials in [login_details.md](file:///Users/milindverma/Desktop/visitor-management-system/login_details.md) to log in after seeding).*

### 4. Run the Application
You can start both backend and frontend applications together using the root startup script:
```bash
# From the root directory
bash start.sh
```
* **Frontend:** http://localhost:5173
* **Backend API Docs:** http://127.0.0.1:8001/docs

To stop development processes:
```bash
bash stop.sh
```

---

## 🛠️ Deployment Utilities

The [deployment/scripts/](file:///Users/milindverma/Desktop/visitor-management-system/deployment/scripts) directory contains management scripts:

* **Start Services:**
  ```bash
  ./deployment/scripts/start.sh
  ```
* **Stop Services:**
  ```bash
  ./deployment/scripts/stop.sh
  ```
* **Backup Database:**
  Creates a timestamped backup inside `database/backups/`.
  ```bash
  ./deployment/scripts/backup.sh
  ```
* **Restore Database:**
  Restores a database from a specific `.sql` backup file.
  ```bash
  ./deployment/scripts/restore.sh database/backups/<backup_file_name>.sql
  ```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](file:///Users/milindverma/Desktop/visitor-management-system/LICENSE) file for details.

---

<div align="center">
  <h1>MADE BY MILIND VERMA</h1>
</div>
