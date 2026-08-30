# Taste It System --- Requirements and Scope

## 1. In Scope

The target system includes:

-   Authentication
-   Owner and Staff role management
-   Branch selection and branch management
-   Dashboard
-   Menu management
-   Menu categories
-   Menu items
-   Recipe attachment to menu items
-   Inventory management
-   Inventory reconciliation
-   Inventory history
-   POS
-   Sales
-   Staff management
-   Reports
-   Notifications
-   Settings
-   Date selection/filtering
-   Low-stock alerts
-   AI assistant grounded only in system data

## 2. Authentication Requirements

-   Login uses email and password only.
-   Supabase Auth is the authentication authority.
-   Active users can access protected application content.
-   Inactive accounts cannot use the application.
-   Owners create Staff accounts.
-   Staff receive an account invitation/setup flow.
-   Permanent passwords must never be exposed by the React application.

## 3. Branch Requirements

Branch records contain, at minimum:

-   Name
-   Code/ID
-   Address
-   Contact number
-   Optional email
-   Active status
-   Creation timestamp
-   Update timestamp

Owners can:

-   View branches.
-   Add branches.
-   Edit branches.
-   Deactivate branches.
-   Reactivate branches where supported.
-   Select an active branch as the working context.

Staff:

-   Belong to one branch.
-   Cannot switch branch context.

## 4. Menu Requirements

Menu management includes categories and menu items.

Each menu item may have one active recipe.

A menu item cannot be activated until an active recipe exists.

B1T1 is treated as a permanent selling configuration rather than a
temporary promotion. A B1T1 sale of two units deducts the recipe
requirements for two units.

## 5. Inventory Requirements

Owners manage inventory master data.

Stock changes through:

1.  Completed sale deductions.
2.  Inventory reconciliation.

The ordinary inventory master screen must not provide arbitrary stock
editing.

The system supports compatible unit conversion.

Low-stock information is required. A target-stock-level feature is not
part of the current scope.

## 6. POS Requirements

Supported payment methods:

-   Cash
-   GCash

For GCash, staff enter the GCash reference number.

A POS item cannot be added when its recipe cannot be fulfilled by
available branch inventory.

A completed sale must never partially deduct inventory.

Sale completion and required inventory deductions must behave as one
logical operation.

## 7. Sales Requirements

Completed sales are retained as historical records.

For the initial version:

-   Completed sales are not cancelled.
-   Refund processing is not included.

## 8. Reconciliation Requirements

Inventory reconciliation requires:

-   A confirmation step.
-   Recorded discrepancy.
-   A predefined reason.
-   An Other/custom reason option.
-   Historical reconciliation records.

## 9. Dashboard Requirements

The dashboard is branch-aware and should provide useful operational
information, including sales overview and quick actions.

## 10. Reports Requirements

Reports are generated from system data and should support useful
operational views such as sales, inventory, reconciliation, and other
approved management information.

## 11. Notifications

Notifications are branch-aware where appropriate.

Notifications may be marked read while historical notification records
are retained.

## 12. AI Assistant

The system may include an AI assistant.

Its answers must be grounded in Taste It System data only. It must not
invent system facts or present unrelated external information as Taste
It operational data.

## 13. Out of Scope Unless Explicitly Added

The following are not currently part of the approved baseline:

-   Payment gateway processing
-   Automated GCash payment verification
-   Completed-sale cancellation/refund workflow
-   Centralized cross-branch inventory
-   Branch-to-branch inventory transfer
-   Target stock level management
-   Multiple active recipes per menu item
