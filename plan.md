# Electro Admin Dashboard — Full Implementation Plan

A role-based SPA admin dashboard (Vite + React + TypeScript recommended) that consumes the Electro REST API. Designed to give **Owner/Admin** roles full control over every entity, job, and setting in the system.

---

## 1. Global Architecture

### Tech Stack (recommended)

- **Framework**: React 18 + Vite + TypeScript
- **Routing**: React Router v6 (protected routes by role)
- **State/Data**: TanStack Query (React Query) + Zustand for UI/auth state
- **UI**: TailwindCSS + shadcn/ui (or Ant Design if preferred)
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table (sorting, filtering, pagination, row selection)
- **Charts**: Recharts
- **i18n**: react-i18next (en/ar with RTL toggle to mirror backend `Language`)
- **HTTP**: Axios with JWT interceptor + 401 refresh logic + RFC 7807 error parser
- **File handling**: multipart for logo upload, blob download for PDF

### App Shell

- **Top bar**: Company logo + name, search (global), language switcher (EN/AR), notifications bell, user menu (profile, logout)
- **Sidebar**: Grouped navigation with role-based visibility
- **Breadcrumbs**: On every page
- **Footer**: API version + tenant info

### Sidebar Grouping

1. **Overview** → Dashboard
2. **Billing** → Customers, Invoices, Payments, Meter Readings, Skipped Invoices
3. **Operations** → Expenses, WhatsApp, Notifications
4. **Infrastructure** → Areas, Distribution Boxes, Ampere Schedules
5. **Administration** → Company Profile, Preferences, Employees, Audit Logs, Background Jobs (Hangfire)

---

## 2. Authentication & Onboarding Pages

### 2.1 Login Page (`/login`)

- **Section A — Login Card**
  - Email + password fields
  - "Remember me" checkbox
  - Submit button with loading state
  - Rate-limit error handling (5/min/IP → friendly message + countdown)
  - 401/403 RFC 7807 mapping to user-friendly Arabic/English text
- **Section B — Banned company notice**
  - If backend returns 403 due to `IsBanned`, show banner: "Your company is suspended. Contact support."
- **Section C — Register link** → leads to `/register`

### 2.2 Register Page (`/register`)

- **Section A — Company Setup**
  - Company Name
  - Logo upload (preview, 2MB, JPEG/PNG/WebP)
- **Section B — Admin Account**
  - Full Name, Email, Password, Confirm Password
- **Section C — Default Preferences (optional, with sensible defaults)**
  - Default PricePerKilowat, PricePerAmp, FixedCharge, TVA
  - Language (en/ar), DueDate (1–31), TriggerDate (1–31)
- **Section D — Submit** → calls `POST /auth/register`, then auto-login

### 2.3 Auth Routes Guard

- `<RequireAuth>` wrapper → redirects to `/login` if no JWT
- `<RequireRole roles={['Owner','Admin']}>` for admin-only routes
- Token stored in `localStorage` (or httpOnly cookie if proxied)

---

## 3. Dashboard Overview Page (`/dashboard`)

Calls `GET /dashboard/summary`. The landing page for Owners/Admins.

### Section A — KPI Cards (top row)

1. **Total Billed** (all-time) — with trend chip
2. **Total Collected** — % of billed
3. **Outstanding** — amount + count of unpaid invoices
4. **Total Expenses** — with breakdown by type (Fuel/Maintenance/Employees/Other)

### Section B — Customer Stats Row

- Active customers count
- Suspended count
- Terminated count
- Per-plan breakdown (Ampere / Kilowatt / FixedKilowatt) as donut chart

### Section C — Invoice Status Breakdown

- Bar/donut chart: Unpaid vs PartiallyPaid vs Paid
- Total invoices issued
- Average invoice value

### Section D — Quick Actions

- "Create Invoice" → `/invoices/new`
- "Add Customer" → `/customers/new`
- "Bulk Generate Invoices" → `/invoices/bulk`
- "Record Payment" → modal
- "Send WhatsApp Reminders" (info: runs daily 9 AM via Hangfire)

