# Taste It Frontend — Master Agent Instructions

## 1. Purpose

This file is the master instruction file for AI coding agents working on the Taste It frontend.

The frontend is a React/Vite implementation of the academic project:

**Taste It – AI-Assisted Inventory and Sales Management System**

The frontend is being developed as a complete functional prototype using mock data, client-side state, localStorage persistence, routing, reusable components, and responsive UI.

The backend is developed separately. Frontend development and demonstration must not require the backend.

---

## 2. Source-of-Truth Priority

When information conflicts, use this order:

1. Latest explicit user instruction or approved project decision.
2. Approved Taste It project documentation and client-validated requirements.
3. Approved Figma/design references supplied by the project team.
4. This AGENTS.md.
5. Reasonable UX/engineering judgment.

Do not silently turn an idea into a requirement.

If the source documents do not define a behavior, mark it as requiring confirmation rather than inventing a business rule.

---

## 3. Required Technology

Use the existing stack:

- ReactJS
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Reusable React components
- Responsive desktop/tablet/mobile layouts

Do not replace the stack unless explicitly requested.

The current frontend is mock-first. The architecture must allow the mock service layer to later be replaced by backend/API services without rebuilding the UI.

---

## 4. Required Supporting Documents

Read the relevant document before changing the related area:

- `docs/PROJECT_OVERVIEW.md` — project/business context
- `docs/REQUIREMENTS.md` — functional requirements
- `docs/USER_ROLES_AND_PERMISSIONS.md` — access rules
- `docs/BUSINESS_RULES.md` — operational behavior
- `docs/UI_DESIGN_SYSTEM.md` — visual system
- `docs/APPLICATION_ARCHITECTURE.md` — code organization
- `docs/SCREEN_SPECIFICATIONS.md` — screen behavior
- `docs/DATA_AND_MOCK_STATE.md` — frontend data model
- `docs/ROUTES_AND_NAVIGATION.md` — routing/navigation
- `docs/DEVELOPMENT_WORKFLOW.md` — coding/testing workflow
- `CHANGELOG.md` — important implementation decisions and current status

---

## 5. Core Project Scope

The approved system covers:

- Point-of-Sale (POS)
- Menu Management
- Recipe Management
- Automatic Inventory Deduction
- Inventory Management
- Inventory Reconciliation
- Inventory Alerts
- Sales Reports
- Inventory Status Reports
- Inventory Reconciliation Reports
- AI Weekly Business Reports
- Receipt generation/printing after completed transactions
- Owner/Manager and Staff access
- Babag and Marigondon branch operations

The central operational loop is:

```text
POS completed sale
        ↓
Recipe lookup
        ↓
Ingredient deduction
        ↓
Branch inventory update
        ↓
Stock status recalculation
        ↓
Inventory alert if required
        ↓
Sales / inventory / report data updated
        ↓
Reconciliation and audit history when needed
```

---

## 6. Hard Scope Restrictions

Do not add the following unless the project team explicitly changes the approved scope:

- Supplier management
- Online ordering
- Food delivery integration
- Payment gateway/payment processing
- Financial accounting
- Payroll
- Third-party integrations
- Direct Facebook order integration
- Branch-to-branch inventory transfer
- Centralized inventory pool
- AI demand forecasting
- AI purchase recommendations
- AI recipe recommendations
- AI recipe generation

The system records completed transactions and generates receipts; it does not process payments.

---

## 7. Roles

There are two application roles:

### Owner / Manager

Owner/Manager can:

- Authenticate
- Select/open a branch
- Add/edit/deactivate branches as approved
- Switch selected branch
- View Owner Dashboard
- Use POS for the selected branch
- Manage menu items
- Manage menu categories
- Manage recipes
- View/manage inventory
- Reconcile inventory
- View inventory history/audit information
- Manage staff accounts
- View sales
- Generate Sales, Inventory, and Reconciliation reports
- View AI Weekly Business Reports
- Receive operational notifications

The Owner works with one selected branch at a time.

Do not create an "All Branches" operating mode unless explicitly approved.

### Staff

The UI role label should be **Staff**.

Staff are branch-restricted and can:

- Authenticate using branch-assigned credentials
- Access their assigned branch
- Use POS
- View inventory
- Perform authorized inventory reconciliation
- View their own sales history
- View relevant alerts/notifications
- Use the Staff Dashboard

Staff must not have Owner-only functions such as:

- Branch Management
- Staff Management
- Owner reports
- AI Weekly Business Reports

---

## 8. Branches

Known branches:

- Babag
- Marigondon

Each branch maintains its own operational sales and inventory records.

Owner flow:

```text
Login
 ↓
Branch Selection
 ↓
Owner Dashboard
```

After a branch is selected, the selected branch remains visible in the application topbar.

