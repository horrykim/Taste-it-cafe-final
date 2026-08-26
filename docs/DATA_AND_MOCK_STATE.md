# Taste It — Data Model and Mock State

## 1. Purpose

The frontend must operate without the backend.

Mock data should be realistic enough to demonstrate the complete operational flow.

The mock layer should be replaceable by API services later.

---

# 2. Branch

Conceptual shape:

```js
{
  id,
  name,
  location,
  status
}
```

Known branches:

```text
Babag
Marigondon
```

---

# 3. User

```js
{
  id,
  name,
  email,
  role,
  branchId,
  status
}
```

Roles:

```text
OWNER
STAFF
```

Staff must have an assigned `branchId`.

Owner may not require a fixed branch because the Owner selects the active branch.

---

# 4. Category

```js
{
  id,
  name,
  status
}
```

---

# 5. Menu Item

Recommended conceptual shape:

```js
{
  id,
  name,
  categoryId,
  price,
  description,
  image,
  status,
  branchIds,
  recipeId
}
```

`branchIds` or equivalent branch-availability representation should support branch-specific availability if needed.

Do not hard-code every menu item to one branch.

---

# 6. Recipe

```js
{
  id,
  menuItemId,
  ingredients: [
    {
      ingredientId,
      quantity,
      unit
    }
  ]
}
```

The recipe references branch inventory items. A recipe quantity is consumption per menu item and is not the inventory quantity.

---

# 7. Ingredient / Inventory Item

```js
{
  id,
  branchId,
  name,
  category,
  unit,
  currentQuantity,
  lowStockThreshold,
  targetStockLevel,
  costPerUnit,
  supplier,
  lastUpdated,
  active
}
```

Important:

`status` should generally be derived.

Example:

```text
currentQuantity <= 0
→ Out of Stock

currentQuantity <= lowStockThreshold
→ Low Stock

currentQuantity > lowStockThreshold
→ Normal
```

`targetStockLevel` is a preferred restock level and does not create an additional stock-status range. The exact comparison convention is kept in one utility so it cannot diverge between screens.

---

# 8. Sale

```js
{
  id,
  branchId,
  staffId,
  items,
  subtotal,
  discount,
  packaging,
  total,
  paymentMethod,
  cashReceived,
  change,
  referenceNumber,
  status,
  createdAt
}
```

Only include fields that are actually used by the approved UI.

Payment information is recorded, not processed.

---

# 9. Sale Item

```js
{
  menuItemId,
  quantity,
  unitPrice,
  subtotal
}
```

---

# 10. Reconciliation

```js
{
  id,
  branchId,
  performedBy,
  createdAt,
  items: [
    {
      ingredientId,
      systemQuantity,
      physicalQuantity,
      variance,
      reason
    }
  ]
}
```

The frontend may support one-item-at-a-time reconciliation if that matches the approved screen flow, while preserving this logical structure.

---

# 11. Notification

Recommended:

```js
{
  id,
  branchId,
  type,
  title,
  message,
  relatedEntityId,
  read,
  createdAt
}
```

Allowed core types:

```text
LOW_STOCK
OUT_OF_STOCK
```

---

# 12. Audit Record

Inventory/reconciliation actions should preserve:

```js
{
  id,
  branchId,
  userId,
  entityType,
  entityId,
  action,
  beforeValue,
  afterValue,
  reason,
  createdAt
}
```

Use this for prototype audit history where required.

---

# 13. Mock Authentication

Recommended demo accounts may be:

```text
Owner:
owner@tasteit.com

Staff:
staff@tasteit.com
```

Credentials should be stored in a clearly isolated mock configuration.

Do not spread demo credentials throughout the application.

---

# 14. Suggested localStorage Keys

Use a consistent namespace:

```text
tasteit_auth
tasteit_branches
tasteit_users
tasteit_categories
tasteit_menu
tasteit_recipes
tasteit_inventory
tasteit_sales
tasteit_reconciliations
tasteit_notifications
tasteit_audit
tasteit_active_branch
```

The exact implementation may differ, but avoid random key names.

---

# 15. Derived Data

Prefer deriving:

### Inventory status

From:

```text
stock + threshold
```

### Sale total

From:

```text
sale items + approved pricing/discount/packaging
```

### Ingredient consumption

From:

```text
recipe quantity × sold quantity
```

### Reconciliation variance

From:

```text
physical quantity - system quantity
```

---

# 16. Persistence

Meaningful prototype changes should survive refresh.

Examples:

- Login/session
- Active branch
- Menu changes
- Recipe changes
- Inventory changes
- Completed sales
- Reconciliation records
- Notifications
- Audit history

Do not persist transient UI state unnecessarily.

---

# 17. Resetting Mock Data

Provide a development-friendly way to reset mock state if useful.

A reset should be explicit and should not appear as a normal business operation.

Do not expose destructive "reset all data" controls to normal users.
