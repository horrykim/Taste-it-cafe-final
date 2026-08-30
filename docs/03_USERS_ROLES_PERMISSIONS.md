# Taste It System --- Users, Roles, and Permissions

## 1. Roles

There are exactly two application roles:

-   Owner
-   Staff

All Owners have equal authority.

## 2. Owner

Owners may:

-   Select and switch active branch context.
-   Manage branches.
-   Manage staff.
-   Manage menu categories.
-   Create and edit menu items.
-   Manage recipes.
-   Manage inventory master data.
-   Perform inventory reconciliation.
-   View sales.
-   Use POS where permitted by the final operational workflow.
-   View dashboards.
-   View reports.
-   Manage notifications/settings available to the Owner role.
-   Use the system-grounded AI assistant.

## 3. Staff

Staff may:

-   Access the system only when their account is active.
-   Operate within their assigned branch.
-   Use approved operational workflows such as POS.
-   View information necessary for their assigned operational duties.
-   Perform inventory reconciliation if the final approved workflow
    permits it.
-   Use approved reports/dashboard information where permitted.

Staff may not:

-   Switch branch context.
-   Manage branches.
-   Create or manage Owner accounts.
-   Perform Owner-only staff administration.
-   Access another branch by changing frontend state or URL.

## 4. Enforcement

Permissions must be enforced in more than the visual interface.

The application must use:

-   Supabase authentication.
-   Database RLS where applicable.
-   Server-side authorization for privileged Edge Function operations.

Hiding a button is not considered sufficient authorization.

## 5. Account Status

Users can be deactivated.

An inactive account must not access protected application content.

Historical records associated with a deactivated user remain available
where required for audit/history.
