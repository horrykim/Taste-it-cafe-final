# Taste It — Frontend Application Architecture

## 1. Architecture Goal

Build a maintainable React frontend that:

- Works without the backend.
- Uses mock services during prototype development.
- Keeps business logic separate from visual components where practical.
- Can later connect to the backend without rewriting the UI.
- Supports role-aware routing.
- Supports branch-aware state.
- Uses reusable UI patterns.

---

## 2. Directory Structure

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

---

## 3. Components

### `components/ui/`

Generic reusable primitives.

Examples:

- Button
- Card
- Badge
- Input
- Select
- Tabs
- Dropdown
- Modal trigger

These should not know about Taste It-specific business rules.

### `components/layout/`

Shared application shell:

- Sidebar
- Topbar
- PageContainer
- Breadcrumbs where useful

### `components/forms/`

Reusable business-form patterns.

### `components/tables/`

Reusable table structures.

### `components/modals/`

Reusable modal wrappers and common confirmation dialogs.

### `components/feedback/`

Toast, alerts, loading, empty, error states.

---

## 4. Layouts

### `AuthLayout`

Used for:

- Login
- Authentication-related screens

### `AppLayout`

Used for authenticated application screens.

Structure:

```text
AppLayout
 ├── Sidebar
 ├── Topbar
 └── Outlet
```

Do not put business feature logic inside AppLayout.

---

## 5. Features

Feature folders contain feature-specific components and logic.

Example:

```text
features/inventory/
├── components/
├── hooks/
├── inventoryService.js
├── inventoryUtils.js
└── index.js
```

Do not create giant page components that contain every inventory behavior.

---

## 6. Pages

`pages/` should be route-level composition.

A page should coordinate feature components rather than contain every reusable implementation itself.

---

## 7. Context

Global contexts may include:

- AuthContext
- BranchContext
- NotificationContext if necessary

Do not put every piece of state into global context.

Feature-specific state should remain local or feature-scoped.

---

## 8. Authentication Architecture

Target:

```text
Login
 ↓
Auth Service
 ↓
AuthContext
 ↓
Protected Route
 ↓
Role-aware Route
 ↓
AppLayout
```

AuthContext should provide concepts such as:

- currentUser
- role
- isAuthenticated
- login
- logout

Do not make components inspect raw localStorage everywhere.

---

## 9. Branch Architecture

Target:

```text
BranchContext
 ├── branches
 ├── currentBranch
 ├── selectBranch()
 └── switchBranch()
```

Owner can change `currentBranch`.

Staff receives the assigned branch and cannot change it.

Feature services should receive/read the active branch rather than hard-code `"Babag"`.

---

## 10. Services

### `services/mock/`

Contains frontend-only behavior.

Examples:

- mockAuthService
- mockMenuService
- mockInventoryService
- mockSalesService
- mockReconciliationService
- mockReportService

### `services/api/`

Contains future backend integration.

The UI should not need a rewrite when mock services are replaced.

---

## 11. State

Use React state/context/hooks unless a later project decision requires another state library.

Use localStorage for meaningful prototype persistence.

Avoid duplicating the same data in multiple unrelated state stores.

---

## 12. Data Flow

Recommended:

```text
Page
 ↓
Feature component
 ↓
Hook / feature logic
 ↓
Service
 ↓
Mock state or API
 ↓
State update
 ↓
UI refresh
```

Do not do:

```text
Button
 ↓
random localStorage writes
 ↓
duplicate calculations
 ↓
page-specific fake data
```

---

## 13. Business Logic

Complex logic belongs in services/utilities/hooks.

Examples:

- Recipe deduction
- Stock status calculation
- Reconciliation variance
- Report aggregation
- Permission checks

Do not bury these calculations inside large JSX render blocks.

---

## 14. Routing

Centralize route definitions in `routes/`.

Use route protection for:

- Authentication
- Owner-only pages
- Staff restrictions

Hiding a navigation item is not enough.

---

## 15. Reuse Rule

If a UI pattern appears repeatedly, consider extracting it.

Strong candidates:

- Page header
- Search bar
- Filter row
- Data table
- Status badge
- Empty state
- Confirmation modal
- Toast
- Branch selector
- Summary card

---

## 16. Existing Frontend Migration

The repository contains older pages and components.

Migration should be incremental.

Current temporary compatibility bridge:

```text
src/components/Sidebar.jsx
```

may re-export:

```text
src/components/layout/Sidebar.jsx
```

Once old pages are migrated to AppLayout, remove the compatibility bridge if no longer needed.
