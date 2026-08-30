import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInventoryHistoryReason,
  formatMovementType,
  getHistoryChangeTone,
  hasMoreHistory,
  mapInventoryHistoryRow,
} from "./inventoryHistory.js";

test("formatMovementType renders supported movement labels", () => {
  assert.equal(formatMovementType("sale"), "Sale");
  assert.equal(formatMovementType("reconciliation"), "Reconciliation");
});

test("buildInventoryHistoryReason prefers reconciliation other_reason when present", () => {
  assert.equal(
    buildInventoryHistoryReason({
      reason: "Generic text",
      inventory_reconciliations: {
        other_reason: "Counted broken seals",
        reconciliation_reasons: { label: "Damaged" },
      },
    }),
    "Damaged: Counted broken seals"
  );
});

test("buildInventoryHistoryReason falls back to reconciliation label then movement reason", () => {
  assert.equal(
    buildInventoryHistoryReason({
      reason: "Fallback movement reason",
      inventory_reconciliations: {
        other_reason: null,
        reconciliation_reasons: { label: "Counting Error" },
      },
    }),
    "Counting Error"
  );

  assert.equal(
    buildInventoryHistoryReason({
      reason: "Movement reason only",
      inventory_reconciliations: null,
    }),
    "Movement reason only"
  );
});

test("mapInventoryHistoryRow preserves branch-scoped movement data and newest-first-compatible fields", () => {
  const entry = mapInventoryHistoryRow({
    id: "mov-1",
    branch_id: "branch-1",
    inventory_item_id: "item-1",
    movement_type: "reconciliation",
    performed_by: "user-1",
    quantity_before: 99,
    quantity_after: 97,
    quantity_change: -2,
    reason: "fallback",
    reconciliation_id: "rec-1",
    sale_id: null,
    created_at: "2026-08-31T15:42:00.000Z",
    profiles: { full_name: "Juan Dela Cruz", role: "owner" },
    inventory_reconciliations: {
      other_reason: null,
      reconciliation_reasons: { label: "Counting Error", reason_type: "counting_error" },
    },
  });

  assert.equal(entry.branchId, "branch-1");
  assert.equal(entry.itemId, "item-1");
  assert.equal(entry.type, "Reconciliation");
  assert.equal(entry.quantityBefore, 99);
  assert.equal(entry.quantityAfter, 97);
  assert.equal(entry.quantityChange, -2);
  assert.equal(entry.variance, -2);
  assert.equal(entry.change, "99 -> 97");
  assert.equal(entry.signedChange, "-2");
  assert.equal(entry.reason, "Counting Error");
  assert.equal(entry.user.name, "Juan Dela Cruz");
  assert.equal(entry.user.role, "OWNER");
  assert.equal(entry.reference, "rec-1");
});

test("mapInventoryHistoryRow renders sale entries as Sale", () => {
  const entry = mapInventoryHistoryRow({
    id: "mov-2",
    branch_id: "branch-1",
    inventory_item_id: "item-1",
    movement_type: "sale",
    performed_by: "user-1",
    quantity_before: 10,
    quantity_after: 7,
    quantity_change: -3,
    reason: null,
    reconciliation_id: null,
    sale_id: "sale-1",
    created_at: "2026-08-31T15:43:00.000Z",
    profiles: { full_name: "Cashier A", role: "staff" },
    inventory_reconciliations: null,
  });

  assert.equal(entry.type, "Sale");
  assert.equal(entry.reference, "sale-1");
});

test("getHistoryChangeTone distinguishes positive, negative, and neutral movement changes", () => {
  assert.equal(getHistoryChangeTone({ quantityChange: 2 }), "positive");
  assert.equal(getHistoryChangeTone({ quantityChange: -1 }), "negative");
  assert.equal(getHistoryChangeTone({ quantityChange: 0 }), "neutral");
});

test("hasMoreHistory reports whether more than five records exist", () => {
  assert.equal(hasMoreHistory([1, 2, 3, 4, 5], 5), false);
  assert.equal(hasMoreHistory([1, 2, 3, 4, 5, 6], 5), true);
});
