export function getInventoryStatus({ currentQuantity, lowStockThreshold, outOfStockThreshold = 0 }) {
  if (currentQuantity <= outOfStockThreshold) return "out-of-stock";
  if (currentQuantity <= lowStockThreshold) return "low-stock";
  return "normal";
}
