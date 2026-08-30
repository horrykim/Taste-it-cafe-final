import { supabase } from "./supabase";

const ownerOnly = new Set(["owner", "OWNER"]);
const availabilityRoles = new Set(["owner", "OWNER", "staff", "STAFF"]);

function assertRole(actorRole, roles) {
  if (!roles.has(actorRole)) {
    throw new Error("You do not have permission for this menu action.");
  }
}

// Maps menu category
function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    status: row.is_active ? "ACTIVE" : "INACTIVE",
    description: row.description,
  };
}

// Maps menu item
function mapMenuItem(row) {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    price: Number(row.price),
    description: row.description || "",
    imageUrl: row.image_path || null,
    status: row.is_active ? "ACTIVE" : "INACTIVE",
    available: row.is_active,
    // Recipe is populated separately if needed, or joined if possible.
    // For now, we return empty recipe here and let getRecipeIngredients handle it,
    // or we fetch it in a separate call. The mock attached `recipe` directly.
    recipe: [], 
  };
}

export const getMenuData = getMockMenuData;
export async function getMockMenuData(branchId) {
  // 1. Fetch categories
  const { data: categoriesData, error: categoriesError } = await supabase
    .from("menu_categories")
    .select("*")
    .order("name");

  if (categoriesError) {
    console.error("Supabase getMenuCategories Error:", categoriesError);
    throw new Error("Could not fetch menu categories.");
  }

  // 2. Fetch menu items
  const { data: itemsData, error: itemsError } = await supabase
    .from("menu_items")
    .select("*");

  if (itemsError) {
    console.error("Supabase getMenuItems Error:", itemsError);
    throw new Error("Could not fetch menu items.");
  }

  // Note: Since Menu Items are GLOBAL in the DB schema, we return the same items for all branches.
  // We attach `branchId` to the frontend objects just to satisfy legacy mock-dependent components for now.
  const mappedCategories = (categoriesData || []).map(mapCategory);
  const mappedItems = (itemsData || []).map(item => ({
    ...mapMenuItem(item),
    branchId: branchId,
    // Attempting to mock recipeId for now
    recipeId: `recipe-${item.id}`
  }));

  // We could fetch recipes here too, but to avoid N+1 queries, we fetch all recipes
  const { data: recipesData } = await supabase.from("recipes").select("id, menu_item_id");
  const { data: recipeIngredientsData } = await supabase.from("recipe_ingredients").select("*, inventory_items(name)");
  
  if (recipesData && recipeIngredientsData) {
    for (const item of mappedItems) {
      const recipe = recipesData.find(r => r.menu_item_id === item.id);
      if (recipe) {
        item.recipeId = recipe.id;
        item.recipe = recipeIngredientsData
          .filter(ri => ri.recipe_id === recipe.id)
          .map(ri => ({
            ingredientId: ri.inventory_item_id,
            quantity: Number(ri.quantity),
            unit: "unit", // We don't have unit names easily joined here without more complex query
            name: ri.inventory_items?.name
          }));
      }
    }
  }

  return {
    categories: mappedCategories,
    items: mappedItems,
  };
}

export async function saveMenuItem(branchId, item, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  
  // Requires RPC because it involves inserting a menu_item, a recipe, and recipe_ingredients atomically.
  throw new Error("RPC Required: Creating/updating a menu item with its recipe ingredients requires an atomic transaction. Operation blocked.");
}

export async function deleteMenuItem(branchId, id, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) {
    console.error("Supabase deleteMenuItem Error:", error);
    throw new Error("Could not delete menu item.");
  }
}

export async function setMenuAvailability(branchId, id, available, { actorRole } = {}) {
  assertRole(actorRole, availabilityRoles);
  const { data, error } = await supabase
    .from("menu_items")
    .update({ is_active: available, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Supabase setMenuAvailability Error:", error);
    throw new Error("Could not update menu item availability.");
  }

  return { ...mapMenuItem(data), branchId };
}

export async function saveMenuCategory(branchId, category, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  const { data, error } = await supabase
    .from("menu_categories")
    .upsert({
      id: category.id || undefined,
      name: category.name.trim(),
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("Supabase saveMenuCategory Error:", error);
    throw new Error("Could not save menu category.");
  }

  return mapCategory(data);
}

export async function deleteMenuCategory(branchId, id, { actorRole } = {}) {
  assertRole(actorRole, ownerOnly);
  const { error } = await supabase.from("menu_categories").delete().eq("id", id);
  if (error) {
    console.error("Supabase deleteMenuCategory Error:", error);
    throw new Error("Could not delete menu category.");
  }
}
