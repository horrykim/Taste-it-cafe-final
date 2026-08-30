const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest(tableName, selectStr = '*') {
  const { data, error } = await supabase.from(tableName).select(selectStr).limit(1);
  if (error) {
    console.log(`[FAIL] ${tableName}: ${error.code} - ${error.message}`);
  } else {
    console.log(`[OK] ${tableName}: returned ${data.length} rows`);
  }
}

async function diagnose() {
  console.log('--- SUPABASE ANON READ-ONLY DIAGNOSIS ---');
  const tables = [
    'profiles', 'branches', 'inventory_categories', 'inventory_items', 
    'branch_inventory', 'menu_categories', 'menu_items', 'recipes', 
    'recipe_ingredients', 'sales', 'sale_items', 'inventory_reconciliations', 
    'inventory_movements', 'notifications', 'reports', 'ai_business_reports'
  ];
  for (const t of tables) {
    await runTest(t);
  }
}

diagnose();
