# Taste It — Business Rules

## BR-001 — Branch Separation

Taste It operates two branches:

- Babag
- Marigondon

Each branch maintains its own sales and inventory records.

There is no centralized inventory pool.

There is no branch-to-branch inventory transfer.

---

## BR-002 — Active Branch Context

Owner selects one branch.

The selected branch becomes the active operational context.

Branch-dependent screens must read from the active branch context.

The selected branch should remain visible in the topbar.

Owner can switch branches from the application shell.

---

## BR-003 — Staff Branch Restriction

Staff are assigned to a branch.

Staff cannot freely switch to another branch.

All Staff branch-dependent operations must use the assigned branch.

---

## BR-004 — Active Staff Account

Staff access requires:

- Valid credentials
- Active account
- Assigned branch

Deactivated Staff accounts must be denied access.

---

## BR-005 — Recipe-Based Inventory Deduction

Every completed sale triggers recipe-based ingredient deduction.

For each sold menu item:

```text
Consumed ingredient quantity
=
Recipe quantity per item × sold quantity
```

The total consumption is deducted from the active branch's inventory.

---

## BR-006 — Completed Sale

Inventory deduction occurs when the transaction is completed.

Do not deduct inventory merely because an item was added to the cart.

Cart changes are temporary.

Completed sale is the inventory-impacting event.

---

## BR-007 — Recipe Dependency

Automatic deduction depends on a valid recipe.

If a menu item lacks a valid recipe, the frontend should not silently pretend that inventory deduction occurred.

The UI should make the missing recipe condition visible and prevent misleading inventory behavior where appropriate.

---

## BR-008 — Inventory Status

Required statuses:

- Normal
- Low Stock
- Out of Stock

Status is derived from current stock and that ingredient's threshold.

Do not hard-code one global threshold.

Each inventory item also has a target stock level for restocking context. It does not affect the Normal/Low Stock/Out of Stock calculation.

---

## BR-009 — Out-of-Stock Availability

Inventory status can affect menu availability.

The project analysis explicitly identifies out-of-stock ingredients as a reason affected menu items may need to be marked unavailable.

The POS must check item availability before adding an item.

---

## BR-010 — Low-Stock Alerts

Low-stock status should generate/maintain an operational alert.

The alert exists to make staff/Owner aware before an ingredient reaches zero.

---

## BR-011 — Reconciliation

Reconciliation compares:

```text
System Stock
vs.
Physical Stock
```

Calculation:

```text
Variance = Physical Stock - System Stock
```

If variance is zero:

```text
Matched
```

If variance is non-zero:

```text
Discrepancy
```

A discrepancy requires a reason.

---

## BR-012 — Reconciliation Adjustment

After confirmation:

- Save reconciliation record.
- Save user.
- Save date/time.
- Save system quantity.
- Save physical quantity.
- Save variance.
- Save reason when applicable.
- Update verified inventory quantity.
- Preserve audit history.

---

## BR-013 — Reconciliation Reasons

Client-analysis decisions identified these recognizable stock-loss/adjustment reasons:

- Damaged
- Expired/old stock
- Supplier return
- Miscount

The UI may provide these as predefined options.

Do not imply that these are the only possible reasons unless the final approved design says so.

---

## BR-014 — Sales Immutability

Completed sales should not be casually edited after completion.

The current project scope does not define a sales-edit/reversal workflow.

Do not invent one.

---

## BR-015 — Payment Processing Boundary

The system may record payment-related information needed for a completed transaction.

The system does not process payments.

Do not integrate:

- GCash API
- Card gateway
- QR payment gateway
- E-wallet gateway
- Payment verification service

Receipt generation is in scope.

---

## BR-016 — POS Availability

Before adding an item to the transaction, the POS should check whether the item is available.

Out-of-stock items should not be presented as normally purchasable.

---

## BR-017 — B1T1

B1T1 products are normal menu items.

Do not invent a special B1T1 engine unless explicitly requested.

If the pricing/quantity behavior is encoded in the menu item or promotion data, implement only the approved behavior.

---

## BR-018 — Combos

Combos are normal menu/business items unless a later approved requirement specifies a special combo builder.

Do not invent a complex combo configuration system.

---

## BR-019 — Facebook Orders

Facebook orders are outside direct system integration scope.

Do not build a Facebook API/order ingestion workflow.

---

## BR-020 — Restocking Schedule

Client interview analysis describes a fixed restocking cycle:

- Requests: Monday, Wednesday, Friday
- Stock release: Tuesday, Thursday, Saturday

This explains why early inventory alerts are operationally valuable.

Do not turn this into a procurement module.

---

## BR-021 — AI

AI is reporting-only.

Allowed:

- Weekly sales summary
- Weekly inventory summary
- Weekly business insights
- Week-over-week comparison
- Best/low-selling identification where data supports it

Not allowed:

- Demand forecasting
- Automatic recommendations
- Purchase ordering
- Recipe generation
- Recipe recommendations

---

## BR-022 — Auditability

Inventory adjustments and reconciliation actions must retain:

- User
- Date/time
- Before/system quantity
- Physical/verified quantity
- Variance
- Reason

This exists because the client's current process requires manual investigation of discrepancies.

---

## BR-023 — Derived Data

Avoid storing contradictory derived state.

Examples:

- Stock status should be calculated from stock + threshold.
- Sale total should be calculated from sale items and approved adjustments.
- Inventory consumption should be calculated from recipe + sold quantity.
