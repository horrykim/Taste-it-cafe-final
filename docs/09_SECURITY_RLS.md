# Taste It System --- Security and RLS

## 1. Security Principle

Security must be enforced at the data/server layer, not only through UI
visibility.

## 2. Authentication

Supabase Auth is the source of authentication identity.

The frontend uses publishable Supabase credentials only.

No service-role key belongs in React.

## 3. Authorization

Authorization is based on:

-   authenticated user;
-   profile role;
-   active status;
-   branch assignment;
-   requested resource.

## 4. Branch Isolation

Staff must be unable to access another branch's operational data even if
they manipulate:

-   URLs;
-   browser state;
-   request parameters;
-   frontend state.

Owners may access branch data according to Owner permissions.

## 5. RLS

RLS should protect branch-specific tables and user-specific records.

Policies should be explicit and testable.

Avoid policies that accidentally expose all rows to all authenticated
users.

## 6. Privileged Functions

Edge Functions using service-role privileges must:

1.  authenticate the caller;
2.  validate the caller's profile;
3.  validate role and active status;
4.  validate branch relationships where applicable;
5.  validate request input;
6.  perform the privileged operation;
7.  return safe errors.

## 7. Staff Invitations

Staff invitation/account creation must not expose permanent passwords
through the browser.

Credential administration belongs to Supabase Auth and appropriately
secured server-side functionality.

## 8. Input Validation

Validate on both appropriate client and server/database boundaries.

Client validation improves usability.

Server/database validation provides security and correctness.

## 9. Sensitive Errors

Do not expose:

-   service-role credentials;
-   internal stack traces;
-   database credentials;
-   infrastructure details.

User-facing errors should be safe and understandable.

## 10. Auditability

Important administrative actions should retain appropriate
actor/time/context information.

Soft deactivation should be preferred where historical records must
remain.

## 11. Security Testing

Before release, verify at minimum:

-   Staff cannot switch branches.
-   Staff cannot read another branch.
-   Staff cannot perform Owner-only operations.
-   Inactive accounts cannot access protected content.
-   Unauthenticated users cannot access protected data.
-   Privileged functions reject unauthorized callers.
