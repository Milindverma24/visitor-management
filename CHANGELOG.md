# Changelog

All notable changes to the **Indian Glycols Limited - Visitor Management System** will be documented in this file.

---

## [3.0.0] - 2026-07-04

This release focuses on production-ready cloud deployment, enhanced security, database optimizations, and in-memory document storage.

### 🚀 Added
- **Vercel Serverless Hosting Support**: Created `vercel.json` configurations to deploy the FastAPI backend as serverless lambdas.
- **Dynamic Database String Routing**: Added support for standard unified `DATABASE_URL` connection strings, enabling out-of-the-box integrations with serverless cloud databases like Neon.tech or Supabase.
- **In-Memory Storage Schema**: Added `qr_code_base64` and `badge_pdf_base64` fields to the `visits` table database model.
- **In-Memory Email Attachments**: Upgraded the email dispatch utility to dynamically construct and attach PDF passes directly from base64 memory buffers.
- **Deployment Documentation**: Created a step-by-step guide [DEPLOYMENT.md](file:///Users/milindverma/Desktop/visitor-management-system/DEPLOYMENT.md) for zero-cost cloud hosting.

### 🔒 Changed & Secured
- **Zero-Disk Writes Policy**: Converted all file uploads (`/photo`, `/upload-doc`), QR code generation, and ReportLab PDF badge compilation to run fully in-memory (RAM), completely eliminating local file writes.
- **Sanitized Credentials**: Extracted all hardcoded seeding and cleanup credentials for default test users and admin accounts into local environment variables (`ULTIMATE_ADMIN_EMAIL`, `SEED_ADMIN_EMAIL`, etc.).
- **Relaxed CORS Policies**: Configured backend CORS middleware to allow cross-origin requests from front-end Vercel domains.

### 🛠️ Fixed
- **Past Visit Autofill Expiry Bug**: Fixed a bug in the Visitor Kiosk where autofilling from a past visit incorrectly set the new visit's valid window to 0 minutes instead of the default 6-hour offset.
- **Database Connection Leaks**: Refactored the core `get_all_visits` endpoint to use standard dependency-injected database sessions, resolving connection timeout issues under load.
- **Dynamic Expiry Commits**: Fixed a bug where dynamic `EXPIRED` status updates were not committed to the database, ensuring database state matches UI visual state.
