# 🚀 Deploying Visitor Management System to Vercel (Zero Cost)

This guide walks you through deploying both the **FastAPI Backend** and the **Vite + React Frontend** to **Vercel** for free, using a free cloud-hosted PostgreSQL database.

---

## 📋 Prerequisites
1. A GitHub account.
2. A Vercel account (linked to GitHub).
3. The project code pushed to a GitHub repository.

---

## 🛠️ Step 1: Create a Free Cloud PostgreSQL Database
Since Vercel hosts serverless compute, you need a cloud database. You can get one for free in 30 seconds:

1. Go to **[Neon Database](https://neon.tech/)** or **[Supabase](https://supabase.com/)**.
2. Create a free account and launch a new project.
3. Choose **PostgreSQL** as the database type.
4. Copy the connection string. It will look like this:
   `postgresql://neondb_owner:password@ep-cool-wave-a5.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## 📦 Step 2: Deploy the Backend (FastAPI) to Vercel
1. Log in to **[Vercel](https://vercel.com/)**.
2. Click **Add New** > **Project** and select your GitHub repository.
3. Under **Project Settings**:
   * **Project Name**: `igl-visitor-api` (or custom name)
   * **Framework Preset**: Select **Other**
   * **Root Directory**: Click Edit, select **`backend`**, and click Continue.
4. Expand **Environment Variables** and add the following keys:
   * `DATABASE_URL` = *(Your Neon/Supabase Connection String)*
   * `SECRET_KEY` = *(Any random secure string, e.g. 32 characters)*
   * `EMAIL_USER` = *(Your Gmail address)*
   * `EMAIL_PASSWORD` = *(Your Gmail App Password)*
   * `SEED_ADMIN_EMAIL` = *(Initial Admin Email, e.g. mili241105@gmail.com)*
   * `SEED_ADMIN_PASSWORD` = *(Initial Admin Password, e.g. 241105)*
   * `SEED_ADMIN_NAME` = *(Initial Admin Name, e.g. MILIND VERMA)*
5. Click **Deploy**.
6. Once deployed, copy your backend URL (e.g., `https://igl-visitor-api.vercel.app`).

---

## 💻 Step 3: Deploy the Frontend (React/Vite) to Vercel
1. Go back to your Vercel Dashboard.
2. Click **Add New** > **Project** and select the same GitHub repository again.
3. Under **Project Settings**:
   * **Project Name**: `igl-visitor-portal` (or custom name)
   * **Framework Preset**: Vercel will automatically detect **Vite**
   * **Root Directory**: Click Edit, select **`frontends`**, and click Continue.
4. Expand **Environment Variables** and add:
   * `VITE_API_URL` = *(Your deployed Vercel Backend URL from Step 2, e.g., `https://igl-visitor-api.vercel.app`)*
5. Click **Deploy**.

---

## ⚙️ Step 4: Configure Live Email Approvals
Now that you have your public backend URL from Vercel:
1. Go back to your **`igl-visitor-api`** (Backend) project on Vercel.
2. Go to **Settings** > **Environment Variables**.
3. Add a new variable:
   * `BACKEND_URL` = *(Your deployed Vercel Backend URL, e.g., `https://igl-visitor-api.vercel.app`)*
4. Redeploy the backend so it loads the new variable.

All email approval and rejection links sent to `mili241105@gmail.com` will now use this secure, globally-reachable HTTPS Vercel link, allowing you to approve visits from your phone anywhere!

---

## 📊 Database Seeding (Optional)
To seed the initial departments, locations, and your **MILIND VERMA** accounts on your new cloud database:
1. Open your local terminal in the `backend/` folder.
2. Temporary set your local environment `DATABASE_URL` to your production Neon connection string:
   ```bash
   export DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
   ```
3. Run the migrations and seeders:
   ```bash
   venv/bin/python run_migrations.py
   venv/bin/python seed_departments.py
   venv/bin/python seed_milind.py
   ```
4. All departments, locations, and admin credentials will be populated in your cloud database instantly!
