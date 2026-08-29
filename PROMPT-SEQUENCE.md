# PROMPT-SEQUENCE.md — How to build this with Claude Code

## How to use this

1. Put `CLAUDE.md` in your repo root **first**. Claude Code reads it automatically
   and it grounds every prompt below.
2. Feed the prompts **one at a time, in order**. Each stage depends on the previous.
3. **Do not move to the next prompt until the current one runs.** Start the app,
   click through what you just built, fix issues, *then* continue. The order is
   chosen so that whenever you stop, you have a working product — not half-features.
4. After each stage, commit to git. If a stage goes sideways, you can roll back one
   step instead of losing everything.
5. When Claude Code proposes something that contradicts `CLAUDE.md`, tell it to
   re-read `CLAUDE.md` — that file wins.

Prompts 1–13 are the **app** (build these first). Prompt 14 is the **deployment /
installer** stage — only after the app works.

---

## PROMPT 1 — Foundation, DB, auth, roles

```
Read CLAUDE.md fully before doing anything.

Scaffold the project:
- Backend: FastAPI + SQLAlchemy + Alembic + Pydantic, in an `app/` package with
  models/, schemas/, routers/, services/, core/ (config, db, security, deps).
  Read DATABASE_URL from env; default to a local SQLite file for dev. Keep all DB
  access portable through SQLAlchemy so the engine can be swapped later.
- Frontend: React + Vite + Tailwind, feature-based folders, a shared API client.
- Set up Alembic and generate the initial migration.

Build the foundation only (no business modules yet):
- Tables: businesses, users, feature_flags (per CLAUDE.md §6). Seed two businesses:
  "Main" and "IIM". Seed one admin user.
- Auth: password login + optional 4–6 digit PIN. Session or JWT. Login screen,
  protected routes, logout, session auto-lock after inactivity.
- Roles: admin | employee, enforced in a FastAPI dependency. Add a reusable
  `require_role` / `require_admin` dependency now so later modules can use it.
- A <BusinessContext> on the frontend holding the active business (Main/IIM) with a
  switcher in the shell; every API call sends the active business_id.
- App shell: left sidebar nav (placeholders for the modules), top bar, the business
  switcher. Match the general layout of the reference screenshots (dark sidebar,
  light content).

Done when: I can log in as admin, see the empty shell, switch between Main and IIM,
and the server rejects a role I'm not allowed to hit.
```

---

## PROMPT 2 — Businesses & Settings

```
Read CLAUDE.md. Build the Settings area (admin-only), with a left settings-nav like
the reference:

- Company Profile (per active business): logo upload, name, legal name, tax id,
  CR no, phone, email, website, full address, and bank details (account name,
  IBAN/account no, SWIFT, bank name). This is where Main vs IIM profiles are edited.
- Regional: base currency, currency display (code|symbol), date format, timezone.
- Invoice Defaults: default notes + terms (cash and credit), default VAT rate,
  and the `show_govt_fee_on_invoice` toggle.
- Quotation Defaults: default validity days, default notes/terms.
- Feature Flags screen ("Modules & Features"): list feature_flags with on/off
  toggles (coupons, notifications, attendance, IIM, design studio, etc.).
- Security: change password, set PIN, auto-lock timeout.

All settings persist to the businesses table (or feature_flags where global).
Enforce admin-only server-side.

Done when: I can fully edit both the Main and IIM business profiles and toggle
features, and the values persist.
```

---

## PROMPT 3 — Customers (with company → employees)

```
Read CLAUDE.md. Build the Customers module, scoped to the active business.

- customers table per CLAUDE.md §6, including type (individual|company) and the
  self-FK parent_customer_id for employees under a company.
- List view: search (name/phone/tax id), filter, pagination, empty state.
- Add/Edit form matching the reference: name, email, phone (code + number), type,
  address block, an ID toggle (VAT/Tax No vs National ID) writing id_kind/id_value,
  notes.
- When type = company: allow adding/editing employees under that company (a nested
  list on the company's detail view). Employees are customer rows with
  parent_customer_id set.
- Employees (app users) may fully manage customers.

Done when: I can create an individual customer, create a company customer, add two
employees under it, and edit/search all of them.
```

---

## PROMPT 4 — Services & categories

```
Read CLAUDE.md. Build the Services module (admin manages; employees read-only).

- service_categories and services tables per §6. A service has: code, name,
  description, price (service fee), govt_fee (separate field), category, taxable,
  is_active.
- Categories: simple CRUD list.
- Services: list with search/filter by category + add/edit form. Show price and
  govt fee as distinct fields.
- Server-side: employees can GET services (needed for invoicing) but cannot
  create/update/delete.

Done when: admin can create categories and services with separate price + govt fee;
an employee account can see them but not edit them.
```

