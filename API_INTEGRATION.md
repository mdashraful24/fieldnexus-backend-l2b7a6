# FieldNexus — Frontend ↔ Backend API Integration Map

This document maps the **frontend pages/components** (as projected for the FieldNexus web/mobile app) to the **backend endpoints** they consume. It is intended for the frontend team and for API-consuming clients.

Base URL: `http://localhost:5000/api/v1` (configurable via `PORT` / `FRONTEND_URL` in `.env`)
Response shape: `{ success, statusCode, message, data, meta? }`
Auth header: `Authorization: Bearer <accessToken>` (or the token is stored in an httpOnly cookie)

> **Note:** This is a backend-focused project. No frontend UI exists in this repository. The components below are the standard screens you would build on top of this API.

---

## 1. Common / Auth Layer

| Frontend Component / Screen | Request | Backend Endpoint |
|-----------------------------|---------|------------------|
| Auth Layout (token check, user session) | `GET` | `/auth/me` |
| Register form (Customer sign-up) | `POST` | `/auth/register` |
| Email verification screen (enter OTP) | `POST` | `/auth/verify-email` |
| Login form | `POST` | `/auth/login` |
| Google sign-in button | `POST` | `/auth/google` |
| Session auto-refresh (interceptor) | `POST` | `/auth/refresh-token` |
| Forgot password form | `POST` | `/auth/forgot-password` |
| Reset password form | `POST` | `/auth/reset-password` |

---

## 2. User (Profile / Settings)

| Frontend Component / Screen | Request | Backend Endpoint |
|-----------------------------|---------|------------------|
| Profile settings — edit info | `PATCH` | `/user/update-user-info` |
| Profile settings — avatar upload | `PATCH` | `/user/upload-profile-picture` |

---

## 3. Public Browsing (No Auth)

| Frontend Component / Screen | Request | Backend Endpoint |
|-----------------------------|---------|------------------|
| Service catalog / category list | `GET` | `/service-categories` |
| Service category detail | `GET` | `/service-categories/:id` |
| Vendors directory list (search/filter) | `GET` | `/vendors?page=&limit=&search=&status=` |
| Vendor detail / team page | `GET` | `/vendors/:id` |
| Technician application form | `POST` | `/technician-applications/apply` |
| Application status tracker | `GET` | `/technician-applications/status` |

---

## 4. Customer App

| Frontend Component / Screen | Request | Backend Endpoint |
|-----------------------------|---------|------------------|
| Create service request form | `POST` | `/work-orders` |
| My work orders list | `GET` | `/work-orders/:id` (filtered by role) |
| Work order detail page | `GET` | `/work-orders/:id` |
| Cancel order dialog (PENDING/APPROVED only) | `PATCH` | `/work-orders/:id/status` `{ status: "CANCELLED", cancellationReason, version }` |
| Feedback form (after completion) | `POST` | `/work-orders/:id/feedback` |
| Feedback read view | `GET` | `/work-orders/:id/feedback` |
| Service report view | `GET` | `/work-orders/:id/service-report` |
| Invoice / payment history list | `GET` | `/payments?page=&limit=&status=` |
| Payment detail / receipt | `GET` | `/payments/:paymentId` |
| Checkout (bKash redirect) | `POST` | `/payments/initiate` `{ workOrderId, payerReference }` |
| bKash payment return screen | `GET` | `/payments/callback?payment_id=...` |
| Cancel payment action | `POST` | `/payments/:paymentId/cancel` |
| Request refund action | `POST` | `/payments/:paymentId/refund` `{ reason }` |
| Notifications bell / list | `GET` | `/notifications?page=&limit=` |
| Mark one notification read | `PATCH` | `/notifications/:id/read` |
| Mark all notifications read | `PATCH` | `/notifications/read-all` |

---

## 5. Technician App

| Frontend Component / Screen | Request | Backend Endpoint |
|-----------------------------|---------|------------------|
| My assigned jobs list | `GET` | `/work-orders/my-assigned` |
| Job detail page | `GET` | `/work-orders/:id` |
| Accept assignment button | `POST` | `/work-orders/:id/accept` |
| Reject assignment dialog | `POST` | `/work-orders/:id/reject` `{ rejectionReason }` |
| Status actions (EN_ROUTE / IN_PROGRESS) | `PATCH` | `/work-orders/:id/status` `{ status, version }` |
| Submit service report form | `POST` | `/work-orders/:id/service-report` |
| Mark job completed (trigger for payment) | `PATCH` | `/work-orders/:id/status` `{ status: "COMPLETED", version }` |
| Payment history (read-only) | `GET` | `/payments?page=&limit=&status=` |
| Notifications bell / list | `GET` | `/notifications` |

---

## 6. Admin App