### Section E — Recent Activity (mini audit feed)

- Last 10 audit log entries (action + user + entity + timestamp)
- Link to full audit log page

### Section F — Upcoming Reminders

- Companies where `triggerDate` matches today (or within next 7 days)
- Status of WhatsApp connection

### Section G — Skipped Customers Alert

- Count of `InvoiceSkip` records for current billing period
- Link to `/invoices/skipped`

---

## 4. Customers Module

### 4.1 Customers List Page (`/customers`)

Calls `GET /customers` with filters.

#### Section A — Filter Bar

- Search by Name / Phone
- Area dropdown (from `/areas/all`)
- Distribution Box dropdown (filtered by area)
- Plan Type dropdown (lookup)
- Customer Type dropdown (lookup)
- Customer Relation dropdown (lookup)
- Customer Status dropdown (lookup)
- Payment Filter (e.g., Has Unpaid Invoices)
- "Reset" + "Apply" buttons
- "Export CSV" button (client-side)

#### Section B — Bulk Actions Bar (appears on row select)

- Suspend selected (Owner/Admin) → `POST /customers/suspend`
- "Clear selection" button

#### Section C — Customers Table

Columns:

- Checkbox (row select)
- Invoice # / Name (clickable → detail)
- Phone
- Plan (badge: Ampere/Kilowatt/FixedKilowatt)
- Type (badge: Residential/Commercial/Industrial)
- Status (badge: Active/Suspended/Terminated)
- Area
- Distribution Box
- Pricing Override indicator (icon if `hasPricingOverride`)
- Outstanding amount (computed)
- Actions: View, Edit, Delete (Owner/Admin), Suspend/Unsuspend

#### Section D — Pagination + Page Size

- Server-side pagination
- Page size selector (10/25/50/100)

#### Section E — "Add Customer" floating action button → `/customers/new`

### 4.2 Create Customer Page (`/customers/new`)

Calls `POST /customers`.

#### Section A — Basic Info

- Name (required)
- Phone
- Subscription Date (date picker, default today)
- Customer Type (Residential/Commercial/Industrial)
- Customer Relation (Friend/Family/Owner/Other)

#### Section B — Address Info

- Address (max 500)
- Building (max 100)
- Floor (max 50)
- Cable Name (max 100)

#### Section C — Plan & Subscription

- Plan Type (Ampere/Kilowatt/FixedKilowatt)
- Plan Value (amps or kWh limit)
- Customer Status (Active default)
- Area (dropdown)
- Distribution Box (filtered by area)
- Ampere Schedule (only if Plan=Ampere AND `ampereSchedulePricingEnabled=true`) — required when schedule pricing is on

#### Section D — Pricing Override (optional)

- Toggle "Use custom pricing for this customer"
- Price Override, Fixed Charge Override, TVA Override (all three required together)
- Warning: "All three fields must be set, or all left empty"
- "Clear Override" button

#### Section E — Actions

- Save Customer (validates schedule assignment rules)
- Cancel → back to list
- Live preview of effective rates (calls `GET /lookups/...` + computed)

### 4.3 Edit Customer Page (`/customers/{id}/edit`)

Same form as create, pre-filled. Calls `PATCH /customers/{id}` (supports partial updates + `clearPricingOverride`).

### 4.4 Customer Detail Page (`/customers/{id}`)

Calls `GET /customers/{id}` (with billing totals). The command center for a single customer.

#### Section A — Customer Header

- Name, Plan badge, Status badge
- Phone (click to WhatsApp), Address summary
- Edit / Delete / Suspend buttons (role-gated)
- "Generate Invoice" button (jumps to invoice create pre-filled)

#### Section B — KPI Strip

- Total Billed
- Total Paid
- Outstanding
- Last invoice date
- Last payment date
- Pricing source indicator (Override / Type-based / Default / Schedule)

#### Section C — Tabs

**Tab 1: Overview**

- Subscription info (date, plan, plan value)
- Type & relation
- Area + Distribution Box + Ampere Schedule
- Pricing details (effective rates with source explanation)
- Address details (building, floor, cable)

