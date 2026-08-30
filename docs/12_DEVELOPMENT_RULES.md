# Taste It System --- Development Rules

## 1. Source of Truth

The `docs/` directory defines the intended system.

Do not introduce behavior that contradicts these documents without
updating the appropriate documentation first.

## 2. Architecture

Use:

-   React frontend;
-   Supabase Auth;
-   Supabase PostgreSQL;
-   Supabase Edge Functions where privileged server logic is required.

Do not introduce a second backend architecture casually.

## 3. No Legacy Blind Reuse

Legacy code is reference material.

Before reusing a legacy implementation, verify:

-   architecture compatibility;
-   business-rule compatibility;
-   security compatibility;
-   data-model compatibility.

## 4. Small, Controlled Changes

Work on one coherent area at a time.

Avoid broad refactors while implementing an unrelated feature.

Do not modify unrelated files simply to make a feature work.

## 5. Business Logic

Business-critical rules should have a centralized implementation rather
than being duplicated across components.

Examples:

-   branch access;
-   inventory deduction;
-   recipe fulfillment;
-   unit conversion;
-   role permissions.

## 6. Database Operations

Prefer service-layer/database functions over scattered direct queries.

Transactions must be used where atomicity is required.

## 7. UI

Do not introduce gradients.

Do not hard-code final brand colors throughout components.

Use centralized design tokens.

Do not create unnecessary visual complexity.

## 8. Errors

User-facing messages should be clear and safe.

Do not expose technical secrets or internal stack traces.

## 9. Testing

After meaningful changes, run:

-   tests;
-   lint;
-   build.

Business-critical pure logic should have automated tests.

## 10. Git Workflow

Each coherent completed change should be reviewed before commit.

After a feature/change is verified:

1.  inspect `git status`;
2.  inspect the diff;
3.  confirm no unintended files changed;
4.  commit with a clear message;
5.  push to the designated repository.

Do not mix unrelated work into the same commit.

## 11. Documentation

Do not create a new Markdown file for every feature or every Codex
instruction.

Update the appropriate source-of-truth document when requirements,
business rules, architecture, security, or module behavior changes.

## 12. Codex / AI Coding Agents

Coding agents should:

-   read the relevant `docs/` files before modifying code;
-   implement only the requested scope;
-   preserve existing working behavior;
-   avoid speculative features;
-   report changed files;
-   report tests/lint/build results;
-   identify unresolved concerns.

The agent should not redefine business requirements on its own.

## 13. Two-Month Scope Discipline

Prefer a complete, reliable baseline over a large collection of
partially implemented features.

When a feature has optional complexity, implement the smallest version
that satisfies the approved requirement unless the documentation
explicitly requires more.

## 14. Legacy Cleanup

Cleanup should proceed in controlled stages:

1.  documentation;
2.  architecture/configuration;
3.  frontend structure;
4.  legacy backend removal;
5.  assets/archive cleanup;
6.  verification.

Do not delete legacy code merely because it looks old. Confirm
dependencies first.

## 15. Final Principle

**The application should conform to the defined Taste It System---not
the other way around.**
