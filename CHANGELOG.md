# Taste It — Development Changelog

## 2026-08-24 — Canonical Taste It Design Reference

### Decision

- Adopted the supplied Poppins-based design reference as the canonical visual system.
- Documented the approved pink, teal, semantic status, neutral, typography, shell geometry, spacing, radius, and responsive tokens in `docs/UI_DESIGN_SYSTEM.md`.
- Treated `1180 × 820px` as a reference canvas rather than a runtime minimum and preserved `#3F02EF` exactly as the supplied deep-danger token.

### Follow-up

- Several generated Figma SVG exports still contain legacy colors or minor canvas-size differences. Re-export them from the approved design source in a separate asset task; do not hand-edit generated SVGs.

## 2026-08-19 — Step 9 Menu / Recipe / Ingredient Foundation Upgrade

### Completed

- Added persistent branch-scoped menu items with optional images, descriptions, recipes, and recipe identifiers.
- Updated Menu Management to use service-level mutation APIs and branch-safe recipe validation.
- Added consistent image and missing-image card/detail rendering, plus optional local image selection and removal in the Owner editor.

### Scope

This prepares the Menu → Recipe → Inventory relationship only; no POS or inventory deduction was added.

## 2026-08-19 — Step 8 Inventory Reconciliation

### Completed

- Replaced the branch-aware reconciliation placeholder with a responsive counting workflow.
- Added deterministic, branch-keyed reconciliation records with localStorage persistence.
- Added draft saving, required physical counts and discrepancy reasons, review confirmation, history details, and audit-friendly metadata.
- Added explicit Owner-only inventory adjustment after a completed reconciliation; Staff can count and submit but cannot apply adjustments.
- Persisted inventory mock mutations so verified reconciliation adjustments survive refresh and retain centralized stock-status calculation.

### Scope

No POS, sales, reports, AI, staff management, or branch management work was added.

## 2026-08-19 — Step 7C Inventory Integration Review

### Completed

- Verified branch-aware inventory loading, centralized status calculations, role guards, and navigation integration.
- Hardened cost and stock-removal validation and prevented stale branch inventory from rendering during branch switches.

### Scope

Inventory Reconciliation and POS inventory deduction remain deferred.

## 2026-08-19 — Step 7B Inventory Management UI

### Completed

- Replaced the canonical inventory placeholder with a branch-aware inventory management screen.
- Added responsive inventory table/cards, search and filters, details with recipe usage, and stock summaries.
- Added Owner-only item, threshold, and deactivation controls alongside permitted Owner/Staff stock adjustments.

### Scope

Inventory Reconciliation and POS inventory deduction remain deferred.

## 2026-08-19 — Step 7A Inventory Foundation and Stock Logic

### Completed

- Added branch-scoped inventory mock data, centralized derived stock statuses, and controlled stock mutation APIs.
- Added owner-guarded threshold and recipe-composition service methods, plus a menu ingredient compatibility adapter.

### Scope

Inventory UI, POS deduction, and Inventory Reconciliation remain deferred.

## 2026-08-19 — Sidebar and Navigation Correction

### Completed

- Updated Owner and Staff navigation order and route access for POS.
- Made Inventory an accessible expandable navigation group with Inventory and Inventory Reconciliation children.
- Kept AI Business Reports as a standalone Owner-only navigation module.

### Scope

Inventory and Inventory Reconciliation implementation remain deferred.

## 2026-08-19 — Menu Recipe and Ingredient Association

### Completed

- Added branch-scoped mock ingredient data with configurable stock thresholds.
- Added Owner recipe editing and recipe stock indicators in menu details.
- Kept recipe details visible to Staff while recipe editing remains Owner-only.

### Scope

This correction does not implement Inventory Management, stock deduction, reconciliation, or inventory transactions.

## 2026-08-19 — Application Shell and Navigation Foundation

### Completed

- Added mock authentication with persisted frontend sessions.
- Added AuthContext and BranchContext.
- Added Owner branch selection and shell-level branch switching.
- Added Staff branch restriction.
- Established canonical `/login`, `/branches`, and `/app/*` routes.
- Added route-level role protection and role-aware navigation.
- Added responsive sidebar drawer, topbar, and placeholder route content.

### Decision

Detailed business screens remain deferred. Canonical routes render neutral placeholders until their approved feature phases replace them.

### Impact

Legacy Dashboard and Menu page files remain available for incremental migration, while navigation now uses the canonical application shell.

---

## 2026-08-19 — Frontend Foundation

### Completed

- Confirmed React + Vite frontend.
- Confirmed Tailwind CSS.
- Confirmed React Router.
- Confirmed Lucide React.
- Established feature-based directory structure.
- Created shared `AppLayout`.
- Created shared `Sidebar`.
- Created shared `Topbar`.
- Created temporary Sidebar compatibility bridge.
- Established route foundation.
- Established responsive shell.
- Established Taste It brand tokens in global CSS.
- `npm run lint` passes.
- `npm run build` passes.

### Current Status

Phase 1 — Frontend Foundation:

**COMPLETE**

---

## Next Planned Phase

Phase 2 — Authentication + Branch Context

Planned:

- Mock authentication service
- AuthContext
- Login flow
- Owner/Staff roles
- Active-account validation
- BranchContext
- Owner branch selection
- Owner branch switching
- Staff branch restriction
- Role-aware navigation
- Protected routes

---

## Important Architectural Decisions

### Frontend Independence

Frontend development must not require the backend.

Use mock services and localStorage while backend development continues.

### Feature-Based Architecture

The frontend uses feature-based organization.

### Shared Application Shell

Sidebar and Topbar belong to the application shell, not individual pages.

### Branch Context

Branch-dependent pages must use the active branch context rather than hard-coded branch names.

### Role-Aware UI

Navigation and routes must respect Owner/Manager vs Staff permissions.

### Mock Data

Mock state should behave like real application data and persist meaningful changes.

---

## Future Changelog Format

For each important decision:

```markdown
## YYYY-MM-DD — Decision Title

### Decision

What was decided.

### Reason

Why it was decided.

### Impact

Which parts of the project are affected.

### Migration

What old behavior was replaced, if any.
```