---

## PROMPT 5 — Invoices (the core)

```
Read CLAUDE.md. Build the Invoices module — this is the heart of the app.

Tables: invoices + invoice_items per §6 (items store snapshot description/price/
govt_fee). Numbering: prefix + counter on the business, incremented atomically in
the same transaction as the insert.

Create-invoice screen (model it on the reference New Invoice screen):
- Transaction type: Cash (paid) vs Credit (pending).
- Customer picker: searchable list of existing customers PLUS a "+ New / Other"
  option to quick-add a customer inline without leaving the screen. If the chosen
  customer is a company, show a second picker for its employees.
- Line items: a service picker (search) with, in addition:
    • a "+ Add new service" option to add an ad-hoc line (set price + govt fee
      right there), AND
    • when adding ad-hoc, a checkbox "save to services for later use" that also
      creates a real service record.
  Each line: qty, unit price, per-line discount, VAT. Amount auto-calculates.
- Coupon: apply a discount coupon to the whole invoice (percent or fixed).
- Totals: subtotal, discount, VAT, grand total. VAT is a simple percentage
  (price + VAT = total). Govt fee is summed into govt_fee_total and stored, but
  only rendered on the printed invoice if show_govt_fee_on_invoice is on.
- Notes, terms, and an "include bank details on invoice" toggle.
- Save creates the invoice with its status.

List view: KPI cards (Total / Pending / Paid / Overdue / Void), search, status
filter, date range, empty state. Invoice detail with status transitions
(draft → sent → paid, void, etc.). Record payments (payments table) for partial/
full payment.

Done when: I can create a cash invoice and a credit invoice, quick-add a customer
and an ad-hoc service mid-invoice, apply a coupon, and the totals + numbering are
correct.
```

---

## PROMPT 6 — Invoice PDF (shared template)

```
Read CLAUDE.md. Add PDF generation for invoices.

- Build ONE HTML/CSS invoice template rendered with Jinja2 + WeasyPrint.
- It pulls all branding (logo, name, address, tax id, bank details, colors) from
  the invoice's business_id — the branding follows the invoice's business, never
  the currently-open module. An IIM invoice must render IIM branding even if opened
  from elsewhere.
- Respect show_govt_fee_on_invoice: only show the govt fee column/line when on.
- Respect show_bank_details on the invoice.
- A "Print / PDF" action on the invoice detail generates and downloads/opens it.

Done when: a Main invoice prints with Main branding and an IIM invoice prints with
IIM branding, and govt fee only appears when the setting is on.
```

---

## PROMPT 7 — Quotations

```
Read CLAUDE.md. Build Quotations by reusing the invoice engine.

- quotations + quotation_items per §6, with validity_days and quotation status
  (draft|sent|accepted|rejected|converted).
- Same create screen as invoices (customer picker, line items with quick-add, VAT,
  coupon, notes/terms) but as a quotation.
- "Convert to Invoice": one click creates an invoice from the quotation, copying
  all line items, and sets the quotation status to converted with a link to the new
  invoice.
- Reuse the PDF template (a "Quotation" heading variant).

Done when: I can create a quotation, print it, and convert it to an invoice in one
click with all lines carried over.
```

---

## PROMPT 8 — Coupons

```
Read CLAUDE.md. Build the Coupons module (admin manages; employees read-only to
apply).

- coupons table per §6: code, discount_type (percent|fixed), value, active,
  valid_from/valid_to.
- Admin CRUD screen for coupons.
- The invoice/quotation coupon picker (already wired in Prompt 5/7) reads active,
  in-date coupons and applies the discount to the total.
- Gate the whole module behind its feature flag.

Done when: admin creates a coupon, and it applies correctly on an invoice; expired/
inactive coupons don't appear.
```

---

## PROMPT 9 — Dashboard

```
Read CLAUDE.md. Build the Dashboard (admin sees financials; employees see a reduced
view or are routed elsewhere).

KPI cards, scoped to the active business:
- Total Sales (period)
- Government Fees Paid to date
- VAT Collected
Plus: Recent Invoices table, Top Customers, and an Attendance summary strip
(present today / absent today — will light up after Prompt 11).
Quick actions: Create Invoice, Add Customer.
No net-profit card (excluded).

Done when: the cards show correct live numbers per business and update as invoices
are created.
```

---

## PROMPT 10 — Notifications