| Frontend Component / Screen | Request | Backend Endpoint |
|-----------------------------|---------|------------------|
| Dashboard (KPIs: users, vendors, jobs, revenue) | `GET` | `/admin/dashboard-stats` |
| User management table | `GET` | `/admin/users?page=&limit=&search=&role=&status=` |
| Block / delete user dialog | `PATCH` | `/admin/users/:id/status` `{ status }` |
| Restore user action | `PATCH` | `/admin/users/:id/restore` |
| Vendor management — create | `POST` | `/vendors` |
| Vendor management — edit | `PATCH` | `/vendors/:id` |
| Vendor approval / suspend | `PATCH` | `/vendors/:id` `{ status: "APPROVED" \| "SUSPENDED" }` |
| Vendor delete | `DELETE` | `/vendors/:id` |
| Vendor restore | `PATCH` | `/vendors/:id/restore` |
| Vendor team — add technician | `POST` | `/vendors/:vendorId/members` `{ technicianId }` |
| Vendor team — list | `GET` | `/vendors/:vendorId/members` |
| Vendor team — remove technician | `DELETE` | `/vendors/:vendorId/members/:technicianId` |
| Vendor team — restore technician | `PATCH` | `/vendors/:vendorId/members/:technicianId/restore` |
| Vendor performance page | `GET` | `/admin/vendors/:id/performance` |
| Service category management (CRUD) | `POST` `GET` `PATCH` `DELETE` | `/service-categories` , `/service-categories/:id` |
| Restore deleted category | `PATCH` | `/service-categories/:id/restore` |
| Work orders table (all jobs, filters) | `GET` | `/work-orders?page=&limit=&status=&priority=&search=` |
| Work order detail | `GET` | `/work-orders/:id` |
| Approve work order | `PATCH` | `/work-orders/:id/status` `{ status: "APPROVED", version }` |
| Assign technician modal | `POST` | `/work-orders/:id/assign` `{ vendorId, technicianId }` |
| Edit work order (concurrency-safe) | `PATCH` | `/work-orders/:id` `{ version, ... }` |
| Cancel work order | `PATCH` | `/work-orders/:id/status` `{ status: "CANCELLED", cancellationReason, version }` |
| Delete work order (soft) | `DELETE` | `/work-orders/:id` |
| Service report view | `GET` | `/work-orders/:id/service-report` |
| Feedback view | `GET` | `/work-orders/:id/feedback` |
| Technician applications table | `GET` | `/technician-applications?page=&limit=` |
| Application detail | `GET` | `/technician-applications/:id` |
| Approve application | `POST` | `/technician-applications/:id/approve` |
| Reject application | `POST` | `/technician-applications/:id/reject` `{ reason }` |
| Payments table / reconciliation | `GET` | `/payments?page=&limit=&status=` |
| Payment detail | `GET` | `/payments/:paymentId` |
| Refund order action | `POST` | `/payments/:paymentId/refund` `{ reason }` |
| Cancel payment action | `POST` | `/payments/:paymentId/cancel` |
| Audit log page | `GET` | `/admin/audit-logs?page=&limit=&action=&entityType=` |

---

## 7. Super Admin App

| Frontend Component / Screen | Request | Backend Endpoint |
|-----------------------------|---------|------------------|
| Admins list | `GET` | `/super-admin/admins` |
| Create admin form | `POST` | `/super-admin/admins` |
| Admin detail | `GET` | `/super-admin/admins/:id` |
| Edit admin profile | `PATCH` | `/super-admin/admins/:id` |
| Block / delete admin | `PATCH` | `/super-admin/admins/:id/status` `{ status }` |
| Restore admin | `PATCH` | `/super-admin/admins/:id/restore` |
| Restore deleted users | `PATCH` | `/admin/users/:id/restore` |
| Restore deleted vendors | `PATCH` | `/vendors/:id/restore` |
| Restore deleted categories | `PATCH` | `/service-categories/:id/restore` |
| Restore vendor members | `PATCH` | `/vendors/:vendorId/members/:technicianId/restore` |

---

## 8. Payment Callback (Server-to-Server)

| Component | Request | Backend Endpoint |
|-----------|---------|------------------|
| bKash payment gateway redirects to backend after execution | `GET` | `/payments/callback?payment_id=<bkashPaymentID>&status=<success\|failure\|cancel>` |
| Frontend is redirected back to app via `redirectUrl` | — | read `data.redirectUrl` from initiated payment / callback query (`?payment=success\|failure\|cancel`) |

bKash redirect flow:

```
Frontend "Pay" → POST /payments/initiate → get bkashURL
              → browser goes to bKash sandbox → user pays
              → bKash hits GET /payments/callback?payment_id=...&status=...
              → backend updates payment + sends receipt email
              → frontend route ?payment=success|failure|cancel
```

---

## 9. Concurrency & Data Notes for the Frontend

- **Version field (required on update):** Every `PATCH /work-orders/:id` and `PATCH /work-orders/:id/status` update must send the current `version` from the fetched record. On conflict the API returns `409` — the frontend should re-fetch the record and tell the user "this job was modified by someone else".
- **Work order status machine:** the frontend must only offer transitions valid for the current status (e.g. a Customer can only cancel `PENDING`/`APPROVED` jobs; payments can only be initiated when the job is `COMPLETED`).
- **Refund eligibility:** only payments with status `PAID` can be refunded; `CANCELLED`/`REFUNDED` payments are rejected by the API.
- **Roles:** tokens are role-scoped. The Admin app should not show Customer-only actions, and vice versa. Role rules are enforced server-side anyway (403 on violation).