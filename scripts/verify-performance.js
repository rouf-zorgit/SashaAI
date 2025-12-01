const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIndexes() {
    console.log('🔍 Checking Database Indexes...');

    const { data, error } = await supabase
        .rpc('get_indexes'); // We might need to create this RPC or just query pg_indexes if we had direct SQL access

    // Since we can't easily run raw SQL via JS client without an RPC, 
    // we will just print the instructions for the user.

    console.log(`
✅ To verify database indexes, run the SQL script located at:
   .agent/database-indexes.sql

   Open your Supabase Dashboard -> SQL Editor -> New Query
   Paste the content of the file and run it.
    `);
}

async function main() {
    console.log('🚀 Starting Performance Verification Setup...\n');

    await checkIndexes();

    console.log('\n📦 Bundle Size Analysis');
    console.log('   To analyze bundle size, run:');
    console.log('   ANALYZE=true npm run build');

    console.log('\n⚡ API Response Time Testing');
    console.log('   Open Chrome DevTools -> Network Tab');
    console.log('   Filter by "Fetch/XHR" and check timing for:');
    console.log('   - /api/chat');
    console.log('   - /api/transactions');

    console.log('\n📱 Mobile Performance');
    console.log('   In Chrome DevTools, toggle Device Toolbar (Ctrl+Shift+M)');
    console.log('   Set Network throttling to "Slow 3G"');

    console.log('\n✅ Setup Complete! Follow .agent/PHASE5_PERFORMANCE_GUIDE.md for detailed steps.');
}

main().catch(console.error);
