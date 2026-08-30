const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(part => part.trim()))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
const files = fs.readdirSync('src/services').filter(f => f.endsWith('.js'));

async function run() {
  for (const f of files) {
    const content = fs.readFileSync('src/services/' + f, 'utf8');
    
    // Match normal single/double quote selects
    const regex = /\.from\(['"]([^'"]+)['"]\)\s*\.select\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const table = match[1];
      const select = match[2];
      const { error } = await supabase.from(table).select(select).limit(1);
      if (error) console.log(`[FAIL] ${f} -> ${table}: ${error.message}`);
      else console.log(`[OK] ${f} -> ${table}`);
    }

    // Match backtick selects
    const regex2 = /\.from\(['"]([^'"]+)['"]\)\s*\.select\([\s\S]*?`([\s\S]*?)`\)/g;
    while ((match = regex2.exec(content)) !== null) {
      const table = match[1];
      const select = match[2];
      const { error } = await supabase.from(table).select(select).limit(1);
      if (error) console.log(`[FAIL] ${f} -> ${table}: ${error.message}`);
      else console.log(`[OK] ${f} -> ${table}`);
    }
  }
}
run();