```
Read CLAUDE.md. Build the Notifications module (admin + employees can manage). Gate
behind its feature flag.

- notification_types (admin adds custom types himself), notifications, and
  notification_reminders per §6.
- Create-notification form: select customer, select type (from the custom types,
  with an inline "add new type"), a note, a target date (day / month-number /
  year), and one or more relative reminders ("1 week / 1 day / 1 month before" —
  multiple allowed).
- In-app surfacing only: a badge/count on the Notifications nav item (and on the
  relevant module) for notifications whose reminder window has started or whose
  target date is reached and which are not acknowledged. A notifications panel
  listing them with who / type / date / days-remaining, colour-coded.
- Acknowledge / snooze clears or defers an alert. Renewing (editing target_date)
  clears it naturally.
- The badge query runs when the app opens; no background service.

Done when: I can create a custom type, attach a reminder to a customer, and see the
badge + panel light up when the reminder date arrives, and clear it by
acknowledging.
```

---

## PROMPT 11 — Attendance

```
Read CLAUDE.md. Build the basic Attendance module (admin-only). Gate behind its
feature flag.

- attendance table per §6 (unique per user per date).
- Employees come from the users table.
- A simple grid/day view: mark each employee present / absent / leave for a date.
- Per-employee totals over a period.
- Feed the dashboard strip: how many present today, how many absent today.

Done when: admin can mark attendance for a day, see per-employee totals, and the
dashboard shows today's present/absent counts.
```

---

## PROMPT 12 — Reports

```
Read CLAUDE.md §8. Build the Reports module (admin-only), tabbed like the reference,
scoped to the active business, each with a period filter and CSV + Print/PDF export.

Build exactly these:
1. Sales report (Summary / By Invoice / By Service)
2. Government fees paid (period)
3. VAT collected (period)
4. Outstanding / Aging (unpaid & overdue by customer)
5. Customer statement (one customer: billed / paid / outstanding)
6. Service performance (revenue + count per service)
7. Quotations report (created / accepted / converted / pending)
8. Attendance summary (per employee, period)

Do not build stock, defective-returns, or profit/COGS reports.

Done when: each report returns correct numbers for a chosen period and exports to
CSV and PDF.
```

---

## PROMPT 13 — Audit Log & Design Studio

```
Read CLAUDE.md. Two admin-only features.

AUDIT LOG:
- Ensure every meaningful create/update/delete (and sign-in) writes an audit_log
  row (user, action, entity_type, entity_id, description, source_ip).
- Build the log view: search, entity-type + action filters, date range, expandable
  rows, pagination, CSV export.

DESIGN STUDIO (gate behind its feature flag):
- A config-panel + live-preview screen (per active business), like the reference:
  layout preset, primary/accent colors, font family + size, logo on/off + position,
  content toggles (sender block, tax breakdown, notes, terms, signature, watermark,
  amount in words), table style, and which customer fields show in Bill-To.
- Save writes template_config (JSON) on the business. The live preview and the
  invoice PDF (Prompt 6) BOTH render from this same config, so what he designs is
  what prints. The IIM config is saved on IIM and only ever used for IIM documents.

Done when: I can restyle the Main invoice and see it change in preview and in the
PDF; the IIM template is independent; and the audit log records my actions.
```

---

## PROMPT 14 — Deployment / installer (do this LAST, after the app works)

```
Read CLAUDE.md §3. Package the working app for the client. Do NOT start this until
the app runs end-to-end in the browser.

- Decide the production DB now (SQLite for the simplest single-PC install, or
  Postgres if concurrent multi-PC writes demand it). Only DATABASE_URL changes.
- Package the FastAPI backend with PyInstaller and run it as an auto-starting
  Windows service on the admin PC (auto-restart on crash, logs to file).
- Wrap the frontend in Tauri to produce the .exe / installer.
- Admin install: bundles the backend (+ DB), opens the firewall port, binds to
  0.0.0.0. Employee install: frontend only, asks for the admin PC address on first
  run.
- Add automated database backups (the Backup & Restore settings screen) writing to
  a folder the admin chooses.
- Optional: code-sign the installer to avoid the Windows "unknown publisher"
  warning.

Done when: I can install on an admin PC, install on a second PC, and both use the
same database over the LAN.
```

---

## Notes

- **Feature flags:** as each optional module lands (coupons, notifications,
  attendance, design studio, IIM), make sure it checks its flag — that's what lets
  you sell a leaner build to the next client without deleting code.
- **Commit after every prompt.** One stage = one commit.
- **If you run out of time,** stop at the last fully-working prompt. Because of the
  order, that's still a shippable product (auth → settings → customers → services →
  invoices/PDF is a real, usable v1 on its own).
