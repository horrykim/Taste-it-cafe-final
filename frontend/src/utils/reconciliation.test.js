import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReconciliationDraftItems,
  buildReasonText,
  getCountVariance,
  getReconciliationStatus,
  normalizeCountInput,
  parseSelectedInventoryItems,
  resolveReconciliationReason,
  summarizeCountItems,
  summarizeReconciliationRecords,
} from "./reconciliation.js";

test("normalizeCountInput handles blank, numeric, and invalid values", () => {
  assert.equal(normalizeCountInput(""), null);
  assert.equal(normalizeCountInput(null), null);
  assert.equal(normalizeCountInput("12.5"), 12.5);
  assert.equal(Number.isNaN(normalizeCountInput("abc")), true);
});

test("getCountVariance returns null for missing input and computes numeric variance", () => {
  assert.equal(getCountVariance(10, null), null);
  assert.equal(getCountVariance(10, 14), 4);
  assert.equal(getCountVariance(10, 6.5), -3.5);
});

test("getReconciliationStatus maps missing, matched, and discrepancy states", () => {
  assert.equal(getReconciliationStatus(null), "pending");
  assert.equal(getReconciliationStatus({ variance: 0 }), "matched");
  assert.equal(getReconciliationStatus({ variance: -1 }), "discrepancy");
});

test("buildReasonText combines database reason label with custom note when present", () => {
  assert.equal(buildReasonText("Counting Error", ""), "Counting Error");
  assert.equal(buildReasonText("Other", "Night shift recount"), "Other: Night shift recount");
});

test("summarizeCountItems returns reconciliation progress totals", () => {
  const summary = summarizeCountItems([
    { physicalQuantity: 10, variance: 0 },
    { physicalQuantity: 8, variance: -2 },
    { physicalQuantity: 12, variance: 2 },
    { physicalQuantity: null, variance: null },
  ]);

  assert.deepEqual(summary, {
    total: 4,
    counted: 3,
    matched: 1,
    shortages: 1,
    excesses: 1,
  });
});

test("summarizeReconciliationRecords returns matched and discrepancy totals", () => {
  const summary = summarizeReconciliationRecords([
    { variance: 0 },
    { variance: -2 },
    { variance: 3 },
  ]);

  assert.deepEqual(summary, {
    totalRecords: 3,
    matched: 1,
    shortages: 1,
    excesses: 1,
  });
});

test("buildReconciliationDraftItems includes all active items for full counts", () => {
  const items = buildReconciliationDraftItems([
    { id: "a", name: "Milk", unit: "ml", category: "Dairy", currentQuantity: 12, active: true },
    { id: "b", name: "Sugar", unit: "g", category: "Dry", currentQuantity: 8, active: false },
    { id: "c", name: "Coffee", unit: "g", category: "Dry", currentQuantity: 3, active: true },
  ]);

  assert.deepEqual(items.map((item) => item.ingredientId), ["a", "c"]);
});

test("buildReconciliationDraftItems includes exactly one selected item for targeted counts", () => {
  const items = buildReconciliationDraftItems(
    [
      { id: "a", name: "Milk", unit: "ml", category: "Dairy", currentQuantity: 12, active: true },
      { id: "b", name: "Sugar", unit: "g", category: "Dry", currentQuantity: 8, active: true },
      { id: "c", name: "Coffee", unit: "g", category: "Dry", currentQuantity: 3, active: true },
    ],
    "targeted",
    ["b"]
  );

  assert.deepEqual(items.map((item) => item.ingredientId), ["b"]);
});

test("buildReconciliationDraftItems includes exactly selected items for multi-item targeted counts", () => {
  const items = buildReconciliationDraftItems(
    [
      { id: "a", name: "Milk", unit: "ml", category: "Dairy", currentQuantity: 12, active: true },
      { id: "b", name: "Sugar", unit: "g", category: "Dry", currentQuantity: 8, active: true },
      { id: "c", name: "Coffee", unit: "g", category: "Dry", currentQuantity: 3, active: true },
      { id: "d", name: "Chocolate", unit: "g", category: "Dry", currentQuantity: 5, active: true },
    ],
    "targeted",
    ["a", "c", "d"]
  );

  assert.deepEqual(items.map((item) => item.ingredientId), ["a", "c", "d"]);
});

test("resolveReconciliationReason uses session reason by default", () => {
  assert.deepEqual(
    resolveReconciliationReason(
      { overrideReasonType: "", overrideOtherReason: "" },
      { reasonType: "counting_error", otherReason: "" }
    ),
    { reasonType: "counting_error", otherReason: "" }
  );
});

test("resolveReconciliationReason enforces item-level Other text when provided", () => {
  assert.deepEqual(
    resolveReconciliationReason(
      { overrideReasonType: "other", overrideOtherReason: "Damaged lid" },
      { reasonType: "counting_error", otherReason: "" }
    ),
    { reasonType: "other", otherReason: "Damaged lid" }
  );
});

test("parseSelectedInventoryItems deduplicates and trims ids", () => {
  assert.deepEqual(parseSelectedInventoryItems("a, b ,a,,c"), ["a", "b", "c"]);
  assert.deepEqual(parseSelectedInventoryItems(""), []);
});
