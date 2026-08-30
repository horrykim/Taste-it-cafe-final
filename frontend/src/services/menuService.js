// frontend/src/services/menuService.js
// Calls the Express API in backend/routes/menu.js

import api from "./api";
import { getInventoryStatus } from "../utils/inventoryStatus";

const ownerOnly = new Set(["OWNER"]);
const availabilityRoles = new Set(["OWNER", "STAFF"]);

const TOKEN_KEY = "token";

function assertRole(actorRole, allowed) {
  if (!allowed.has(actorRole)) {
    throw new Error("You do not have permission for this menu action.");
  }
}

function authHeaders(actorRole) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return { Authorization: `Bearer ${token}` };
  return actorRole ? { "x-user-role": actorRole } : {};
}

async function request(path, { method = "get", body, actorRole } = {}) {
  try {
    const response = await api.request({
      url: path,
      method,
      headers: authHeaders(actorRole),
      ...(body ? { data: body } : {}),
    });

    const payload = response.data;

    if (payload && payload.success === false) {
      throw new Error(payload.message || "The request failed. Please try again.");
    }

    return payload;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "The request failed. Please try again.";
    throw new Error(message);
  }
}

// ---------------------------------------------------------------------------
// Branch id resolution
// ---------------------------------------------------------------------------

let branchCache = null;

async function loadBranches() {
  if (branchCache) return branchCache;

  const payload = await request("/inventory/branches");
  const branches = payload.branches ?? [];

  if (!branches.length) {
    throw new Error("The API returned no branches.");
  }

  branchCache = branches;
  return branchCache;
}

function normalizeBranchName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s*branch\s*$/, "")
    .replace(/[^a-z0-9]/g, "");
}

async function resolveBranchId(branchId) {
  if (branchId === null || branchId === undefined || branchId === "") {
    throw new Error("Select a branch before managing the menu.");
  }

  // If it's already a number, use it directly
  if (!Number.isNaN(Number(branchId)) && String(branchId).trim() !== "") {
    return Number(branchId);
  }

  const branches = await loadBranches();
  const needle = normalizeBranchName(branchId);

  const match = branches.find((branch) => {
    const name = normalizeBranchName(branch.branch_name);
    const code = normalizeBranchName(branch.branch_code);
    return name === needle || code === needle || name.startsWith(needle) || needle.startsWith(name);
  });

  if (!match) {
    const available = branches.map((b) => b.branch_name).join(", ");
    throw new Error(
      `Branch "${branchId}" does not match any branch in the database (${available}).`
    );
  }

  return Number(match.id);
}

// ---------------------------------------------------------------------------
// Row -> UI mappers
// ---------------------------------------------------------------------------

function toCategory(row) {
  return {
    id: row.category_id,
    name: row.name,
    color: row.color ?? null,
    status: row.is_active ? "ACTIVE" : "INACTIVE",
    description: row.description ?? "",
    displayOrder: row.display_order ?? 0,
  };
}

