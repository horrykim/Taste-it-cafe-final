# Taste It — Development Changelog

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
