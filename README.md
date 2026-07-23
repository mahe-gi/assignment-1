# Employee Leave Management System

A full-stack, internal Employee Leave Management System designed to handle real leave-balance tracking, overlapping date validations, role-based workflows (Employee vs. Manager), and analytics dashboards.

---

## Architecture and Business-Logic Decisions

- **Frontend & Backend Separation**: Clean separation with Next.js App Router on the frontend and Express.js REST API on the backend.
- **Service-Oriented Architecture**: Backend follows a clean `model` -> `service` -> `controller` -> `route` structure, keeping all core business rules encapsulated within `src/services/leaveService.js`.
- **Stateless Authentication**: JWT tokens with role claims handled via `authenticateToken` and `authorizeRoles` Express middleware. Backend logic remains the ultimate source of truth.
- **Leave Balance Model**: Every Employee starts with 20 annual leave days. Applying for leave creates a `Pending` request without deducting balance; balance is only deducted upon Manager `Approval`.
- **Cancellation & Restoration**: Cancelling a `Pending` request leaves the balance untouched. Cancelling an `Approved` request restores the deducted days to `remainingLeaveBalance` (capped at `annualLeaveBalance`).
- **Overlap Rules**: Overlapping date checks apply strictly to `Pending` and `Approved` requests for the same employee. `Rejected` and `Cancelled` requests do not block future date ranges.
- **Inclusive Calendar Days**: Dates are normalized to UTC midnight (`00:00:00.000Z`) and inclusive calendar days are computed (`(endDate - startDate) + 1`), as weekends and public holidays were not specified.

---

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JavaScript, JWT (jsonwebtoken), bcryptjs, express-validator, cors, dotenv.
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Native fetch API, React Hooks, Auth Context (`localStorage`).

---

## Folder Structure

```text
employee-leave-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── employeeController.js
│   │   │   └── leaveController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   └── validatorMiddleware.js
│   │   ├── models/
│   │   │   ├── LeaveRequest.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── employeeRoutes.js
│   │   │   └── leaveRoutes.js
│   │   ├── services/
│   │   │   └── leaveService.js
│   │   ├── utils/
│   │   │   ├── dateUtils.js
│   │   │   └── responseFormatter.js
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/
│   │   └── seed.js
│   ├── postman/
│   │   └── Employee-Leave-Management.postman_collection.json
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AnalyticsCards.tsx
│   │   ├── ApplyLeaveForm.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── FilterBar.tsx
│   │   ├── LeaveTable.tsx
│   │   └── Pagination.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── authContext.tsx
│   ├── types/
│   │   └── index.ts
│   ├── .env.local.example
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## Quick Start

```bash
chmod +x start.sh
./start.sh
```

For a clean demo database:

```bash
./start.sh --seed
```

### Notes on Startup

- Local MongoDB is reused when already running.
- If a local MongoDB URL is configured and MongoDB is unavailable, Docker is used when available.
- Remote MongoDB URLs are used directly.
- Docker is optional and not a required part of the application architecture.
- Pressing `Ctrl+C` stops frontend and backend services while leaving the database running.

---

## Prerequisites

- **Node.js**: v18.x or later
- **MongoDB**: MongoDB must be available at `localhost:27017`. It may run as a local MongoDB service or through an optional Docker container.

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/employee_leave_management
JWT_SECRET=super_secret_jwt_key_employee_leave_management_2026
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3010
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Backend Setup & Seed

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

The seed script initializes three demo user accounts with hashed passwords:

### Demo Credentials

| Role | Name | Email | Password | Initial Balance |
| :--- | :--- | :--- | :--- | :--- |
| **Manager** | Demo Manager | `manager@example.com` | `Manager@123` | N/A |
| **Employee 1** | Demo Employee | `employee@example.com` | `Employee@123` | 20 days |
| **Employee 2** | Second Employee | `employee2@example.com` | `Employee@123` | 20 days |

---

## Frontend Setup & Run Commands

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev -- -p 3010
```

Open `http://localhost:3010` in your browser.

---

## API Endpoint Summary

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | All | Authenticates user & returns JWT |
| `GET` | `/api/employees` | Bearer | Manager | Returns employee list for filter dropdown |
| `POST` | `/api/leaves` | Bearer | Employee | Applies for leave (Pending, no balance deduction) |
| `GET` | `/api/leaves` | Bearer | All | Lists leaves with filters & pagination (`activeOnly=true` mode for employee active check) |
| `PATCH` | `/api/leaves/:id/approve` | Bearer | Manager | Approves Pending request & deducts balance |
| `PATCH` | `/api/leaves/:id/reject` | Bearer | Manager | Rejects Pending request (no balance change) |
| `PATCH` | `/api/leaves/:id/cancel` | Bearer | Employee | Cancels own request (restores balance if Approved) |
| `GET` | `/api/dashboard` | Bearer | All | Returns dashboard metrics (global & filtered for Manager) |

---

## Manual Testing & Workflow Scenarios

1. **Authentication**:
   - Log in as Employee (`employee@example.com` / `Employee@123`).
   - Log in as Manager (`manager@example.com` / `Manager@123`).
   - Bad credentials return HTTP 401 error.

2. **Apply Leave**:
   - As Employee, submit a 3-day leave request (e.g., Aug 10 - Aug 12).
   - Status becomes `Pending`. Balance remains 20.

3. **Date Overlap Check**:
   - Try submitting another leave request for Aug 12 - Aug 15.
   - The backend and frontend return HTTP 409 Overlap Error because Aug 12 overlaps with the `Pending` request.

4. **Approve Leave**:
   - Log in as Manager, locate the Aug 10 - Aug 12 request, click **Approve**.
   - Status becomes `Approved`. The employee's balance updates to 17.

5. **Cancel Approved Leave**:
   - Log back in as Employee, click **Cancel** on the `Approved` request.
   - Status becomes `Cancelled`, and 3 days are restored to the employee balance (back to 20).

6. **Insufficient Balance Check**:
   - Apply for a leave exceeding remaining balance.
   - Submission is rejected with an explicit error message.

7. **Manager Filtering & Search**:
   - Change filters (search name, status, employee dropdown, start/end dates).
   - Page resets to 1, and both `/api/leaves` and `/api/dashboard` refetch live results without a full page reload.

---

## Known Scope Decisions & Tradeoffs

- **Weekend/Public Holidays**: Standard calendar day inclusive calculations are used per project scope.
- **State Management**: React `useState` and native `fetch` are used instead of Redux, Zustand, or React Query per non-goals.
- **Client Storage**: Tokens are stored in `localStorage` as permitted for this practical assignment scope.
