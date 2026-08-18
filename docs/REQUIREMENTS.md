# Taste It — Functional Requirements

## 1. Authentication and Access Control

The system shall:

- Validate user credentials during login.
- Display an error for invalid credentials.
- Apply role-based access control.
- Distinguish Owner/Manager from Staff.
- Verify that a Staff account is active before access.
- Deny access to deactivated Staff accounts.
- Route Owner/Manager accounts into the branch-management/branch-selection flow.
- Route Staff accounts to their assigned branch dashboard.
- Support logout.

Frontend prototype note:

Authentication may use mock credentials and localStorage while the backend is unavailable.

---

## 2. Branch Management

Branch management is restricted to Owner/Manager.

The Owner/Manager shall be able to:

- Select/open an existing branch.
- Add a branch.
- Edit branch details.
- Deactivate a branch subject to confirmation.
- Switch the currently selected branch.

Known branches:

- Babag
- Marigondon

Staff cannot freely switch branches.

---

## 3. Menu Management

Owner/Manager can manage menu items.

### Create

Add a menu item with at least:

- Name
- Category
- Price
- Status

### Read

- View menu list.
- View menu item details.

### Update

- Edit menu item details.
- Toggle Active/Inactive availability.

### Delete

- Remove a menu item.
- Destructive deletion requires confirmation.

### Category Management

The project context also supports category management.

The frontend should allow category creation/editing/deletion where this is part of the approved UI.

Known example categories may include:

- Burgers
- Meals
- Pastries
- Drinks
- B1T1
- Combos

These examples are not a fixed exhaustive category list.

---

## 4. Recipe Management

Recipes are linked to menu items.

A recipe documents the ingredients required to prepare a menu item.

Each recipe ingredient should include:

- Inventory ingredient
- Quantity
- Unit

Recipe data is used by Automatic Inventory Deduction.

The frontend should make recipe editing understandable within Menu Management rather than treating recipes as an unrelated standalone business area unless a later design explicitly requires otherwise.

---

## 5. Inventory Management

The system shall provide inventory monitoring.

Users with appropriate access can:

- View inventory list.
- View individual ingredient details.
- View category.
- View unit.
- View current stock.
- View stock status.

Required stock states:

- Normal
- Low Stock
- Out of Stock

Owner/Manager can view inventory history including:

- Change
- User
- Date/time

Inventory thresholds are ingredient-specific.

Do not create one global hard-coded threshold.

---

## 6. Automatic Inventory Deduction

When a completed POS sale is recorded:

1. The sale is saved.
2. Sold menu items are identified.
3. Their recipes are read.
4. Recipe ingredient quantities are multiplied by sold quantities.
5. Corresponding ingredient stock is deducted.
6. Branch inventory is updated.
7. Stock status is recalculated.
8. Relevant alerts are updated.

This should happen automatically in the frontend prototype.

---

## 7. Inventory Alerts

The system shall identify:

- Normal
- Low Stock
- Out of Stock

Alerts exist to help staff and Owner/Manager identify shortages before they affect operations.

The UI should make stock status immediately understandable.

---

## 8. Point-of-Sale / Sales

Staff shall be able to:

- Start a transaction.
- Search for menu items.
- Add menu items.
- Specify quantity.
- Add multiple items.
- Check item availability.
- Confirm an order.
- Select a payment method.
- Enter payment amount for cash.
- Complete the transaction.
- Generate/print a receipt.

The system shall automatically:

- Record the completed sale.
- Deduct corresponding ingredient quantities from inventory.

Owner/Manager can:

- View sales transactions.
- Filter sales by date.
- View transaction details.

Staff can:

- View their own sales history.
- View their own transaction details.

### Payment Boundary

Payment processing is outside scope.

The system does not connect to:

- GCash
- Card gateways
- QR payment gateways
- E-wallet APIs
- Other payment processors

The system only records the completed transaction/payment information needed for the application and generates receipts.

---

## 9. Inventory Reconciliation

Authorized users include Owner/Manager and Staff.

The system shall allow:

- Selecting an inventory item.
- Viewing system stock.
- Entering/viewing physical stock count.
- Automatically comparing system stock against physical stock.
- Recording a discrepancy reason.
- Confirming a matched count when there is no discrepancy.
- Saving the reconciliation.
- Updating inventory with verified stock.
- Saving an audit trail.

Conceptual calculation:

```text
Variance = Physical Count - System Stock
```

A discrepancy requires a reason.

Useful predefined reasons identified in the project analysis include:

- Damaged
- Expired/old stock
- Supplier return
- Miscount

These are examples derived from the client-analysis decision set and should remain editable/extendable only if approved.

---

## 10. Staff Management

Restricted to Owner/Manager.

CRUD operations:

### Create

- Add Staff account.

### Read

- View Staff list.

### Update

- Edit Staff details.
- Assign/change branch where appropriate.
- Reset credentials where supported.

### Delete

- Delete or deactivate Staff.
- Require confirmation for destructive actions.

---

## 11. Reports

Owner/Manager shall be able to:

- Select report type.
- Select date range.
- Generate report.
- View generated report.
- Generate another report.
- Return to dashboard.

Approved report types:

1. Sales Report
2. Inventory Status Report
3. Inventory Reconciliation Report
4. AI Weekly Business Report

---

## 12. AI Weekly Business Report

The AI Weekly Business Report summarizes:

- Sales performance
- Inventory status
- Business insights
- Weekly comparisons
- Best/low-selling information where supported

The AI feature must remain reporting-oriented.

It must not provide:

- Demand forecasting
- Automatic purchase recommendations
- Automatic inventory ordering
- Recipe suggestions
- Recipe generation

---

## 13. Receipts

The system shall generate/print receipts after completed transactions.

Receipt behavior is part of the sales/POS workflow.

Payment processing itself remains outside scope.

---

## 14. Notifications

The frontend should support operational notifications for relevant inventory conditions, especially:

- Low Stock
- Out of Stock

Do not invent unrelated notification categories.

---

## 15. Out-of-Scope Requirements

Do not implement:

- Supplier management
- Online ordering
- Delivery integration
- Payment processing
- Financial accounting
- Payroll
- Third-party system integration
- Direct Facebook order integration
- Branch-to-branch inventory transfer
- Centralized inventory pool
- AI demand forecasting
- AI recommendations
- AI recipe generation
