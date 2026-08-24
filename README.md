# Taste It Agent Context Pack

This folder contains the project-context Markdown files prepared for AI coding agents.

## Files

- `AGENTS.md` — master instructions and source-of-truth priority
- `CHANGELOG.md` — implementation status and decisions
- `docs/PROJECT_OVERVIEW.md` — business/project context
- `docs/REQUIREMENTS.md` — functional requirements
- `docs/USER_ROLES_AND_PERMISSIONS.md` — role and access matrix
- `docs/BUSINESS_RULES.md` — operational rules
- `docs/UI_DESIGN_SYSTEM.md` — visual consistency rules
- `docs/APPLICATION_ARCHITECTURE.md` — React architecture
- `docs/SCREEN_SPECIFICATIONS.md` — screen behavior
- `docs/DATA_AND_MOCK_STATE.md` — mock data/state
- `docs/ROUTES_AND_NAVIGATION.md` — routes and navigation
- `docs/DEVELOPMENT_WORKFLOW.md` — implementation and QA workflow

## Recommended placement

Copy `AGENTS.md` and `CHANGELOG.md` to the project root.

Copy the `docs/` directory to the project root.

The resulting structure should be:

```text
project-root/
├── AGENTS.md
├── CHANGELOG.md
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── REQUIREMENTS.md
│   ├── USER_ROLES_AND_PERMISSIONS.md
│   ├── BUSINESS_RULES.md
│   ├── UI_DESIGN_SYSTEM.md
│   ├── APPLICATION_ARCHITECTURE.md
│   ├── SCREEN_SPECIFICATIONS.md
│   ├── DATA_AND_MOCK_STATE.md
│   ├── ROUTES_AND_NAVIGATION.md
│   └── DEVELOPMENT_WORKFLOW.md
└── frontend/
```

These documents are intentionally separated by purpose so an AI coding agent can read only the relevant context when working on a feature.
