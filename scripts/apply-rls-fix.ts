/**
 * Direct fix for transaction UPDATE RLS policy
 * This script connects to your Supabase database and fixes the policy directly
 * 
 * Run: npx tsx scripts/apply-rls-fix.ts
 */

import { createClient } from '@supabase/supabase-js'

// You need to get these from your Supabase dashboard
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables!')
    console.error('Make sure you have:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function fixRLSPolicy() {
    console.log('🔧 Fixing transaction UPDATE RLS policy...\n')

    const sql = `
        -- Drop existing policy
        DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
        
        -- Create policy with both USING and WITH CHECK
        CREATE POLICY "Users can update own transactions" 
        ON transactions 
        FOR UPDATE 
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    `

    try {
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql })

        if (error) {
            console.error('❌ Error:', error.message)
            console.error('\nThe exec_sql function might not exist.')
            console.error('Please run this SQL manually in Supabase Dashboard → SQL Editor:\n')
            console.error(sql)
            process.exit(1)
        }

        console.log('✅ RLS policy fixed successfully!')
        console.log('\nYou can now edit transactions in your app.')

    } catch (err: any) {
        console.error('❌ Unexpected error:', err.message)
        console.error('\nPlease run this SQL manually in Supabase Dashboard → SQL Editor:\n')
        console.error(sql)
        process.exit(1)
    }
}

fixRLSPolicy()