**Tab 2: Invoices**

- Table of all customer invoices
- Columns: Invoice #, Issue Date, Due Date, Total, Paid, Amount Due, Status
- Row actions: View, Print, Pay (if not fully paid), Delete (Owner/Admin, fails if payments exist)
- "Create Invoice" button (pre-filled customer)

**Tab 3: Payments**

- Table of all customer payments
- Columns: Date, Amount, Method (Cash/Wish), Invoice #, Notes
- "Record Payment" button

**Tab 4: Meter Readings** (Kilowatt customers only)

- "Add Reading" button → modal: readingValue, readingDate (optional, default today)
- Validation messaging: one per month, monotonic
- Table: Reading Value, Reading Date, Period (YYYYMM), Actions (delete)
- Highlight latest reading
- For FixedKilowatt: readings are auto-created from payments (read-only here)

**Tab 5: Activity Log**

- Filtered audit log for this customer (action, user, timestamp, details expand)

---

## 5. Invoices Module

### 5.1 Invoices List Page (`/invoices`)

Calls `GET /invoices`.

#### Section A — Filter Bar

- Customer search (autocomplete from `/customers/all`)
- Invoice Status (Unpaid/PartiallyPaid/Paid)
- Issue Date Range (from/to date pickers)
- Invoice Number search
- Reset / Apply / Export CSV

#### Section B — Bulk Actions Bar

- "Bulk Generate" button → `/invoices/bulk` (Owner/Admin)
- "Create Single" button → `/invoices/new`

#### Section C — Invoices Table

Columns:

- Invoice #
- Customer Name (clickable → customer detail)
- Issue Date
- Due Date
- Total Amount
- Paid Amount
- Amount Due
- Status (badge)
- Plan type icon
- Actions: View, Print (HTML), Download PDF, Record Payment, Edit (dates only), Delete (Owner/Admin)

#### Section D — Pagination + page size

### 5.2 Create Single Invoice Page (`/invoices/new`)

Calls `POST /invoices`. Behavior depends on selected plan.

#### Section A — Customer Selection

- Customer autocomplete (filter by plan type if needed)
- Show customer's plan, current outstanding, last invoice date

#### Section B — Plan-Specific Form

**For Ampere**:

- Auto-display: issue date = today, due date = preference day
- Show computed total: `planValue × unitPrice + fixedCharge` + TVA
- "Generate" button → creates Unpaid invoice

**For Kilowatt**:

- Show required meter reading lookup window
- Latest reading display (or "No reading found — will be skipped")
- Reading value input (if no reading in window)
- Computed consumption preview
- Computed total preview
- "Generate" button

**For FixedKilowatt**:

- Toggle: "By Payment Amount" / "By kWh Amount" (xor)
- Payment Amount OR Kilowatt Amount input
- Payment Method (Cash/Wish)
- "Calculate Preview" button → calls `POST /invoices/fixed-kilowatt/calculate` (no save)
- Preview shows: kWh credited, total amount, due date = today
- "Generate" button → creates Paid invoice + payment + meter reading atomically

#### Section C — Live Calculation Panel

- Shows pricing breakdown: unitPrice, fixedCharge, TVA, planValue, computed total
- Pricing source badge (Override/Type/Default/Schedule)

#### Section D — Actions

- Generate Invoice
- Cancel

### 5.3 Bulk Invoice Generation Page (`/invoices/bulk`)

Calls `POST /invoices/bulk` (Owner/Admin).

#### Section A — Pre-flight Summary

- Billing period display (computed via BillingPeriodHelper logic on backend)
- Count of active customers eligible
- Count of customers with existing invoice for period (will be skipped)
- Count of FixedKilowatt customers (excluded automatically)

#### Section B — Execution

- "Run Bulk Generation" button
- Live progress (if backend supports streaming) or final result modal
- Result: created count, skipped count, errors

#### Section C — Post-Execution

- Link to `/invoices/skipped` for skip reasons
- Link to invoice list filtered to current period

