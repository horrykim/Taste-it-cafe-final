const menuDataByBranch = {
  babag: {
    categories: [
      { id: "burgers", name: "Burgers", status: "ACTIVE" },
      { id: "meals", name: "Meals", status: "ACTIVE" },
      { id: "pastries", name: "Pastries", status: "ACTIVE" },
      { id: "drinks", name: "Drinks", status: "ACTIVE" },
      { id: "combos", name: "Combos", status: "ACTIVE" },
    ],
    items: [
      { id: "bab-classic-burger", name: "Classic Burger", categoryId: "burgers", price: 145, description: "A grilled beef patty with fresh greens and house sauce.", status: "ACTIVE", branchIds: ["babag"], recipeId: "recipe-classic-burger" },
      { id: "bab-chicken-sandwich", name: "Chicken Sandwich", categoryId: "burgers", price: 165, description: "Crispy chicken, lettuce, and signature dressing in a toasted bun.", status: "ACTIVE", branchIds: ["babag"], recipeId: "recipe-chicken-sandwich" },
      { id: "bab-combo-meal", name: "Classic Burger Combo", categoryId: "combos", price: 220, description: "Classic Burger served with fries and a chilled drink.", status: "ACTIVE", branchIds: ["babag"], recipeId: "recipe-classic-combo" },
      { id: "bab-ube-pandesal", name: "Ube Cheese Pandesal", categoryId: "pastries", price: 85, description: "Soft ube-filled bread with a creamy cheese center.", status: "INACTIVE", branchIds: ["babag"], recipeId: "recipe-ube-pandesal" },
      { id: "bab-iced-latte", name: "Iced Latte", categoryId: "drinks", price: 130, description: "Cold espresso and milk over ice.", status: "ACTIVE", branchIds: ["babag"], recipeId: "recipe-iced-latte" },
    ],
  },
  marigondon: {
    categories: [
      { id: "burgers", name: "Burgers", status: "ACTIVE" },
      { id: "meals", name: "Meals", status: "ACTIVE" },
      { id: "b1t1", name: "B1T1", status: "ACTIVE" },
      { id: "pastries", name: "Pastries", status: "ACTIVE" },
      { id: "drinks", name: "Drinks", status: "ACTIVE" },
    ],
    items: [
      { id: "mar-double-burger", name: "Double Burger", categoryId: "burgers", price: 195, description: "Two grilled patties with cheese, greens, and house sauce.", status: "ACTIVE", branchIds: ["marigondon"], recipeId: "recipe-double-burger" },
      { id: "mar-b1t1-burger", name: "B1T1 Burger", categoryId: "b1t1", price: 250, description: "Two classic burgers prepared as one value menu item.", status: "ACTIVE", branchIds: ["marigondon"], recipeId: "recipe-b1t1-burger" },
      { id: "mar-chicken-meal", name: "Chicken Meal", categoryId: "meals", price: 185, description: "Crispy chicken with rice and a refreshing drink.", status: "ACTIVE", branchIds: ["marigondon"], recipeId: "recipe-chicken-meal" },
      { id: "mar-brownie", name: "Chocolate Brownie", categoryId: "pastries", price: 95, description: "Rich, fudgy chocolate brownie baked in small batches.", status: "ACTIVE", branchIds: ["marigondon"], recipeId: "recipe-brownie" },
      { id: "mar-fruit-tea", name: "Passion Fruit Tea", categoryId: "drinks", price: 120, description: "Bright passion fruit tea served cold.", status: "INACTIVE", branchIds: ["marigondon"], recipeId: "recipe-fruit-tea" },
    ],
  },
};

export async function getMockMenuData(branchId) {
  const data = menuDataByBranch[branchId];
  if (!data) throw new Error("Menu data is unavailable for this branch.");
  return structuredClone(data);
}