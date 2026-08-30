# Taste It System --- System Architecture

## 1. Target Architecture

``` text
React Frontend
      |
      v
Supabase
  |       |       |
 Auth  PostgreSQL  Edge Functions
```

## 2. Frontend

React is responsible for:

-   rendering UI;
-   navigation;
-   form interaction;
-   client-side validation;
-   session-aware state;
-   branch context;
-   calling approved Supabase services.

Business-critical authorization and transactional invariants must not
rely solely on React.

## 3. Supabase Auth

Supabase Auth handles:

-   email/password authentication;
-   sessions;
-   account identity.

Application authorization uses the authenticated identity plus the
application's profile/role/branch information.

## 4. PostgreSQL

PostgreSQL stores the system's operational data.

RLS protects branch and role access.

Database functions/RPCs may be used for operations requiring atomic
transactions.

## 5. Edge Functions

Edge Functions are appropriate for privileged operations that cannot
safely run in the browser.

Examples may include:

-   staff invitation/account administration;
-   tightly controlled privileged operations.

Service-role credentials must never be placed in frontend code.

## 6. Services

React feature components should not contain scattered direct database
queries for every operation.

Prefer a service layer for feature data access.

## 7. Providers

Global concerns may be centralized through providers/hooks, including:

-   authentication;
-   environment configuration;
-   branch context;
-   other truly global application state.

Feature-specific state should remain local unless it is genuinely
shared.

## 8. Routing

Authentication and branch context determine access to the normal
application shell.

Owner branch selection occurs before the normal shell.

Staff enter the normal shell within their assigned branch context.

## 9. Legacy Architecture

The old Express server and direct `pg` connection are legacy
architecture.

They must not be reintroduced unless the project documentation is
deliberately changed to approve a different architecture.

## 10. Error Handling

User-facing errors should be:

-   understandable;
-   safe;
-   non-sensitive.

Detailed technical failures should be available through appropriate
development/server logs without exposing secrets or internal
infrastructure details to users.