function toMenuItem(row) {
  // is_active    = the cafe still sells this item  -> the UI's ACTIVE/INACTIVE
  // is_available = there is stock to sell it now   -> separate, stock-driven
  const active = row.is_active !== false;

  return {
    id: row.id,
    branchId: row.branch_id,
    categoryId: row.category_id,
    recipeId: row.recipe_id ?? null,
    name: row.item_name,
    description: row.description ?? "",
    price: Number(row.price ?? 0),
    imageUrl: row.image_url || null,
    isActive: active,
    available: row.is_available !== false,
    status: active ? "ACTIVE" : "INACTIVE",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recipe: (row.recipe ?? []).map((entry) => ({
      ingredientId: entry.ingredient_id,
      quantity: Number(entry.quantity_required),
      unit: entry.unit ?? "",
    })),
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getMenuData(branchId) {
  const id = await resolveBranchId(branchId);

  const [categoryPayload, itemPayload] = await Promise.all([
    request("/menu/categories"),
    request(`/menu?branch_id=${encodeURIComponent(id)}`),
  ]);

  return {
    categories: (categoryPayload.categories ?? []).map(toCategory),
    items: (itemPayload.menuItems ?? []).map(toMenuItem),
  };
}

export const getMockMenuData = getMenuData;

export async function getIngredients(branchId) {
  const id = await resolveBranchId(branchId);
  const payload = await request("/inventory");

  return (payload.inventory ?? [])
    .filter((row) => Number(row.branch_id) === id)
    .map((row) => {
      const item = {
        id: Number(row.ingredient_id),
        name: row.ingredient_name,
        unit: row.unit ?? "",
        currentQuantity: Number(row.quantity ?? 0),
        lowStockThreshold: Number(row.low_stock_level ?? 0),
        lastUpdated: row.updated_at,
      };

      // MenuItemModal renders option.status, so this must never be undefined.
      return { ...item, status: getInventoryStatus(item) ?? "in-stock" };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const getMockIngredients = getIngredients;

// ---------------------------------------------------------------------------
// Menu item writes
// ---------------------------------------------------------------------------

export async function saveMenuItem(branchId, item, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  const id = await resolveBranchId(branchId);

  const price = Number(item.price);
  if (!item.name?.trim() || !item.categoryId || !Number.isFinite(price) || price < 0) {
    throw new Error("Name, category, and a valid price are required.");
  }

  const body = {
    branch_id: id,
    category_id: item.categoryId,
    item_name: item.name.trim(),
    description: item.description?.trim() ?? "",
    price,
    image_url: item.imageUrl || null,
    is_active: item.status !== "INACTIVE",
    recipe: (item.recipe ?? []).map((entry) => ({
      ingredient_id: entry.ingredientId,
      quantity_required: Number(entry.quantity),
      unit: entry.unit ?? null,
    })),
  };

  const payload = item.id
    ? await request(`/menu/${item.id}`, { method: "put", body, actorRole })
    : await request("/menu", { method: "post", body, actorRole });

  return toMenuItem(payload.menuItem);
}

export async function deleteMenuItem(branchId, id, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  await request(`/menu/${id}`, { method: "delete", actorRole });
}

// The Active/Inactive toggle. Name kept so MenuManagement.jsx does not change,
// but it now sets is_active — whether the cafe still sells the item — not
// is_available, which tracks stock and is driven by inventory instead.
export async function setMenuAvailability(branchId, id, active, { actorRole } = {}) {
  assertRole(actorRole, availabilityRoles);
  await request(`/menu/${id}/status`, {
    method: "patch",
    body: { is_active: Boolean(active) },
    actorRole,
  });
}

// Stock-driven flag, for inventory and the POS to call later.
export async function setMenuStockAvailability(branchId, id, available, { actorRole } = {}) {
  assertRole(actorRole, availabilityRoles);
  await request(`/menu/${id}/availability`, {
    method: "patch",
    body: { is_available: Boolean(available) },
    actorRole,
  });
}

// ---------------------------------------------------------------------------
// Category writes
// ---------------------------------------------------------------------------

export async function saveMenuCategory(branchId, category, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);

  const name = category.name?.trim();
  if (!name) throw new Error("Enter a category name.");

  const body = {
    name,
    color: category.color ?? null,
    ...(category.status !== undefined ? { is_active: category.status !== "INACTIVE" } : {}),
  };

  const payload = category.id
    ? await request(`/menu/categories/${category.id}`, { method: "put", body, actorRole })
    : await request("/menu/categories", { method: "post", body, actorRole });

  return toCategory(payload.category);
}

export async function deleteMenuCategory(branchId, id, { actorRole, reassignToCategoryId } = {}) {
  assertRole(actorRole, ownerOnly);

  const query = reassignToCategoryId
    ? `?reassign_to=${encodeURIComponent(reassignToCategoryId)}`
    : "";

  await request(`/menu/categories/${id}${query}`, { method: "delete", actorRole });
}