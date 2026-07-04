# IGLGATE v3.0 — Test User Login Details

### 🌐 Live Portal
**Login URL:** [https://visitor-management-iota-nine.vercel.app/](https://visitor-management-iota-nine.vercel.app/)

All default test user credentials are dynamically loaded from environment variables in your `.env` file for security.

### ⚙️ How to configure/change them:
To change these credentials locally, open your `.env` file and edit the corresponding variables. For the live deployment, update these in your Render Environment Variables:
```env
ULTIMATE_ADMIN_EMAIL=ultimate@igl.com
ULTIMATE_ADMIN_PASSWORD=12345

SECURITY_GUARD_EMAIL=security.guard@igl.com
SECURITY_GUARD_PASSWORD=12345
```

### 👤 Current Default Configuration:

| Name | Role | Department | Email / ID | Password | Config Variable |
|---|---|---|---|---|---|
| Ultimate System Admin | `CORPORATE_SUPER_ADMIN` | Information Technology | `ultimate@igl.com` | `12345` | `ULTIMATE_ADMIN_EMAIL` / `ULTIMATE_ADMIN_PASSWORD` |
| Security Guard 1 | `CORPORATE_SUPER_ADMIN` | Security | `security.guard@igl.com` | `12345` | `SECURITY_GUARD_EMAIL` / `SECURITY_GUARD_PASSWORD` |