The Owner may switch branches without returning to the initial branch-selection screen.

Staff cannot freely switch branches.

Do not implement branch-to-branch inventory transfer.

Do not hard-code a single branch.

---

## 9. Design System

Canonical visual guidance is defined in [`docs/UI_DESIGN_SYSTEM.md`](docs/UI_DESIGN_SYSTEM.md). Use its Poppins typography, token values, shell geometry, radii, and responsive rules.

Core reference tokens:

- App background: `#FAF6F6`
- Headings: `#051945`
- Icon strokes: `#062B56`
- Primary pink: `#FF77D1`
- Accent pink: `#FF86DB`
- Pressed pink: `#B82888`
- Secondary teal: `#7CE1DB`
- Surface: `#FFFFFF`

Use semantic success, warning, and danger tokens only for status meaning, with readable labels or icons in addition to color.

Visual direction:

- Clean
- Modern
- Light
- Professional
- Friendly
- Café-oriented
- Data-focused
- Clear visual hierarchy
- Reference card geometry and surface treatments from `docs/UI_DESIGN_SYSTEM.md`
- Soft borders/shadows with readable contrast
- Accessible contrast

Do not introduce dark mode unless explicitly requested.

Use Lucide React for icons.

When approved Figma/screenshots are supplied, study them first and use them as the visual reference. Preserve established patterns across modules.

---

## 10. Responsive Requirements

Every screen must support:

- Desktop
- Tablet
- Mobile

Do not build desktop-only pages.

The sidebar must adapt responsively.

Tables must remain usable on small screens.

POS must remain usable on tablet/mobile.

---

## 11. Frontend Independence

The frontend must work without the backend.

Do not require:

```text
http://localhost:5000
```

for frontend development or demonstration.

Use mock authentication and mock services.

The real API layer may later replace mock services.

Do not scatter direct Axios calls throughout visual components.

---

## 12. Persistence

Meaningful mock state should survive refresh using localStorage.

Important prototype behavior:

```text
POS sale
 ↓
sale saved
 ↓
recipe read
 ↓
ingredients deducted
 ↓
inventory updated
 ↓
stock status recalculated
 ↓
notifications updated
 ↓
dashboard/reports reflect change
```

The prototype should behave like a working application, not a collection of static screenshots.

---

## 13. Architecture

Use feature-based architecture.

Recommended structure:

```text
src/
├── assets/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   ├── modals/
│   └── feedback/
├── layouts/
│   ├── AuthLayout.jsx
│   └── AppLayout.jsx
├── features/
│   ├── auth/
│   ├── branches/
│   ├── dashboard/
│   ├── menu/
│   ├── recipes/
│   ├── inventory/
│   ├── reconciliation/
│   ├── pos/
│   ├── sales/
│   ├── staff/
│   ├── reports/
│   ├── ai-reports/
│   └── notifications/
├── pages/
├── services/
│   ├── mock/
│   └── api/
├── hooks/
├── context/
├── data/
├── utils/
├── routes/
├── App.jsx
├── main.jsx
└── index.css
```

Keep business logic separate from visual components where practical.

---

## 14. Existing Code

The repository contains an older working frontend prototype and backend/API-related code.

Do not assume everything must be deleted.

Before changing an existing file:

1. Read it.
2. Understand its responsibility.
3. Preserve useful behavior.
4. Refactor gradually.
5. Remove obsolete code only when its replacement is working.

Do not delete existing functionality without confirmation when it may still be useful.

---

## 15. Quality Gate

After every meaningful implementation:

```bash
npm run lint
npm run build
```

Do not consider a task complete while there are:

- unresolved imports
- broken routes
- unused imports
- avoidable console errors
- dead navigation links
- inaccessible controls
- duplicated shared UI
- non-functional buttons presented as completed features

---

## 16. Agent Behavior

Do not write the entire application at once unless explicitly requested.

Work in small, verifiable phases.

For each phase:

1. State what will change.
2. Inspect relevant existing files.
3. Implement the smallest coherent change.
4. Run lint/build.
5. Fix errors.
6. Only then proceed.

When requirements are ambiguous, prefer the approved documentation and ask only when the ambiguity materially affects architecture or business behavior.

---

## 17. Current Frontend Foundation

As of the current development phase:

- React/Vite frontend is initialized.
- Tailwind is configured.
- React Router is present.
- Lucide React is installed.
- Feature-based directories have been established.
- Shared AppLayout has been established.
- Shared Sidebar and Topbar have been established.
- A temporary `src/components/Sidebar.jsx` compatibility bridge exists for older pages.
- `npm run lint` passes.
- `npm run build` passes.

Next architectural phase:

**Authentication + Branch Context + Role-Aware Navigation**

Do not redesign all business screens before the authentication/branch architecture is established.
