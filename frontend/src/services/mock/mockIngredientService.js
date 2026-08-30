import { getInventory } from "../inventoryService";

// Compatibility adapter for Menu Management while inventory remains UI-deferred.
export async function getMockIngredients(branchId) {
  return getInventory(branchId);
}