### 5.4 Invoice Detail Page (`/invoices/{id}`)

Calls `GET /invoices/{id}` (with payments).

#### Section A — Invoice Header

- Invoice #, Status badge
- Issue Date, Due Date
- Customer info (clickable)
- Plan type

#### Section B — Amounts Panel

- Total Amount
- Paid Amount
- Amount Due
- Billed Consumption (FixedKilowatt only)
- Fixed Charge, TVA breakdown
- Pricing source

#### Section C — Payments Table

- All payments for this invoice (`GET /invoices/{id}/payments`)
- Columns: Date, Amount, Method, Notes
- "Record Payment" button (opens modal) → `POST /invoices/{id}/pay`
  - Amount (default = amount due, with max validation)
  - Payment Method (Cash/Wish)
  - Payment Date (default now)
  - Notes
- Auto-status update messaging (Unpaid → PartiallyPaid → Paid)

#### Section D — Actions

- Print (HTML) → opens `/invoices/print/{id}` in new tab
- Download PDF → `GET /invoices/print/{id}/pdf` (blob)
- Edit Dates → modal: issue date, due date → `PUT /invoices/{id}`
- Delete (Owner/Admin) → `DELETE /invoices/{id}` with 400 warning if payments exist

#### Section E — Activity Log

- Audit entries for this invoice (creation, payment, etc.)

### 5.5 Skipped Invoices Page (`/invoices/skipped`)

Calls `GET /invoices/skipped`.

#### Section A — Filter Bar

- Billing period filter
- Customer search
- Reason filter

#### Section B — Skipped Customers Table

- Customer Name (clickable)
- Billing Period Start / End
- Reason (e.g., "Missing meter reading")
- "Add Reading" shortcut → customer meter readings tab
- "Create Invoice" shortcut → invoice create pre-filled

### 5.6 Invoice Print View (`/invoices/print/{id}`)

- Renders backend HTML response in iframe or new tab
- RTL layout if company language is Arabic
- "Download as PDF" button → triggers PDF endpoint

---

## 6. Payments Module

### 6.1 All Payments Page (`/payments`)

Calls `GET /payments/all`.

#### Section A — Filter Bar

- Date range
- Payment Method (Cash/Wish)
- Customer search
- Invoice # search
- Amount range
- Reset / Export CSV

#### Section B — Payments Table

Columns:

- Payment Date
- Customer (clickable)
- Invoice # (clickable)
- Amount
- Method (badge)
- Notes
- Recorded By (from audit log if available)

#### Section C — Summary Strip

- Total collected (filtered)
- Count of payments
- Cash vs Wish split (donut chart)
- Daily collection trend (line chart)

#### Section D — Pagination + export

---

## 7. Meter Readings Module

### 7.1 Company-Wide Meter Readings Page (`/meter-readings`)

Calls `GET /meter-readings/all`.

#### Section A — Filter Bar

- Customer search
- Area filter
- Date range (reading date)
- Period (YYYYMM picker)
- Reset / Export CSV

#### Section B — Readings Table

Columns:

- Customer (clickable)
- Reading Value
- Reading Date
- Period (YYYYMM)
- Previous Reading (computed)
- Consumption (computed diff)
- Plan Type (badge)
- Actions: View Customer, Delete (Owner/Admin)

#### Section C — Bulk Import (optional enhancement)

- CSV upload: customer phone + reading value + date
- Validation preview before commit
- Per-row error reporting (one/month rule, monotonic rule)

#### Section D — Summary

- Total readings this month
- Customers missing readings for current period (alert + link to customers filter)

### 7.2 Per-Customer Readings

Embedded in Customer Detail Tab 4 (see §4.4).

---

## 8. Expenses Module

### 8.1 Expenses List Page (`/expenses`)

Calls `GET /expenses`.

#### Section A — Filter Bar

- Expense Type (Fuel/Maintenance/Employees/Other)
- Date range
- Label search (for Other type)
- Amount range
- Reset / Export CSV

#### Section B — Summary Cards

