# Taste It — Routes and Navigation

## 1. Public Route

```text
/
```

Login.

---

# 2. Authentication Flow

## Owner

```text
/
 ↓
Login
 ↓
Branch Selection / Branch Management
 ↓
/dashboard
```

## Staff

```text
/
 ↓
Login
 ↓
Assigned Branch
 ↓
Staff Dashboard
```

---

# 3. Owner Routes

Recommended route structure:

```text
/dashboard
/menu
/inventory
/reconciliation
/sales
/staff
/reports
/reports/ai
```

If branch management receives a dedicated route, use a clear route such as:

```text
/branches
```

The exact final route can be changed if the approved UI establishes another convention.

---

# 4. Staff Routes

Recommended:

```text
/staff/dashboard
/pos
/menu
/inventory
/reconciliation
/sales
```

Do not expose:

```text
/staff
/reports
/reports/ai
/branches
```

as Staff navigation unless an approved requirement changes the permission model.

---

# 5. Navigation Labels

Owner:

- Dashboard
- POS
- Menu Management
- Inventory
- Reconciliation
- Sales
- Staff Management
- Reports
- AI Business Reports

Staff:

- Dashboard
- POS
- Menu
- Inventory
- Reconciliation
- Sales

---

# 6. Route Protection

Unauthenticated user:

```text
Any protected route
 ↓
/
```

Authenticated Owner attempting Staff-only route:

- Allow only if the route is legitimately shared.
- Otherwise redirect or show an appropriate unauthorized state.

Staff attempting Owner-only route:

```text
Unauthorized
```

or redirect to Staff Dashboard.

Do not rely only on hidden navigation.

---

# 7. Branch Context

Branch-dependent pages should not encode branch names directly.

Bad:

```js
const branch = "Babag";
```

Good:

```js
const { currentBranch } = useBranch();
```

Owner changes active branch using the global BranchContext.

Staff receives their assigned branch.

---

# 8. Sidebar

The Sidebar should be rendered by `AppLayout`.

Do not render a separate Sidebar inside every page.

Temporary migration compatibility may exist until old pages are converted.

---

# 9. Topbar

Topbar should:

- Display active branch
- Provide branch switching for Owner
- Show user identity
- Provide notification access where implemented
- Provide responsive navigation trigger

Staff should not receive an unrestricted branch switcher.
