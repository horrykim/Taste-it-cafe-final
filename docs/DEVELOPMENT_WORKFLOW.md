# Taste It — Development Workflow

## 1. Before Coding

The agent must:

1. Read `AGENTS.md`.
2. Read the relevant documentation.
3. Inspect the existing files.
4. Understand current responsibilities.
5. Identify dependencies.
6. Avoid unnecessary rewrites.

---

## 2. Implementation Principle

Work incrementally.

Preferred sequence:

```text
Architecture
 ↓
Authentication
 ↓
Branch Context
 ↓
Role-aware navigation
 ↓
Shared UI primitives
 ↓
Dashboard
 ↓
Menu/Recipe
 ↓
Inventory
 ↓
POS
 ↓
Automatic Deduction
 ↓
Reconciliation
 ↓
Sales
 ↓
Staff
 ↓
Reports
 ↓
AI Weekly Reports
 ↓
Polish / responsive QA
```

Do not jump randomly between modules.

---

## 3. Existing Code

The repository already contains older frontend screens and backend/API-related code.

Do not assume the old frontend must be kept visually.

The project allows frontend assets/design/files to be changed or replaced when needed.

However:

- Preserve useful backend integration points.
- Preserve useful business behavior.
- Migrate rather than break unrelated functionality.
- Remove old code only after replacement is working.

---

## 4. Coding Standards

Prefer:

- Small components
- Reusable components
- Clear props
- Feature-based organization
- Centralized business calculations
- Tailwind utility classes
- Lucide icons
- Accessible controls
- Responsive layouts

Avoid:

- Giant components
- Duplicate sidebars
- Duplicate table implementations
- Random localStorage keys
- Business logic embedded throughout JSX
- Hard-coded branch names in feature logic
- Hard-coded inventory thresholds
- Static dashboard values that contradict mock data

---

## 5. Mock-First Development

When backend endpoints are unavailable:

```text
UI
 ↓
Mock Service
 ↓
Mock Data / localStorage
```

When backend becomes available:

```text
UI
 ↓
Service Interface
 ↓
API Service
 ↓
Backend
```

The UI should not need a structural rewrite.

---

## 6. Testing Gate

After each meaningful change:

```bash
npm run lint
npm run build
```

Both must pass before moving to the next phase.

---

## 7. Manual QA

For each completed screen, verify:

### Authentication

- Valid Owner
- Valid Staff
- Invalid credentials
- Inactive Staff
- Logout

### Branch

- Owner selects Babag
- Owner selects Marigondon
- Owner switches branches
- Staff remains assigned to one branch

### Permissions

- Staff cannot access Owner-only screens
- Owner can access Owner modules

### Data

- Mock changes persist after refresh
- Branch changes affect branch-specific data

### Responsive

- Desktop
- Tablet
- Mobile

### Visual system QA

- Confirm Poppins is used with approved weights `400`, `500`, `600`, `700`, and `800`.
- Confirm current UI tokens match [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md); legacy purple guidance must not be introduced as a current token.
- Check the reference shell proportions: `240px` desktop sidebar, approximately `70px` header, and responsive `56px/24px` outer gutters.
- Check card, control, pill, icon-well, and secondary-surface radii against the canonical geometry.
- Verify success, warning, and danger states have sufficient contrast and include text or icon cues beyond color.
- Test desktop, tablet, and mobile layouts at normal browser zoom and representative zoom levels such as `80%`, `100%`, and `120%`.
- Confirm grids reflow without overlapping cards, clipped text, or page-level horizontal overflow.

---

## 8. UI Completion Checklist

A screen should not be considered complete if it only has the happy path.

Check:

- Loading state
- Empty state
- Error state
- Success feedback
- Disabled state
- Permission behavior
- Branch behavior
- Responsive layout
- Keyboard/focus behavior where relevant

---

## 9. Git Workflow

Use feature branches where practical.

Examples:

```text
frontend-foundation
frontend-auth
frontend-branch-context
frontend-dashboard
frontend-menu
frontend-inventory
frontend-pos
frontend-reconciliation
frontend-reports
```

Commit coherent changes.

Avoid giant commits that combine unrelated modules.

---

## 10. Agent Communication

Before a large implementation, state:

- What files will change
- Why they are changing
- What behavior will be introduced
- What will not be changed

After implementation, report:

- What changed
- Tests run
- Build/lint result
- Any known limitations

---

## 11. Do Not Invent Requirements

If the project documents:

- required feature → implement it
- excluded feature → do not implement it
- unresolved behavior → mark it as requiring confirmation

Do not infer a new business process simply because another POS system commonly has it.
