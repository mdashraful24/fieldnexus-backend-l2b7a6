# FieldNexus Backend — B2B Field Service Management Platform

FieldNexus is a **B2B multi-vendor field service management platform** that sits between an enterprise and a network of independent subcontractor vendors & technicians. It manages the entire lifecycle of a field-service job — from a customer's service request, through admin approval and technician assignment, to completion, feedback, and bKash payment/refund — all with automatic email confirmations, notifications, SLA tracking, and vendor performance dashboards.

In plain words: instead of a company manually juggling hundreds of technicians with phone calls and paper, FieldNexus provides a single hub where jobs are created, assigned, tracked, completed, and paid — end to end.

> **Note:** This is a **backend-focused** project. There is no frontend UI in this repository. All functionality is demonstrated through the REST API (see the included Postman collection).

---

## Technologies Used

| Category | Technology |
|----------|------------|
| Language / Runtime | Node.js, TypeScript |
| Web Framework | Express.js |
| Database & ORM | PostgreSQL + Prisma |
| Linting & Formatting | Biome |
| Validation | Zod |
| Caching / Temporary Store | Redis |
| Authentication / Authorization | JWT (Access + Refresh Tokens), bcrypt, Google OAuth 2.0 |
| Payment Gateway | bKash (tokenized checkout — payment + refund) |
| Email | Nodemailer (SMTP / Gmail), EJS templates |
| File Storage | Cloudinary (profile pictures, resumes) & Multer |
| PDF Generation | PDFKit (payment invoices) |
| Code Quality | Biome (lint + format), TypeScript strict checking |
| Testing / Docs Tooling | Postman (collection included) |
| Deployment | Vercel (Serverless Functions) |

---

## Main Features

**Authentication & Users**
- Customer registration with email OTP verification
- Login (password + Google OAuth), refresh tokens, httpOnly cookies
- Forgot / reset password flows
- Role-based access control: **Super Admin**, **Admin**, **Technician**, **Customer**
- Profile management + Cloudinary profile picture upload

**Vendors & Technicians**
- Vendor management (create, approve, suspend, soft delete, restore)
- Vendor teams — add / remove / restore technician members
- Technician self-application flow (resume upload, email notifications on apply/approve/reject)
- Vendor performance analytics

**Work Orders (Core Business Flow)**
- Create work orders with auto-generated `WO-YYYYMMDD-NNNN` numbers
- Full status state machine: `PENDING → APPROVED → ASSIGNED → ACCEPTED → EN_ROUTE → IN_PROGRESS → COMPLETED`, plus `CANCELLED` and `FAILED`
- SLA deadline auto-calculated by priority (12h / 24h / 48h / 72h)
- Technician assignment with schedule-conflict detection (3-hour window)
- Service reports (description, parts used, hours worked)
- Customer feedback (rating 1–5 + comment)
- **Optimistic locking** (`version` field) to prevent lost updates
- Soft delete & restore

**Payments (bKash)**
- Initiate tokenized checkout for completed work orders
- Payment callback handling (success / failure / cancel)
- Payment receipt email with **PDF invoice** attachment
- **Payment cancel** and **refund** flows
- **Refund confirmation email** and **work-order cancellation email**

**Notifications & Admin**
- In-app notifications (unread / read / read-all)
- Admin dashboard statistics (users, vendors, work orders, revenue)
- User management (block / delete / restore) and audit-log endpoint
- Super Admin module to create and manage Admins

**Service Categories**
- Nested service categories with create / update / delete / restore

---

## Dependencies

### Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework / HTTP routing |
| `@prisma/client` + `@prisma/adapter-pg` | Database client with PostgreSQL driver adapter |
| `pg` | PostgreSQL driver |
| `zod` | Request validation schemas |
| `jsonwebtoken` | JWT access & refresh token generation/verification |
| `bcryptjs` | Password hashing |
| `cookie-parser` | Parse httpOnly cookies (tokens) |
| `cors` | Cross-origin resource sharing config |
| `dotenv` | Load environment variables from `.env` |
| `redis` | Cache & temporary store (OTPs, bKash tokens) |
| `nodemailer` | SMTP email sending (OTP, receipts, refund, cancellation, etc.) |
| `ejs` | Email template rendering |
| `pdfkit` | PDF invoice generation for payment receipts |
| `cloudinary` | Cloud image/document storage |
| `multer` | File upload parsing (profile pictures, resumes) |
| `google-auth-library` | Google OAuth login verification |
| `node-cron` | Scheduled jobs (cleanup of expired/unverified accounts) |
| `date-fns` | Date formatting |
| `http-status` | HTTP status-code constants |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| `prisma` | Prisma CLI (migrations, schema management) |
| `tsx` | Run TypeScript directly in development |
| `typescript` | Type checking & compilation |
| `@biomejs/biome` | Linting + formatting |
| `@types/*` | TypeScript type definitions for libraries |

---

## How to Run the Project Locally

### Prerequisites

- **Node.js** (v18 or newer) — <https://nodejs.org>
- **PostgreSQL** — <https://www.postgresql.org>
- **Redis** — <https://redis.io>
- **Postman** (to test the API) — <https://www.postman.com>
- Optional: bKash **sandbox** credentials for payment testing, Gmail SMTP for emails, Cloudinary for image uploads

### Step 1 — Clone & install

```bash
git clone <your-repo-url> fieldnexus-backend
cd fieldnexus-backend
npm install
```

### Step 2 — Configure environment

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Key settings: `DATABASE_URL`, `REDIS_*`, `JWT_*`, `SMTP_*` / `EMAIL_SENDER`, `CLOUDINARY_*`, `BKASH_*`, and the seeded-account credentials (`SUPER_ADMIN_*`, `FIELD_NEXUS_ADMIN_*`, `TESTER_TECHNICIAN_*`).

### Step 3 — Create the database schema

```bash
npx prisma migrate dev
```

### Step 4 — Start the server

```bash
npm run dev
```

You should see:

```
Connected to the database successfully.
Redis Connected Successfully.
Nodemailer Connected Successfully.
Example app listening on port 5000
```

On first start the server **auto-seeds**: one Super Admin, one Admin, one Tester Technician, and one Tester Vendor (credentials from `.env`).

### Step 5 — Test the API

- Open the included collection in Postman: `Field Nexus (Backend) (V2).postman_collection.json`
- Follow the step-by-step test order in **[GUIDELINE.md](GUIDELINE.md)**

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the server in development mode (auto-reload) |
| `npm run build` | Type-check and compile TypeScript |
| `npm start` | Run the compiled production build |
| `npm run lint:check` / `lint:fix` | Check / auto-fix code with Biome |
| `npm run format:check` / `format:fix` | Check / auto-format code with Biome |
| `npx prisma studio` | Open a visual database browser |

---

## Environment Variables (from `.env.example`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV`, `PORT` | Runtime mode & server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Token signing & expiry |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds |
| `FRONTEND_URL`, `BACKEND_URL` | CORS origin & API base URL |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `REDIS_USER`, `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT` | Redis connection |
| `SMTP_USER`, `SMTP_HOST`, `SMTP_PASSWORD`, `EMAIL_SENDER` | Email delivery |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary storage |
| `BKASH_BASE_URL`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_CALLBACK_URL` | bKash payment gateway |
| `SUPER_ADMIN_NAME/EMAIL/PASSWORD`, `FIELD_NEXUS_ADMIN_*`, `TESTER_TECHNICIAN_*` | Auto-seeded accounts |

---

## Relevant Links

- API Testing Guideline (step-by-step, non-technical friendly): **[GUIDELINE.md](GUIDELINE.md)**
- Frontend ↔ Backend API Integration Map: **[API_INTEGRATION.md](API_INTEGRATION.md)**
- Postman Collection: **[FieldNexus_(Backend)(V2).postman_collection.json](FieldNexus_(Backend)(V2).postman_collection.json)**
- Project Blueprint / Requirements: **[fieldnexus.md](fieldnexus.md)** , **[assignmentRequirement.md](assignmentRequirement.md)**

> **Live links:** add the deployed API URL and any other links (e.g. a hosted Postman documentation page) here once the backend is deployed.

---

## License

ISC