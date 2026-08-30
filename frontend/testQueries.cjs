const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(part => part.trim()))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const queries = [
  { name: 'branchService.getBranches', table: 'branches', select: '*' },
  { name: 'menuService.categories', table: 'menu_categories', select: '*' },
  { name: 'menuService.items', table: 'menu_items', select: '*' },
  { name: 'menuService.recipes', table: 'recipes', select: 'id, menu_item_id' },
  { name: 'menuService.recipeIngredients', table: 'recipe_ingredients', select: '*, inventory_items(name)' },
  { name: 'inventoryService.branchInventory', table: 'branch_inventory', select: '*, inventory_items (*)' },
  { name: 'inventoryService.movements', table: 'inventory_movements', select: '*, inventory_items (*)' },
  { name: 'salesService.sales', table: 'sales', select: 'id, transaction_number, total, payment_method, created_at, profiles:staff_id (full_name), sale_items (quantity)' },
  { name: 'reportsService.sales', table: 'sales', select: '*, sale_items(*)' },
  { name: 'dashboardService.sales', table: 'sales', select: 'id, transaction_number, total, payment_method, created_at, profiles:staff_id (full_name), sale_items (quantity)' },
  { name: 'dashboardService.inventory', table: 'branch_inventory', select: 'quantity, inventory_items (id, name, reorder_level, inventory_categories (name), units (name))' },
  { name: 'reconciliationService.reconciliations', table: 'inventory_reconciliations', select: '*, inventory_items (*), profiles:performed_by (full_name)' }
];

async function runAll() {
  console.log('--- TESTING QUERIES ---');
  for (const q of queries) {
    const { error } = await supabase.from(q.table).select(q.select).limit(1);
    if (error) {
      console.log(`[FAIL] ${q.name}: ${error.message}`);
    } else {
      console.log(`[OK] ${q.name}`);
    }
  }
}

runAll();
