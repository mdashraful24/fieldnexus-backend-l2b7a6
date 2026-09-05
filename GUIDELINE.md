# FieldNexus Backend — Complete Project Guideline

A simple, step‑by‑step guide to **FieldNexus** for everyone — including people who do not write code. It explains what the project is, how to set it up, how to run it, and how to test it.

---

## Table of Contents

1. [What is FieldNexus? (Plain English)](#1-what-is-fieldnexus-plain-english)
2. [Who Uses the System? (Roles)](#2-who-uses-the-system-roles)
3. [How the System Works — The Big Picture](#3-how-the-system-works--the-big-picture)
4. [What Is "The Backend"?](#4-what-is-the-backend)
5. [Things You Need Before You Start](#5-things-you-need-before-you-start)
6. [How to Set Up the Project on Your Computer](#6-how-to-set-up-the-project-on-your-computer)
7. [How to Start the Server](#7-how-to-start-the-server)
8. [Why Testing Is Needed and How to Do It](#8-why-testing-is-needed-and-how-to-do-it)
9. [The Recommended Testing Order](#9-the-recommended-testing-order)
10. [Step-by-Step Testing Guide](#10-step-by-step-testing-guide)
11. [Emails the System Sends](#11-emails-the-system-sends)
12. [Common Problems and How to Fix Them](#12-common-problems-and-how-to-fix-them)
13. [Plain-English Glossary](#13-plain-english-glossary)
14. [Developer Notes (for people who write code)](#14-developer-notes-for-people-who-write-code)

---

## 1. What is FieldNexus? (Plain English)

Imagine a large company (for example a telecom or internet provider) that needs technicians to visit customers' homes and offices to install or repair things. That company does **not** hire all those technicians itself. Instead it works with many small subcontractor teams ("vendors") who employ the technicians.

Now the company has a problem: how to keep track of **hundreds of service requests**, make sure someone is sent to each one, know who did what, and make sure everyone gets paid — without using paper files or phone calls.

**FieldNexus is the computer system that solves this.** It is a central "hub" where:

- A company (**Admin**) creates service jobs ("work orders").
- The Admin assigns each job to one of many subcontractor teams (**Vendors**) and their **Technicians**.
- The Technician sees the job, accepts it, visits the site, does the work, and submits a report.
- The customer (**Customer**) confirms the work and pays for it.
- The Admin can see everything on dashboards: who is doing what, whether jobs are on time, and how each vendor performs.

The system also handles the **money**: payment through bKash, plus **refunds** and **cancellation**, and it **sends email confirmations** automatically.

---

## 2. Who Uses the System? (Roles)

| Role | Who they are | What they can do in the system |
|------|--------------|-------------------------------|
| **Super Admin** | The top‑level owner of the whole platform | Creates and manages **Admins**, can restore deleted items. Highest power. |
| **Admin** | The enterprise/company staff | Creates work orders, approves vendors, assigns technicians, sees dashboards, approves vendors and technician applications, cancels work orders, processes refunds. |
| **Technician** | The field worker employed by a vendor | Accepts jobs, moves them through stages (on the way, working, done), submits service reports, updates job status. |
| **Customer** | The person who needs the service | Creates work orders, cancels PENDING/APPROVED orders, gives feedback, pays for completed work, asks for refunds. |

---

## 3. How the System Works — The Big Picture

This is the normal life of one service job:

```
1. Customer creates a Work Order   →  status: PENDING
2. Admin approves it               →  status: APPROVED
3. Admin assigns a Technician      →  status: ASSIGNED
4. Technician accepts the job      →  status: ACCEPTED
5. Technician travels to the site  →  status: EN_ROUTE
6. Technician starts working       →  status: IN_PROGRESS
7. Technician finishes & reports   →  status: COMPLETED
8. Customer gives feedback + pays  →  Payment: PAID
9. (Optional) Refund / Cancel
```

Every step is checked. For example, you **cannot** pay for a job that is not finished, and a Customer **cannot** cancel a job that is already being worked on.

---

## 4. What Is "The Backend"?

The **backend** is the part of the system that lives on a server (a computer that runs all the time). It is not the app you click on — it is the "engine room" that:

- Stores all data (people, jobs, payments) in a **database**.
- Checks that requests are allowed (who is logged in, what role they have).
- Talks to outside services (sends emails, takes payments through bKash, stores photos in Cloudinary).
- Returns answers (JSON data) that a frontend app (like a website or mobile app) shows to the user.

Every action a user takes in the app is actually a request to the backend, like:

```
Website / App  ──request──▶  FieldNexus Backend  ──read/save──▶  Database
     ▲                              │
     └────────answer JSON───────────┘
```

**What the backend is built with (for your knowledge):**
- **Node.js + TypeScript** — the programming language the backend is written in.
- **Express** — the framework that handles requests (like a receptionist).
- **PostgreSQL** — the database where all information is stored.
- **Prisma** — a tool (called an ORM) that lets the code talk to the database easily.
- **Zod** — a tool that double‑checks every request before it is accepted (like a security guard).
- **Redis** — a fast "scratchpad" memory store used for temporary things (OTP codes, login tokens cache).
- **JWT** — the "ticket" a user gets after logging in; it proves who they are on every request.
- **Nodemailer** — the tool that sends emails.
- **bKash API** — for mobile payments and refunds.
- **Cloudinary** — online storage for profile pictures and documents.

---

## 5. Things You Need Before You Start

Think of this like the ingredients for a recipe. You need:

| Requirement | What it is (plain English) | Where to get it |
|-------------|----------------------------|-----------------|
| **Node.js** (v18 or newer) | The program that runs JavaScript code | https://nodejs.org |
| **PostgreSQL** | The main data storage (a database) | https://www.postgresql.org |
| **Redis** | A fast memory store for temporary data | https://redis.io |
| **A code editor** (optional but useful) | A program to view/edit the code, e.g. VS Code | https://code.visualstudio.com |
| **Postman** (used for testing) | A tool to send requests to the backend and see the responses | https://www.postman.com |
| **bKash sandbox account** | A test environment from bKash so you can try payments without real money | bKash developer portal |
| **Google/Gmail SMTP** | Needed so the system can actually send emails | Your Gmail / app password |
| **Cloudinary account** | For storing uploaded images/documents | https://cloudinary.com |

> **Note:** If you just want to test parts that do not involve bKash, sending, or image storage, you can still run the system — those parts will only fail when used.

---

## 6. How to Set Up the Project on Your Computer

Follow these steps **in order**:

### Step 1 — Install the required programs

Install **Node.js**, **PostgreSQL**, and **Redis** from the links above. Start PostgreSQL and Redis services (on Windows, Redis can run via WSL or the Memurai/Redis-for-Windows package; ask a developer for help if unsure).

### Step 2 — Open the project folder

Open a terminal (Command Prompt / PowerShell / Git Bash) and go to the project folder:

```
cd C:\Projects\Level-02\Assignments\New folder\l2b7-assignment-06
```

### Step 3 — Install the project's packages

Run this command — it downloads all the "ingredients" the project needs:

```
npm install
```

### Step 4 — Create your settings file (`.env`)

1. Find the file named **`.env.example`** in the project folder.
2. Make a **copy** of it and name the copy **`.env`**.
3. Open the new `.env` file in a text editor and fill in the real values (database address, passwords, email credentials, bKash keys, etc.). Ask a developer for the correct values — **never** share or commit this file, it contains secrets.

### Step 5 — Create the database tables

Run this command to build the database structure:

```
npx prisma migrate dev
```

(If it asks for a name, type something like `init`.)

### Step 6 — You're ready

Your project is now set up. Move on to [How to Start the Server](#7-how-to-start-the-server).

---

## 7. How to Start the Server

In the terminal, inside the project folder, run:

```
npm run dev
```

A message should appear saying the server is on (usually on port **5000**). You'll also see messages like:

```
Connected to the database successfully.
Redis Connected Successfully.
Nodemailer Connected Successfully.
Super Admin Created : ...
Example app listening on port 5000
```

When the server starts for the **first time**, it automatically creates some ready‑made test users from the values in your `.env` file:

- One **Super Admin**
- One **Admin**
- One **Tester Technician** (logins for testing)
- One **Tester Vendor** (that has the tester technician as a member)

You can log in with these to test. To stop the server, press `Ctrl + C` in the terminal.

---

## 8. Why Testing Is Needed and How to Do It

**Testing** means: pretending to be each type of user (Customer, Admin, Technician) and making sure the system behaves correctly for each one — approving jobs, making payments, sending emails, blocking wrong actions.

The easiest way to test is with **Postman**, which lets you:

- Send requests to the backend (like clicking buttons).
- See exactly what the backend answers (success or an error message).

A ready‑made **Postman collection** is included in the project:

```
Field Nexus (Backend) (V2).postman_collection.json
```

### How to use the collection

1. Open Postman.
2. Click **Import** and select the collection file above.
3. All the requests appear in a list, organised by module (Auth, User, Admin, Vendor, Work Order, Payment, Notification, etc.).

### The most important thing to understand: Login Tokens

When a user logs in, the backend gives them a **token** — a secret "ticket" proving they are logged in. On every request, Postman must send this ticket in the request header like this:

```
Authorization: Bearer <paste-the-token-here>
```

or the token is placed in a cookie. Without a valid token you will get a **401 Unauthorized** response.

> **Pro tip:** After logging in as a user, copy the `accessToken` from the response and paste it into the **Authorization** header of the next request (or set it as a Postman Environment variable). Each role needs its own token — a Customer token cannot do Admin actions.

---

## 9. The Recommended Testing Order

Test routes **in this order**. The system is a chain — later steps depend on data created by earlier steps.

| Priority | Module | Route Base (`/api/v1` + ...) | Why this order |
|----------|--------|------------------------------|----------------|
| 1 | Auth | `/auth` | Foundation — every other request needs a login token |
| 2 | User Profile | `/user` | Simple — tests profile update + photo upload |
| 3 | Service Categories | `/service-categories` | Needed to create work orders (jobs need a category) |
| 4 | Admin — Users | `/admin/users` | Check admin can manage users |
| 5 | Vendors | `/vendors` | Needed before technicians can be assigned |
| 6 | Technician Applications | `/technician-applications` | Technicians can apply; admin approves them |
| 7 | Work Orders (create) | `/work-orders` | The core job record |
| 8 | Work Orders (assign) | `/work-orders/:id/assign` | Needs vendors + technicians to exist |
| 9 | Work Orders (accept/reject) | `/work-orders/:id/accept` | Technician responds to an assignment |
| 10 | Work Orders (status flow) | `/work-orders/:id/status` | The job progresses step by step |
| 11 | Service Reports | `/work-orders/:id/service-report` | Technician reports the finished work |
| 12 | Feedback | `/work-orders/:id/feedback` | Only after the job is completed |
| 13 | Payments | `/payments/initiate` | Only after the job is completed |
| 14 | Payments (cancel/refund) | `/payments/:id/cancel`, `/refund` | Cancelling/refunding money + emails |
| 15 | Notifications | `/notifications` | Created automatically by other actions |
| 16 | Admin Dashboard | `/admin/dashboard-stats` | Summary of everything above |
| 17 | Super Admin | `/super-admin` | Manage admins (test last — highest power) |

---

## 10. Step-by-Step Testing Guide

Below is a **complete walk-through**. It uses `:id` and `:paymentId` to mean "use the actual ID you received from the previous step's response".

### Phase A — Accounts (who is who in the test)

- **Admin**: logged in from the seeded Admin credentials (from `.env`).
- **Customer**: you will register one in step A2.
- **Technician**: the seeded **Tester Technician**.
- **Vendor**: the seeded **Tester Vendor** (contains the tester technician).

### Phase B — Authentication

| # | Request | Auth | What happens |
|---|---------|------|--------------|
| B1 | `POST /api/v1/auth/register` body `{ name, email, password, contactNumber?, address? }` | None | Registers a Customer; sends an OTP code by email |
| B2 | `POST /api/v1/auth/verify-email` body `{ email, otp }` | None | Confirms the email; returns access + refresh tokens |
| B3 | `POST /api/v1/auth/login` body `{ email, password }` | None | Logs in an existing user; returns tokens |
| B4 | `GET /api/v1/auth/me` | Any role | Shows the logged-in user's own profile |
| B5 | `POST /api/v1/auth/refresh-token` | None (uses cookie) | Get a new access token when the old one expires |
| B6 | `POST /api/v1/auth/forgot-password` body `{ email }` | None | Sends password-reset OTP |
| B7 | `POST /api/v1/auth/reset-password` body `{ email, otp, newPassword }` | None | Sets the new password |

> When the Customer registers, the OTP is sent to their email. In development it may also be visible in the Redis/console. OTPs expire in about 5 minutes.

### Phase C — User Profile (any role)

| # | Request | Notes |
|---|---------|-------|
| C1 | `PATCH /api/v1/user/update-user-info` body `{ name?, contactNumber?, address? }` | Update your own details |
| C2 | `PATCH /api/v1/user/upload-profile-picture` (multipart file field `profilePicture`) | Uploads photo to Cloudinary |

### Phase D — Service Categories

| # | Request | Auth | Notes |
|---|---------|------|-------|
| D1 | `POST /api/v1/service-categories` body `{ name, description?, icon?, parentId? }` | Admin | Create a category, e.g. "Electrical Repair" |
| D2 | `GET /api/v1/service-categories` | Public | List categories (note the new `id`) |

### Phase E — Admin: Users

| # | Request | Auth | Notes |
|---|---------|------|-------|
| E1 | `GET /api/v1/admin/users?page=1&limit=10&search=&role=&status=` | Admin | List all users |
| E2 | `PATCH /api/v1/admin/users/:id/status` body `{ status: "ACTIVE" \| "BLOCKED" \| "DELETED" }` | Admin | Block/delete a user account |
| E3 | `GET /api/v1/admin/dashboard-stats` | Admin | See totals (users, vendors, jobs, revenue) |

### Phase F — Vendors

| # | Request | Auth | Notes |
|---|---------|------|-------|
| F1 | `POST /api/v1/vendors` body `{ name, email, phone?, description?, address?, serviceAreas? }` | Admin | New vendor starts as **PENDING** |
| F2 | `PATCH /api/v1/vendors/:id` body `{ status: "APPROVED" }` | Admin | Approve the vendor (required before assignment) |
| F3 | `GET /api/v1/vendors` | Public | List vendors |
| F4 | `POST /api/v1/vendors/:vendorId/members` body `{ technicianId }` | Admin | Add a technician to a vendor |
| F5 | `GET /api/v1/vendors/:vendorId/members` | Admin | See a vendor's technicians |
| F6 | `DELETE /api/v1/vendors/:id` | Admin | Remove a vendor (soft delete) |

### Phase G — Technician Applications

A technician can apply to join, and the Admin approves them.

| # | Request | Auth | Notes |
|---|---------|------|-------|
| G1 | `POST /api/v1/technician-applications/apply` (multipart with `resume`, optional `additionalDocuments`) | None | Apply as a technician; sends a "received" email |
| G2 | `GET /api/v1/technician-applications/status` | None (by email) | Check your application status |
| G3 | `GET /api/v1/technician-applications` | Admin | List all applications |
| G4 | `POST /api/v1/technician-applications/:id/approve` | Admin | Approve → creates the technician user + sends email |
| G5 | `POST /api/v1/technician-applications/:id/reject` body `{ reason }` | Admin | Reject + sends email |

### Phase H — Work Orders (the main business flow)

Use the **Customer** token for creating orders, the **Admin** token for approving/assigning, and the **Technician** token for accepting/working.

| # | Request | Who | Notes |
|---|---------|-----|-------|
| H1 | `POST /api/v1/work-orders` body `{ title, description?, categoryId, priority?, scheduledAt?, latitude?, longitude? }` | Customer | Creates job (**PENDING**), auto number `WO-…`, SLA deadline set |
| H2 | `PATCH /api/v1/work-orders/:id/status` body `{ status: "APPROVED", version }` | Admin | Approve the job |
| H3 | `POST /api/v1/work-orders/:id/assign` body `{ vendorId, technicianId }` | Admin | Assign a technician (job becomes **ASSIGNED**) |
| H4 | `POST /api/v1/work-orders/:id/accept` | Technician | Technician accepts the job → **ACCEPTED** |
| H5 | `POST /api/v1/work-orders/:id/reject` body `{ rejectionReason }` | Technician | Technician rejects → job can be reassigned |
| H6 | `PATCH /api/v1/work-orders/:id/status` body `{ status: "EN_ROUTE" }` | Technician | On the way |
| H7 | `PATCH /api/v1/work-orders/:id/status` body `{ status: "IN_PROGRESS" }` | Technician | Working |
| H8 | `POST /api/v1/work-orders/:id/service-report` body `{ workDescription, issueFound?, solutionProvided?, partsUsed? [{name, quantity}], hoursWorked }` | Technician | Submit the work report |
| H9 | `PATCH /api/v1/work-orders/:id/status` body `{ status: "COMPLETED" }` | Technician | Mark done |
| H10 | `GET /api/v1/work-orders` | Admin | List all jobs (with filters) |
| H11 | `GET /api/v1/work-orders/my-assigned` | Technician | See only your jobs |
| H12 | `GET /api/v1/work-orders/:id` | Any role | Get one job's full details |
| H13 | `PATCH /api/v1/work-orders/:id` body `{ ..., version }` | Admin | Edit a job (uses version/locking) |

> **Important — `version`:** the work order has a version number that increases every time it changes. When you update the status or the order, you must send the current `version` in the body. If two people edit at the same time, the second one gets a **409 Conflict** — this is the system protecting data.

#### Cancelling a work order

| # | Request | Who | Notes |
|---|---------|-----|-------|
| H14 | `PATCH /api/v1/work-orders/:id/status` body `{ status: "CANCELLED", cancellationReason?, version }` | Admin or Customer | Customer can only cancel **PENDING** or **APPROVED** jobs. The system sends a cancellation email to the customer. |

### Phase I — Feedback

| # | Request | Who | Notes |
|---|---------|-----|-------|
| I1 | `POST /api/v1/work-orders/:id/feedback` body `{ rating: 1–5, comment? }` | Customer | Only for **COMPLETED** jobs |
| I2 | `GET /api/v1/work-orders/:id/feedback` | Any role | Read the feedback |

### Phase J — Payments (bKash)

| # | Request | Who | Notes |
|---|---------|-----|-------|
| J1 | `POST /api/v1/payments/initiate` body `{ workOrderId, payerReference? }` | Customer | Starts a bKash checkout; returns a payment URL. Only for **COMPLETED** jobs. Requires bKash sandbox credentials. |
| J2 | `GET /api/v1/payments/callback?payment_id=...` | Public (bKash calls this) | bKash confirms the payment result; the system marks it **PAID/FAILED/CANCELLED** and emails the payment receipt (PDF) |
| J3 | `GET /api/v1/payments` | Admin/Customer/Technician | List payments |
| J4 | `GET /api/v1/payments/:paymentId` | Admin/Customer/Technician | Payment details |

#### Cancelling and refunding a payment

| # | Request | Who | Notes |
|---|---------|-----|-------|
| J5 | `POST /api/v1/payments/:paymentId/cancel` | Customer/Admin/Super Admin | Cancel an unpaid or pending payment |
| J6 | `POST /api/v1/payments/:paymentId/refund` body `{ reason? }` | Customer/Admin/Super Admin | Refund a **PAID** payment back to the customer's bKash account. Only successful (PAID) payments can be refunded. On success the system marks it **REFUNDED** and sends a refund confirmation email to the customer. |

### Phase K — Notifications

| # | Request | Notes |
|---|---------|-------|
| K1 | `GET /api/v1/notifications?page=1&limit=10` | Your notifications (e.g. "payment successful") |
| K2 | `PATCH /api/v1/notifications/read-all` | Mark all as read |
| K3 | `PATCH /api/v1/notifications/:id/read` | Mark one as read |

### Phase L — Super Admin (top-level)

| # | Request | Notes |
|---|---------|-------|
| L1 | `GET /api/v1/super-admin/admins` | List all Admins |
| L2 | `POST /api/v1/super-admin/admins` body `{ name, email, password, ... }` | Create a new Admin |
| L3 | `PATCH /api/v1/super-admin/admins/:id/status` body `{ status: "ACTIVE" \| "BLOCKED" \| "DELETED" }` | Block/delete an Admin |

### Phase M — Clean-up & Advanced

| # | Request | Who | Notes |
|---|---------|-----|-------|
| M1 | `DELETE /api/v1/work-orders/:id` | Admin | Soft-delete a job (it hides, isn't erased) |
| M2 | `PATCH /api/v1/vendors/:id/restore` | Admin/Super Admin | Bring back a deleted vendor |
| M3 | `GET /api/v1/admin/vendors/:id/performance` | Admin | Vendor scorecard (completed jobs, ratings, etc.) |
| M4 | `GET /api/v1/admin/audit-logs` | Admin | History of actions (the model exists; currently may be empty) |

---

## 11. Emails the System Sends

The backend sends emails automatically at these moments. All are "transactional" emails (about a specific action).

| When | Email sent to | What it says |
|------|---------------|--------------|
| User registers | The user | OTP code to verify their email |
| Registration completes | The user | Welcome email |
| User requests password reset | The user | OTP to reset password |
| Password changed | The user | "Password changed successfully" |
| Payment is successful | The customer | **Payment Receipt** — includes a PDF invoice attached |
| Payment is refunded | The customer | **Refund Confirmation** — refund amount, reason, transaction ID, date |
| Work order is cancelled | The customer | **Work Order Cancelled** — job number, reason, and note about refund if applicable |
| Technician applies | The applicant | "Application received" |
| Technician application approved | The applicant | "Welcome to the team" |
| Technician application rejected | The applicant | "Application not approved" |

> The refund and work-order-cancellation confirmation emails were recently added, in `src/app/templates/refund-confirmation.ejs` and `src/app/templates/work-order-cancelled.ejs`.

---

## 12. Common Problems and How to Fix Them

| What you see | What it usually means | What to do |
|--------------|------------------------|------------|
| **401 Unauthorized** | You are not logged in, or your token expired | Log in again / refresh the token and resend |
| **403 Forbidden** | You are logged in but using the wrong role's token | Use the Admin/Technician/Customer token that the route requires |
| **404 Not Found** | The item does not exist or is soft-deleted | Check the `:id` you used |
| **409 Conflict** | Someone else already changed the record (version mismatch) | Re-fetch the record, use the new `version`, try again |
| **400 Validation Error** | The request body doesn't match the rules | Check required fields, lengths, email/password format |
| **400 Invalid transition** | You jumped a step in the job status flow | Check the job's current status and the allowed next steps |
| **400 Scheduling conflict** | The technician already has a job in the same 3-hour window | Pick another technician or time |
| **Server won't start** | Database/Redis not running, or `.env` is wrong | Make sure PostgreSQL & Redis are running and `.env` is filled correctly |
| **Emails not arriving** | SMTP settings wrong, or going to spam | Check SMTP/Gmail app password, check spam folder |
| **bKash payment fails** | Sandbox not configured / expired token | Use the correct sandbox credentials; token is cached in Redis and refreshes automatically |

---

## 13. Plain-English Glossary

| Term | Meaning |
|------|---------|
| **API** | The address book of the backend — each address (URL) does one job when called |
| **Endpoint / Route** | One specific address, e.g. `POST /api/v1/auth/login` |
| **POST / GET / PATCH / DELETE** | Verbs meaning: create / read / partially change / remove |
| **Body** | The information you send with a request (like filling a form) |
| **Token (JWT)** | The login "ticket" that proves who you are |
| **Work Order** | One service job (one request for service) |
| **Status** | The stage a job is in (PENDING → APPROVED → ASSIGNED → ... → COMPLETED) |
| **SLA deadline** | The promised time limit to finish the job (e.g. 48 hours) |
| **Soft delete** | Hiding a record without actually erasing it, so it can be restored |
| **Version (optimistic locking)** | A number that increases on each change to stop two people editing the same record at once |
| **Migration** | A script that builds/updates the database structure |
| **ORM (Prisma)** | The translator between code and the database |
| **JSON** | The text format the backend uses to give answers |
| **Sandbox** | A safe test environment (no real money) |
| **OTP** | A one-time code (usually 6 digits) to prove an email/phone |
| **Seeder / Seed** | Auto-created test users the system makes on first launch |

---

## 14. Developer Notes (for people who write code)

This section is a quick map of the codebase for the developers.

### Folder structure

```
src/
├── server.ts                     # Entry point — connects DB/Redis/email, starts server
├── app.ts                        # Express app — routes, middleware, CORS
├── app/
│   ├── config/index.ts           # Reads all settings from .env
│   ├── interfaces/               # Shared TypeScript types
│   ├── lib/                      # prisma, redis, nodemailer, multer, bkash
│   ├── middlewares/              # auth, validateRequest, globalErrorHandler, notFound
│   ├── modules/                  # One folder per feature (feature-based structure)
│   │   ├── auth/                 # Register, verify email, login, tokens, passwords
│   │   ├── user/                 # Profile picture upload, update info
│   │   ├── admin/                # Dashboard stats, users, audit logs, performance
│   │   ├── superAdmin/           # Manage admins
│   │   ├── vendor/               # Vendors + members (technicians)
│   │   ├── serviceCategory/      # Categories, nested
│   │   ├── workOrder/            # Work orders, status machine, service reports
│   │   ├── assignment/           # Assign/accept/reject technicians
│   │   ├── feedback/             # Ratings & comments
│   │   ├── payment/              # bKash init, callback, cancel, refund + emails
│   │   ├── notification/         # In-app notifications
│   │   └── technicianApplication/ # Apply as technician, approve/reject
│   ├── templates/                # EJS email templates
│   └── utils/                    # AppError, catchAsync, jwt, seed, cron
├── prisma/
│   ├── schema/                   # Database models (PostgreSQL + Prisma)
│   └── migrations/
└── generated/prisma/             # Auto-generated Prisma client + enums
```

### Each module follows the same pattern

```
*.route.ts        → defines the URL and which middleware to run
*.controller.ts   → thin "receptionist" — calls the service, sends the response
*.service.ts      → the real logic (business rules, DB calls)
*.validation.ts   → Zod rules that check the incoming request
*.interface.ts    → TypeScript types for that module
```

### Key commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the server in development mode (auto-restarts on change) |
| `npm run build` | Type-check and compile the code |
| `npm run lint:check` / `lint:fix` | Check / fix code style with Biome |
| `npm run format:check` / `format:fix` | Check / fix code formatting with Biome |
| `npx prisma migrate dev` | Apply schema changes to the dev database |
| `npx prisma studio` | Open a visual database browser |

### A few things to remember

- **Email sending** lives in `src/app/lib/nodemailer.ts`; templates live in `src/app/templates`.
- **Payments** call the bKash API from `src/app/modules/payment/payment.service.ts`. The refund flow validates that the payment is `PAID`, performs the bKash refund, marks it `REFUNDED`, and then calls `sendRefundConfirmationEmail`.
- **Work order cancellation** in `src/app/modules/workOrder/workOrder.service.ts` sends a cancellation email after the record is updated.
- **Concurrency** is handled with a `version` field (optimistic locking) — always pass the current `version`.
- **Secrets**: never commit `.env`. Only `.env.example` is committed.
- Run **lint and build** before finishing any change:
  ```
  npm run lint:check
  npm run build
  ```