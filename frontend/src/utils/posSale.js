const COMPLETE_SALE_ERROR_MESSAGES = {
  INSUFFICIENT_INVENTORY: "Some ingredients are out of stock. Please review the cart.",
  CASH_RECEIVED_REQUIRED: "Please enter the amount of cash received.",
  INSUFFICIENT_CASH: "The cash received is not enough to complete this sale.",
  MENU_ITEM_UNAVAILABLE: "One or more items are no longer available.",
  MENU_ITEM_RECIPE_REQUIRED: "One or more menu items are not configured correctly for inventory deduction.",
  BRANCH_ACCESS_DENIED: "You do not have permission to process sales for this branch.",
  BRANCH_NOT_ACTIVE: "This branch is currently inactive and cannot process sales.",
  ACTIVE_USER_REQUIRED: "Your account is not active. Please contact your administrator.",
  AUTHENTICATION_REQUIRED: "Your session has expired. Please sign in again.",
  CART_EMPTY: "Add at least one menu item before completing the sale.",
  INVALID_ITEM_QUANTITY: "One or more cart quantities are invalid. Please review the cart.",
};

function getErrorText(error) {
  return [error?.message, error?.details, error?.hint, error?.code]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" | ");
}

export function mapCompleteSaleErrorMessage(error) {
  const normalized = getErrorText(error).toUpperCase();

  for (const [token, message] of Object.entries(COMPLETE_SALE_ERROR_MESSAGES)) {
    if (normalized.includes(token)) {
      return message;
    }
  }

  return "We couldn't complete the sale safely. Please try again.";
}

export function applyCompleteSaleRpcFields(sale, rpcResult) {
  if (!sale) return sale;

  return {
    ...sale,
    id: rpcResult?.sale_id ?? sale.id,
    transactionId: rpcResult?.transaction_number ?? sale.transactionId,
    subtotal: rpcResult?.subtotal == null ? sale.subtotal : Number(rpcResult.subtotal),
    total: rpcResult?.total == null ? sale.total : Number(rpcResult.total),
    changeAmount: rpcResult?.change_amount == null ? sale.changeAmount : Number(rpcResult.change_amount),
  };
}

export function buildConfirmedSaleSummary({ branchId, payment, rpcResult, user }) {
  return {
    id: rpcResult?.sale_id ?? null,
    transactionId: rpcResult?.transaction_number ?? "",
    branchId: branchId ?? null,
    cashierId: user?.id ?? user?.authUserId ?? null,
    cashierName: user?.name ?? "Taste It User",
    createdAt: new Date().toISOString(),
    items: [],
    subtotal: Number(rpcResult?.subtotal ?? 0),
    total: Number(rpcResult?.total ?? rpcResult?.subtotal ?? 0),
    paymentMethod: payment?.method ?? "CASH",
    paymentReference: payment?.method === "GCASH" ? payment.reference?.trim() || null : null,
    status: "COMPLETED",
    cashReceived: payment?.method === "CASH" && Number.isFinite(payment.cashReceived) ? Number(payment.cashReceived) : null,
    changeAmount: rpcResult?.change_amount == null ? null : Number(rpcResult.change_amount),
  };
}
