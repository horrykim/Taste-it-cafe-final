# Taste It System --- Business Rules

## 1. Branch Rules

1.  Branches are independently managed entities.
2.  A branch can be active or inactive.
3.  Deactivation is soft deactivation; records are not hard-deleted
    merely because a branch becomes inactive.
4.  Owners may work within one selected active branch at a time.
5.  Staff are permanently associated with one branch for application
    context.
6.  Staff cannot switch branches.

## 2. Menu Rules

1.  Menu items have categories.
2.  A menu item may have one active recipe.
3.  A menu item cannot be activated without an active recipe.
4.  Recipe history is not a first-priority requirement.
5.  B1T1 is a permanent selling configuration, not a promotional
    discount.
6.  If a B1T1 transaction sells two units, recipe deduction is
    calculated for two units.

## 3. Recipe Rules

1.  A recipe defines the ingredients/stock requirements for one menu
    item unit.
2.  Recipe ingredients reference inventory items.
3.  Recipe quantities use units that can be converted through the
    system's unit-conversion rules.
4.  Recipe fulfillment must be checked before a sale is completed.

## 4. Inventory Rules

1.  Inventory is branch-specific.
2.  Owners maintain inventory master data.
3.  Normal stock changes occur through completed sales or
    reconciliation.
4.  Arbitrary direct quantity editing is not the normal operational
    workflow.
5.  Compatible units are automatically converted.
6.  Low-stock status is supported.
7.  Target stock levels are not required in the baseline system.

## 5. Sale and Inventory Transaction Rules

1.  A POS item cannot be added if its recipe cannot be fulfilled from
    available branch inventory.
2.  A completed sale must never partially deduct inventory.
3.  Sale completion and its inventory deductions must be atomic.
4.  If required inventory cannot be deducted, the sale must not become
    completed.
5.  Completed sales are retained as historical records.
6.  No cancellation/refund workflow is included in the baseline.

## 6. Payment Rules

1.  Supported payment methods are Cash and GCash.
2.  GCash sales store the entered reference number.
3.  The system does not process the actual GCash payment gateway.

## 7. Reconciliation Rules

1.  Reconciliation records the expected/recorded discrepancy as defined
    by the final data model.
2.  A reason is required.
3.  Reasons include predefined values and Other.
4.  Reconciliation creates historical records.
5.  Reconciliation changes stock through an auditable transaction.

## 8. Notification Rules

1.  Notifications can be marked read.
2.  Read notifications remain in historical records.
3.  Branch-specific operational notifications must respect branch
    access.

## 9. Auditability

Important operational changes should retain:

-   Who performed the action.
-   When it occurred.
-   The relevant branch.
-   What changed, where practical.
-   A reason where the workflow requires one.
