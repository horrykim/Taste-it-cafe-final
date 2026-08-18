# Taste It — Screen Specifications

## 1. Global Authenticated Shell

Authenticated screens use:

```text
Sidebar
+
Topbar
+
Main Content
```

The Topbar should display the active branch.

Owner can switch branches.

Staff sees their assigned branch.

---

# 2. Login

## Purpose

Authenticate users.

## Required Elements

- Taste It branding
- Email/username input as appropriate
- Password input
- Login button
- Error feedback
- Loading state
- Optional demo-account indication during mock mode

## Behavior

Valid Owner:

```text
Login → Branch Selection / Owner flow
```

Valid Staff:

```text
Login → Assigned Branch Dashboard
```

Invalid credentials:

```text
Stay on Login
+
Display clear error
```

Inactive Staff:

```text
Deny access
+
Display account inactive message
```

---

# 3. Owner Branch Selection

## Purpose

Allow Owner to choose the active branch.

Branches:

- Babag
- Marigondon

## Behavior

After selecting:

```text
Branch
 ↓
Owner Dashboard
```

The active branch must be visible afterward.

Owner can switch branch from the topbar without returning here.

---

# 4. Owner Dashboard

## Purpose

Provide high-level operational visibility.

## Branch Context

Every displayed value must correspond to the selected branch unless a specific report is explicitly designed for another scope.

## Useful Sections

- Sales overview
- Inventory overview
- Low-stock ingredients
- Out-of-stock ingredients
- Recent sales
- Reconciliation indicators
- Notifications
- Report shortcuts
- AI report shortcut

## Avoid

- Decorative charts without useful information
- Fake metrics that contradict underlying mock data
- Static values that do not change after transactions

---

# 5. Staff Dashboard

## Purpose

Give Staff quick access to operational tasks for their assigned branch.

Prioritize:

- POS
- Inventory status
- Low/out-of-stock alerts
- Reconciliation
- Recent own sales

Do not show Owner-only management functions.

---

# 6. Menu Management

## Purpose

Manage menu items and categories.

## Main View

Include:

- Page title
- Search
- Category filter
- Availability/status filter
- Menu item list/grid
- Add menu item action

## Menu Item

Support:

- Name
- Category
- Price
- Description where supported
- Image where supported
- Status
- Recipe

## Actions

Owner:

- Create
- Read
- Edit
- Delete
- Activate/deactivate

Destructive actions require confirmation.

---

# 7. Recipe Management

## Placement

Prefer within Menu Management:

```text
Menu Item
 ↓
Details/Edit
 ↓
Recipe
```

## Recipe Row

Show:

- Ingredient
- Quantity
- Unit
- Remove action

## Actions

- Add ingredient
- Edit quantity
- Remove ingredient
- Save recipe

Ingredients should come from the inventory ingredient list.

---

# 8. Inventory

## Purpose

Monitor branch inventory.

## Main View

Show:

- Ingredient
- Category
- Current stock
- Unit
- Threshold
- Status
- Last updated where useful

## Filters

- Search
- Category
- Status

## Status

- Normal
- Low Stock
- Out of Stock

## Details

Show:

- Ingredient information
- Current stock
- Threshold
- Status
- History where Owner has access

---

# 9. Inventory Reconciliation

## Purpose

Compare system stock with physical stock.

## Workflow

```text
Select ingredient
 ↓
View system stock
 ↓
Enter physical stock
 ↓
Calculate variance
 ↓
If variance ≠ 0 → require reason
 ↓
Confirm
 ↓
Save audit record
 ↓
Update inventory
```

## Display

Include:

- System quantity
- Physical quantity
- Variance
- Status: Matched/Discrepancy
- Reason

---

# 10. POS

## Purpose

Provide a fast transaction workflow.

## Layout

Desktop/tablet:

```text
Menu / Product Area
+
Cart
```

Mobile:

Stack or use appropriate responsive pattern.

## Features

- Search
- Category navigation
- Product selection
- Quantity control
- Availability status
- Cart
- Order confirmation
- Payment information
- Complete sale
- Receipt

## Inventory Behavior

Out-of-stock items must not behave as normally available.

After completing a sale:

```text
Sale saved
 ↓
Recipe deduction
 ↓
Inventory updated
 ↓
Status updated
 ↓
Alerts updated
```

---

# 11. Sales

## Purpose

Review completed sales.

## Owner

- View sales
- Filter by date
- View transaction details

## Staff

- View own sales
- View own transaction details

Do not invent editing/reversal behavior.

---

# 12. Staff Management

## Access

Owner only.

## Main View

Staff list with:

- Name
- Account status
- Branch
- Role
- Actions

## Actions

- Add
- Edit
- Deactivate/delete
- Credential reset where supported

---

# 13. Reports

## Report Types

- Sales Report
- Inventory Status Report
- Inventory Reconciliation Report

## Workflow

```text
Choose report
 ↓
Choose date range
 ↓
Generate
 ↓
View result
```

Branch context must be clear.

---

# 14. AI Weekly Business Reports

## Purpose

Provide a summarized weekly business view.

## Potential Sections

- Weekly sales summary
- Inventory status summary
- Best/low-selling information
- Week-over-week comparison
- Business insights

## Important

Do not label speculative text as factual AI insight.

Do not present demand forecasts or recommendations.

---

# 15. Notifications

## Main Operational Notifications

- Low Stock
- Out of Stock

## UX

Notification should make clear:

- What ingredient/item is affected
- Branch
- Status
- Relevant time
- Navigation to the related module where appropriate

---

# 16. Global States

Every data-driven screen should consider:

### Loading

Show a clear loading state.

### Empty

Explain what is empty and what the user can do.

### Error

Show actionable error information.

### Success

Confirm meaningful actions.

### Responsive

Verify desktop, tablet, and mobile.