- Total expenses (filtered)
- By type breakdown (donut)
- Monthly trend (bar chart)

#### Section C — Expenses Table

Columns:

- Date
- Type (badge)
- Label (if Other)
- Amount
- Notes
- Actions: Edit, Delete (Owner/Admin)

#### Section D — "Add Expense" button → modal

- Expense Type dropdown
- Amount (> 0)
- Expense Date
- Label (required if type=Other, max 100)
- Notes (max 500)
- Save / Cancel

#### Section E — Edit Expense Modal

Same form, pre-filled. `PUT /expenses/{id}`.

#### Section F — Pagination + page size

---

## 9. Infrastructure Module

### 9.1 Areas Page (`/areas`)

Calls `GET /areas` + CRUD.

#### Section A — Areas Table

- Name
- Customer count
- Distribution Box count
- Actions: Edit, Delete (fails if has customers → show error toast)

#### Section B — Add/Edit Area Modal

- Name (required, max 200)
- Save / Cancel

### 9.2 Distribution Boxes Page (`/distribution-boxes`)

Calls `GET /distribution-boxes`.

#### Section A — Filter Bar

- Area filter
- Name search
- Reset

#### Section B — Distribution Boxes Table

- Name
- Area (clickable)
- Location Note
- Customer count
- Notes
- Actions: Edit, Delete (Owner/Admin)

#### Section C — Add/Edit Distribution Box Modal

- Name (required, max 200)
- Area (required dropdown)
- Location Note (max 500)
- Notes (max 1000)
- Save / Cancel

#### Section D — Pagination

### 9.3 Ampere Schedules Page (`/ampere-schedules`)

Calls `GET /ampere-schedules`.

#### Section A — Info Banner

- Shows whether `ampereSchedulePricingEnabled` is on/off (link to preferences)
- Warning if enabled but no schedules exist

#### Section B — Schedules Table

- Name
- Hours Per Day (1–24, unique per company)
- Price Per Amp
- Customer count (assigned)
- Actions: Edit, Delete (Owner/Admin)

#### Section C — Add/Edit Schedule Modal

- Name (required, max 200)
- Hours Per Day (1–24, validates uniqueness)
- Price Per Amp (> 0)
- Save / Cancel

---

## 10. Company Administration

### 10.1 Company Profile Page (`/company/profile`)

Calls `GET /company/profile` + `PUT /company/profile`.

#### Section A — Company Info

- Company Name (editable)
- Logo preview (current or placeholder)
- "Upload New Logo" button (drag-drop, 2MB, JPEG/PNG/WebP)
- "Remove Logo" button (sets `removeLogo` flag)
- Save button (multipart form submission)

#### Section B — Banned Status Indicator

- If `IsBanned` → red banner: "This company is banned. API access is blocked."
- (Banning is controlled by super-admin outside this dashboard)

### 10.2 Company Preferences Page (`/company/preferences`)

Calls `GET /company/preferences` + `PUT /company/preferences`.

#### Section A — Default Pricing

- Default Price Per Kilowatt
- Default Price Per Amp
- Default Fixed Charge
- Default TVA (%)

#### Section B — Customer-Type Specific Pricing

Three subsections (Residential / Commercial / Industrial), each with:

- Price Per Amp
- Price Per Kilowatt
- Fixed Charge
- TVA
- Helper text: "Set to 0 to fall back to defaults"

#### Section C — Ampere Schedule Pricing

- Toggle: `ampereSchedulePricingEnabled`
- Warning: "Requires at least one AmpereSchedule to exist before enabling"
- Validation: backend returns 400 if no schedules — show inline error
- Link to `/ampere-schedules` to manage schedules

#### Section D — Billing Configuration

- Due Date (1–31 dropdown with rules explanation)
  - Helper: "31, 1, or 2 → last day of month. 30 → day 30 (capped). 3–29 → that day."
- Kilowatt grace period explanation (when dueDate is 1 or 2)

#### Section E — WhatsApp / Notifications

- Trigger Date (1–31 dropdown with clamping rules)
- Trigger Message (textarea, Arabic default text)
- Helper: "Sent daily at 9 AM via Hangfire to customers with unpaid invoices"

