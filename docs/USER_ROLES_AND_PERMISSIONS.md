# Taste It — User Roles and Permissions

## 1. Role Definitions

The approved application roles are:

1. Owner / Manager
2. Staff

Some source materials use "Cashier" when describing the staff member who operates POS. For the application UI, use **Staff** as the role label unless a later explicit decision changes it.

---

# 2. Owner / Manager

## Authentication

Allowed:

- Login
- Logout
- Access protected application

## Branch

Allowed:

- View branch list
- Select branch
- Open branch
- Switch branch
- Add branch
- Edit branch details
- Deactivate branch with confirmation

The Owner operates within one selected branch at a time.

Do not create an "All Branches" operating mode unless explicitly approved.

## Dashboard

Allowed:

- Owner Dashboard

## POS

Allowed:

- Access the branch-scoped POS workspace.

## Menu

Allowed:

- View menu
- Create menu item
- Edit menu item
- Delete menu item
- Activate/deactivate item
- Manage categories
- Manage recipes

## Inventory

Allowed:

- View inventory
- View item details
- View stock status
- View inventory history
- Perform inventory-related authorized actions
- Configure item-specific low-stock thresholds and target stock levels

## Reconciliation

Allowed:

- Select item
- View system stock
- Enter physical stock
- Review variance
- Enter reason
- Confirm match
- Save reconciliation
- Update verified stock
- View audit trail

## Sales

Allowed:

- View sales
- Filter sales by date
- View transaction details

The finalized navigation model allows Owner/Manager access to the branch-scoped POS route alongside Staff.

## Staff

Allowed:

- Create Staff
- View Staff
- Edit Staff
- Deactivate/delete Staff
- Manage Staff details

## Reports

Allowed:

- Sales Report
- Inventory Status Report
- Inventory Reconciliation Report
- AI Weekly Business Report

## Notifications

Allowed:

- View operational alerts/notifications

---

# 3. Staff

## Authentication

Allowed:

- Login using branch-assigned credentials
- Logout

Required:

- Account must be active.
- Account must have an assigned branch.

## Branch

Allowed:

- Access assigned branch

Not allowed:

- Switch branches freely
- View another branch
- Perform branch-to-branch inventory transfer

## Dashboard

Allowed:

- Staff Dashboard for assigned branch

## POS

Allowed:

- Start transaction
- Search menu
- Add items
- Change quantities
- Check availability
- Confirm order
- Record payment information
- Complete sale
- Generate/print receipt

## Sales

Allowed:

- View own sales history
- View own transaction details

## Inventory

Allowed:

- View inventory list
- View item details
- View Normal/Low Stock/Out of Stock status
- View item thresholds and target stock levels

Not allowed:

- Change low-stock thresholds or target stock levels.

## Reconciliation

Allowed:

- Select inventory item
- View system stock
- Enter physical count
- Review variance
- Record discrepancy reason
- Confirm matched count
- Save reconciliation
- Update verified stock
- Create audit history

## Menu

Allowed:

- View menu items and details.
- Toggle a menu item's availability status.

Not allowed:

- Create, edit, or delete menu items.
- Change menu pricing.
- Manage categories or recipes.

## Staff Management

Not allowed.

## Branch Management

Not allowed.

## Owner Reports

Not allowed:

- Sales reports intended for Owner
- Inventory reports intended for Owner
- Reconciliation reports intended for Owner
- AI Weekly Business Reports

---

# 4. Permission Matrix

| Module / Action | Owner / Manager | Staff |
|---|---:|---:|
| Login | Yes | Yes |
| Logout | Yes | Yes |
| Branch selection | Yes | No |
| Switch branch | Yes | No |
| Add branch | Yes | No |
| Edit branch | Yes | No |
| Deactivate branch | Yes | No |
| Owner Dashboard | Yes | No |
| Staff Dashboard | No | Yes |
| POS transaction | Yes | Yes |
| Own sales history | Optional/Not required | Yes |
| View sales transactions | Yes | Own history only |
| Menu view/details | Yes | Yes |
| Menu availability toggle | Yes | Yes |
| Menu create/edit/delete | Yes | No |
| Menu pricing changes | Yes | No |
| Category management | Yes | No |
| Recipe management | Yes | No |
| Inventory view | Yes | Yes |
| Inventory history | Yes | No |
| Inventory reconciliation | Yes | Yes |
| Staff management | Yes | No |
| Sales Report | Yes | No |
| Inventory Status Report | Yes | No |
| Reconciliation Report | Yes | No |
| AI Weekly Business Report | Yes | No |
| Inventory alerts | Yes | Yes |
| Receipt generation | System capability | Yes through POS |

If an access rule is not explicitly defined, do not invent a broader permission.

---

# 5. Navigation Principle

Navigation must be role-aware.

Owner should see Owner-relevant modules.

Staff should see Staff-relevant operational modules.

Inventory is an expandable navigation group for both roles, containing Inventory and Inventory Reconciliation. AI Business Reports is a standalone Owner-only module and is not nested under Reports.

Do not merely hide a button while leaving a protected route accessible. Route-level access control must also exist.
