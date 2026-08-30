# Taste It System --- Testing and Acceptance

## 1. Testing Goal

The system must be demonstrably functional, secure, and consistent with
the approved business rules.

## 2. Automated Checks

The frontend should maintain:

-   unit tests for important pure business logic;
-   lint checks;
-   production build checks.

Database/server logic should have appropriate tests where practical.

## 3. Authentication Acceptance

-   Owner can log in using email/password.
-   Staff can log in using email/password.
-   Invalid credentials do not expose sensitive details.
-   Inactive users cannot access the protected app.
-   Logout clears the authenticated application state.

## 4. Branch Acceptance

-   Owner sees branch selection when required.
-   Owner can open an active branch.
-   Owner can switch active branches.
-   Owner cannot open an inactive branch.
-   Staff remain fixed to their assigned branch.
-   Staff cannot access another branch by URL or frontend manipulation.
-   Deactivated branches remain historically represented.

## 5. Menu/Recipe Acceptance

-   Menu categories can be managed according to permissions.
-   Menu items can be created/edited.
-   A menu item cannot be activated without an active recipe.
-   Recipe quantities and units are stored correctly.
-   B1T1 quantity behavior deducts the recipe for two units when two
    units are sold.

## 6. Inventory Acceptance

-   Inventory master data can be managed by authorized users.
-   Stock changes are traceable to sales or reconciliation.
-   Compatible units convert correctly.
-   Low-stock status is displayed correctly.
-   Inventory history remains available.

## 7. POS Acceptance

-   POS blocks adding an item when recipe inventory cannot be fulfilled.
-   Cash sales record correctly.
-   GCash sales require/store the reference number.
-   Completed sale never results in partial inventory deduction.
-   A failed inventory deduction does not leave a completed sale.

## 8. Reconciliation Acceptance

-   Reconciliation requires confirmation.
-   Discrepancy is recorded.
-   A predefined reason can be selected.
-   Other/custom reason is supported.
-   Historical reconciliation records remain available.

## 9. Staff Acceptance

-   Owner can invite Staff.
-   Owner can edit Staff information/assignment/status.
-   Owner can deactivate/reactivate Staff.
-   Staff cannot access Staff Management controls.
-   Invitation errors are handled safely.

## 10. Reports/Dashboard Acceptance

-   Data is branch-aware.
-   Date filters use consistent semantics.
-   Report values are derived from system data.
-   Dashboard summaries correspond to underlying records.

## 11. AI Acceptance

-   AI answers only from authorized system data.
-   AI respects branch isolation.
-   AI does not fabricate missing information.
-   AI does not claim actions it did not perform.

## 12. UI Acceptance

-   No gradients.
-   Brand colors are tokenized.
-   Layout is responsive.
-   Forms provide clear validation.
-   Modals are accessible.
-   Status is not communicated by color alone.

## 13. Release Gate

Before a feature is considered complete:

1.  Functional tests pass.
2.  Lint passes.
3.  Build passes.
4.  Authorization behavior is checked.
5.  Relevant database/RLS behavior is checked.
6.  The feature follows the documentation.
7.  No unrelated feature regressions are introduced.