#### Section F — Language

- Language selector (en/ar)
- Helper: "Controls invoice template language and dashboard RTL"

#### Section G — Save / Reset

- Save button (validates all fields)
- Reset to previous values

### 10.3 Employees / Users Page (`/company/employees`)

Calls `POST /auth/employees` (Owner/Admin). List comes from Identity users scoped to company.

#### Section A — Employees Table

- Full Name
- Email
- Role (Owner/Admin/User badge)
- Created At
- Last active (if tracked)
- Actions: Edit Role, Deactivate (soft delete or lock)

#### Section B — Add Employee Modal

- Full Name
- Email
- Password (with strength meter)
- Role (dropdown: Admin/User — Owner reserved for first admin)
- "Create Employee" button → `POST /auth/employees`

#### Section C — Role Permissions Matrix (read-only info card)

- Shows what each role can do (Owner: everything, Admin: most, User: read + create)

### 10.4 Audit Logs Page (`/audit-logs`)

Calls `GET /audit-logs` (Owner/Admin only).

#### Section A — Filter Bar

- Action type (dropdown from `AuditAction` enum)
- Status (Success/Failed)
- Entity Type filter
- Date range (createdFrom/To)
- User filter (by email)
- Reset / Export CSV

#### Section B — Audit Logs Table

- Timestamp
- User (email)
- Action (badge, color-coded by category)
- Entity Type
- Entity ID (clickable if Customer/Invoice/Expense → navigates)
- Summary (max 500 chars)
- Status (Success green / Failed red)
- Expand row → shows `Details` JSONB in formatted viewer

#### Section C — Summary Strip

- Total actions (filtered)
- Success rate
- Top actions (bar chart)
- Activity over time (line chart)

#### Section D — Pagination

### 10.5 Background Jobs Page (`/jobs`)

Links to Hangfire dashboard.

#### Section A — Job Status Cards

- WhatsApp Trigger Job (daily 9 AM) — last execution, next run, status
- Auto-migration status
- (Read-only info; management happens in Hangfire)

#### Section B — "Open Hangfire Dashboard" button

- Opens `/hangfire` in new tab (requires auth — configure same JWT or basic auth)

---

## 11. WhatsApp Module

### 11.1 WhatsApp Connection Page (`/whatsapp`)

Calls `/whatsapp/*` endpoints (Owner/Admin).

#### Section A — Connection Status Card

- State indicator: Open (green) / Close (red) / Connecting (yellow)
- "Refresh Status" button → `GET /whatsapp/status`
- Last connected time

#### Section B — QR Code Section

- "Connect" button → `POST /whatsapp/connect`
- QR code rendered from `data:image/png` response
- Auto-refresh QR if expired
- Scan instructions (Arabic + English)

#### Section C — Disconnect

- "Disconnect" button (Owner only) → `DELETE /whatsapp/disconnect`
- Confirmation modal

#### Section D — Test Message

- Phone number input
- Message textarea (default trigger message)
- "Send Test" button → `POST /notifications/test` or `POST /auth/test-whatsapp`

#### Section E — Reminder Schedule Info

- Shows trigger date, trigger message, next run time
- Link to preferences page to edit

---

## 12. Notifications Module

### 12.1 Notifications Test Page (`/notifications`)

Calls `POST /notifications/test`.

#### Section A — Test Form

- Phone Number (with country code)
- Message (textarea, character counter)
- "Send Test Notification" button
- Response status + delivery confirmation

#### Section B — History (client-side, optional)

- Last 10 test notifications sent this session

---

## 13. Lookups & Reference Data

### 13.1 Lookups Page (`/lookups`) — Reference only

Displays read-only data fetched from `/lookups/*`:

#### Section A — Customer Types

- Residential, Commercial, Industrial (value + label)

#### Section B — Customer Relations

- Friend, Family, Owner, Other

#### Section C — Plan Types

- Ampere, Kilowatt, FixedKilowatt (with descriptions of each billing model)

