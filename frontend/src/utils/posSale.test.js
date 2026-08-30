import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCompleteSaleRpcFields,
  buildConfirmedSaleSummary,
  mapCompleteSaleErrorMessage,
} from "./posSale.js";

test("mapCompleteSaleErrorMessage maps known live RPC exceptions", () => {
  assert.equal(
    mapCompleteSaleErrorMessage({ message: "INSUFFICIENT_INVENTORY" }),
    "Some ingredients are out of stock. Please review the cart."
  );
  assert.equal(
    mapCompleteSaleErrorMessage({ message: "CASH_RECEIVED_REQUIRED" }),
    "Please enter the amount of cash received."
  );
  assert.equal(
    mapCompleteSaleErrorMessage({ message: "BRANCH_ACCESS_DENIED" }),
    "You do not have permission to process sales for this branch."
  );
});

test("mapCompleteSaleErrorMessage falls back safely for unknown errors", () => {
  assert.equal(
    mapCompleteSaleErrorMessage({ message: "unexpected postgres detail" }),
    "We couldn't complete the sale safely. Please try again."
  );
});

test("applyCompleteSaleRpcFields preserves authoritative RPC totals and transaction number", () => {
  const result = applyCompleteSaleRpcFields(
    {
      id: "sale-local",
      transactionId: "old-number",
      subtotal: 120,
      total: 120,
      changeAmount: 0,
    },
    {
      sale_id: "sale-live",
      transaction_number: "20260831-0007",
      subtotal: 135,
      total: 135,
      change_amount: 15,
    }
  );

  assert.deepEqual(result, {
    id: "sale-live",
    transactionId: "20260831-0007",
    subtotal: 135,
    total: 135,
    changeAmount: 15,
  });
});

test("buildConfirmedSaleSummary creates a safe fallback summary from RPC data", () => {
  const result = buildConfirmedSaleSummary({
    branchId: "branch-1",
    payment: {
      method: "CASH",
      cashReceived: 200,
      reference: "",
    },
    rpcResult: {
      sale_id: "sale-1",
      transaction_number: "20260831-0008",
      subtotal: 180,
      total: 180,
      change_amount: 20,
    },
    user: {
      id: "user-1",
      name: "Alex Rivera",
    },
  });

  assert.equal(result.id, "sale-1");
  assert.equal(result.transactionId, "20260831-0008");
  assert.equal(result.branchId, "branch-1");
  assert.equal(result.cashierId, "user-1");
  assert.equal(result.cashierName, "Alex Rivera");
  assert.equal(result.subtotal, 180);
  assert.equal(result.total, 180);
  assert.equal(result.paymentMethod, "CASH");
  assert.equal(result.cashReceived, 200);
  assert.equal(result.changeAmount, 20);
  assert.deepEqual(result.items, []);
});
