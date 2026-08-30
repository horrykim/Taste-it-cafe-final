import { supabase } from "./supabase";
import { getMenuData } from "./menuService";
import { getInventory } from "./inventoryService";

// Map sale to UI format
function mapSale(row) {
  return {
    id: row.id,
    transactionId: row.transaction_number,
    branchId: row.branch_id,
    cashierId: row.staff_id,
    cashierName: row.profiles?.full_name || "Unknown Staff",
    createdAt: row.created_at,
    items: (row.sale_items || []).map(mapSaleItem),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    paymentMethod: String(row.payment_method).toUpperCase(),
    paymentReference: row.gcash_reference || null,
    status: String(row.status).toUpperCase(),
    cashReceived: row.cash_received ? Number(row.cash_received) : null,
    changeAmount: row.change_amount ? Number(row.change_amount) : null,
  };
}

function mapSaleItem(row) {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    name: row.item_name_snapshot,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price_snapshot),
    lineTotal: Number(row.line_total),
  };
}

export async function getPosTransactions(branchId, user) {
  if (!branchId) throw new Error("Branch ID is required");

  let query = supabase
    .from("sales")
    .select(`
      *,
      profiles (full_name),
      sale_items (*)
    `)
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false });

  // For STAFF, only show their own transactions
  if (user?.role === "STAFF") {
    query = query.eq("staff_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase getPosTransactions Error:", error);
    throw new Error("Could not fetch transactions.");
  }

  return (data || []).map(mapSale);
}

export async function getPosCatalogData(branchId) {
  // We reuse menuService and inventoryService for the catalog data
  const [{ categories, items }, inventory] = await Promise.all([
    getMenuData(branchId),
    getInventory(branchId)
  ]);
  
  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  
  const nextItems = items.map((item) => {
    // Check if item has recipe and if all ingredients are available
    const unavailableIngredient = (item.recipe ?? []).find((recipeEntry) => {
      const inventoryItem = inventoryById.get(recipeEntry.ingredientId);
      return !inventoryItem || inventoryItem.active === false || inventoryItem.currentQuantity < recipeEntry.quantity;
    });
    
    return {
      ...item,
      status: item.status === "ACTIVE" && !unavailableIngredient ? "ACTIVE" : "INACTIVE",
      available: item.status === "ACTIVE" && !unavailableIngredient,
      availabilityReason: unavailableIngredient 
        ? `Insufficient ${inventoryById.get(unavailableIngredient.ingredientId)?.name ?? "recipe stock"}.` 
        : null,
    };
  });
  
  return { categories, items: nextItems };
}

// eslint-disable-next-line no-unused-vars
export async function createPosTransaction(branchId, cart, payment, _user) {
  if (!cart.length) throw new Error("Add at least one menu item before completing the sale.");
  if (!["CASH", "GCASH"].includes(payment.method)) throw new Error("Select a valid payment method.");
  if (payment.method === "GCASH" && !payment.reference?.trim()) throw new Error("Enter the GCash / E-wallet reference number.");
  
  // Format the items array for the RPC
  const rpcItems = cart.map(line => ({
    menu_item_id: line.menuItemId,
    quantity: line.quantity
  }));

  // Ensure cash received is passed if provided, otherwise null
  const cashReceived = payment.method === "CASH" && payment.cashReceived ? Number(payment.cashReceived) : null;
  const gcashRef = payment.method === "GCASH" ? payment.reference.trim() : null;

  // We are blocked from doing this sequentially in React, we MUST use the RPC
  // Phase C: ATOMIC TRANSACTIONS - we will call complete_sale
  const { data, error } = await supabase.rpc("complete_sale", {
    p_branch_id: branchId,
    p_items: rpcItems,
    p_payment_method: payment.method.toLowerCase(),
    p_cash_received: cashReceived,
    p_gcash_reference: gcashRef
  });

  if (error) {
    console.error("Supabase complete_sale Error:", error);
    // Give user friendly error if it's an RLS or constraint error
    if (error.message.includes("Insufficient stock")) {
      throw new Error("One or more items do not have enough inventory stock to complete the sale.");
    }
    throw new Error(`Transaction failed: ${error.message}`);
  }

  // The RPC returns the sale record ID, so we fetch it back to get the full mapped object
  if (data && data.sale_id) {
     const { data: saleData } = await supabase
       .from("sales")
       .select(`*, profiles(full_name), sale_items(*)`)
       .eq("id", data.sale_id)
       .maybeSingle();
       
     if (saleData) return mapSale(saleData);
  }
  
  throw new Error("Transaction completed but could not be verified locally.");
}