#### Section D — Customer Statuses

- Active, Suspended, Terminated

---

## 14. User Account & Settings

### 14.1 My Profile Page (`/account`)

#### Section A — Profile Info

- Full Name, Email (read-only)
- Avatar (initials or uploaded)
- Change Password form (current, new, confirm)

#### Section B — Preferences

- Dashboard language (en/ar)
- Theme (light/dark, if implemented)
- Default table page size

#### Section C — Sessions

- Active sessions list (if tracked)
- "Logout All" button

### 14.2 Logout

- Clears JWT from storage
- Calls any logout endpoint (if implemented)
- Redirects to `/login`

---

## 15. Shared Components & Utilities

### 15.1 Global Components

- **DataTable**: reusable table with pagination, sorting, filtering, row selection, CSV export
- **ConfirmDialog**: for delete/suspend actions with warning text
- **ErrorBoundary**: catches render errors, shows fallback
- **ProblemDetailsHandler**: parses RFC 7807 responses into toast messages
- **RoleGate**: `<RoleGate roles={['Owner']}>` wrapper for conditional rendering
- **MoneyDisplay**: formats decimal(18,4) with currency symbol
- **DateDisplay**: handles DateOnly vs DateTime properly
- **StatusBadge**: color-coded badges for all enums
- **EmptyState**: friendly empty states with CTAs
- **LoadingSkeleton**: per-section loading states

### 15.2 Global Hooks

- `useAuth()` — current user, role, company
- `useApi<T>(endpoint)` — TanStack Query wrapper
- `usePermissions()` — role checks
- `useToast()` — notifications
- `useConfirm()` — confirmation dialog promise

### 15.3 Utilities

- **JWT decoder** — extract CompanyId, role, expiry
- **RFC 7807 parser** — extract `title`, `detail`, `errors` dictionary
- **Date helpers** — DateOnly formatting, billing period computation (mirror BillingPeriodHelper for UI preview)
- **Pricing calculator** — mirror `InvoiceCalculationHelper` for live preview before API call
- **i18n** — full EN/AR translations including RTL layout switching

### 15.4 Error Handling Strategy

- **401** → redirect to login, clear token
- **403 (banned)** → show banned banner, prevent further actions
- **403 (role)** → toast "You don't have permission"
- **400** → display validation errors inline + toast
- **404** → "Not found" page with back navigation
- **409** → conflict handling (e.g., duplicate meter reading)
- **429** → rate limit toast with retry countdown
- **500** → generic error toast with trace ID

---

## 16. Page Count Summary

| #   | Page                    | Route                  | Roles                    |
| --- | ----------------------- | ---------------------- | ------------------------ |
| 1   | Login                   | `/login`               | Public                   |
| 2   | Register                | `/register`            | Public                   |
| 3   | Dashboard Overview      | `/dashboard`           | Any                      |
| 4   | Customers List          | `/customers`           | Any                      |
| 5   | Create Customer         | `/customers/new`       | Any                      |
| 6   | Edit Customer           | `/customers/:id/edit`  | Any                      |
| 7   | Customer Detail         | `/customers/:id`       | Any                      |
| 8   | Invoices List           | `/invoices`            | Any                      |
| 9   | Create Invoice          | `/invoices/new`        | Any                      |
| 10  | Bulk Invoice Generation | `/invoices/bulk`       | Owner/Admin              |
| 11  | Invoice Detail          | `/invoices/:id`        | Any                      |
| 12  | Skipped Invoices        | `/invoices/skipped`    | Any                      |
| 13  | Invoice Print View      | `/invoices/print/:id`  | Any                      |
| 14  | Payments List           | `/payments`            | Any                      |
| 15  | Meter Readings (all)    | `/meter-readings`      | Any                      |
| 16  | Expenses List           | `/expenses`            | Any                      |
| 17  | Areas                   | `/areas`               | Any (write: Owner/Admin) |
| 18  | Distribution Boxes      | `/distribution-boxes`  | Any (write: Owner/Admin) |
| 19  | Ampere Schedules        | `/ampere-schedules`    | Any (write: Owner/Admin) |
| 20  | Company Profile         | `/company/profile`     | Any (write: Owner/Admin) |
| 21  | Company Preferences     | `/company/preferences` | Any (write: Owner/Admin) |
| 22  | Employees               | `/company/employees`   | Owner/Admin              |
| 23  | Audit Logs              | `/audit-logs`          | Owner/Admin              |
| 24  | Background Jobs         | `/jobs`                | Owner/Admin              |
| 25  | WhatsApp Connection     | `/whatsapp`            | Owner/Admin              |
| 26  | Notifications Test      | `/notifications`       | Any                      |
| 27  | Lookups Reference       | `/lookups`             | Any                      |
| 28  | My Profile              | `/account`             | Any                      |
| 29  | Not Found (404)         | `*`                    | Any                      |
| 30  | Forbidden (403)         | `/forbidden`           | Any                      |

