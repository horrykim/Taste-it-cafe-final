# Taste It Cafe Management System

Taste It Cafe Management System is a React frontend project for cafe operations across branches.

The current backend and database platform is Supabase. Supabase Auth, Supabase PostgreSQL, and Supabase Edge Functions are the intended backend architecture where required by the project documentation.

## Source of Truth

The `docs/` directory is the project source of truth. Use those files for requirements, architecture, security, data-model expectations, and development rules.

## Frontend

The frontend lives in `frontend/` and uses React with Vite.

Environment configuration belongs in `frontend/.env.local`. Do not commit secrets or service-role credentials.

## Common Commands

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```