**Total: 30 pages** (28 functional + 2 error pages)

---

## 17. Implementation Phases

### Phase 1 — Foundation (Week 1)

- Project setup (Vite, Tailwind, routing, TanStack Query)
- Auth (login, register, JWT interceptor, role guards)
- App shell (sidebar, topbar, breadcrumbs)
- i18n setup (EN/AR with RTL)
- Reusable DataTable + form components
- RFC 7807 error handling

### Phase 2 — Core Billing (Week 2)

- Dashboard overview page
- Customers (list, create, edit, detail with all tabs)
- Invoices (list, create single, detail, pay)
- Payments list
- Meter readings (company-wide + per-customer)

### Phase 3 — Operations & Infrastructure (Week 3)

- Expenses CRUD
- Areas + Distribution Boxes
- Ampere Schedules
- Bulk invoice generation
- Skipped invoices page
- Invoice print + PDF download

### Phase 4 — Administration (Week 4)

- Company profile (with logo upload)
- Company preferences (all pricing + billing config)
- Employees management
- Audit logs with filters
- WhatsApp connection + QR
- Notifications test
- Background jobs status
- Lookups reference page
- My profile + settings

### Phase 5 — Polish (Week 5)

- Dark mode
- Responsive (mobile/tablet)
- Empty states + loading skeletons
- CSV exports on all list pages
- Charts on dashboard + expenses
- Accessibility (ARIA, keyboard nav)
- Performance optimization (code splitting, lazy load)

---

## 18. API Coverage Checklist

| Backend Module                                        | Frontend Coverage          |
| ----------------------------------------------------- | -------------------------- |
| Auth (register, login, employees, test-whatsapp)      | ✅ Pages 2, 1, 22, 25      |
| Customers (CRUD, suspend, all)                        | ✅ Pages 4–7               |
| Meter Readings (per-customer + all)                   | ✅ Pages 7 (Tab 4), 15     |
| Invoices (CRUD, bulk, pay, print, PDF, skipped, calc) | ✅ Pages 8–13              |
| Payments (all)                                        | ✅ Page 14                 |
| Dashboard (summary)                                   | ✅ Page 3                  |
| Expenses (CRUD)                                       | ✅ Page 16                 |
| Areas (CRUD)                                          | ✅ Page 17                 |
| Distribution Boxes (CRUD)                             | ✅ Page 18                 |
| Ampere Schedules (CRUD)                               | ✅ Page 19                 |
| Company (profile, preferences)                        | ✅ Pages 20, 21            |
| Audit Logs                                            | ✅ Page 23                 |
| WhatsApp (connect, status, disconnect)                | ✅ Page 25                 |
| Lookups (4 endpoints)                                 | ✅ Page 27                 |
| Notifications (test)                                  | ✅ Page 26                 |
| Hangfire dashboard                                    | ✅ Page 24 (external link) |

**All 17 controllers and ~60+ endpoints are fully covered.**

---

This plan gives Owners and Admins complete control over every aspect of the Electro system — from customer onboarding through billing, payments, infrastructure, company configuration, and audit oversight — while respecting role-based permissions at every level.
