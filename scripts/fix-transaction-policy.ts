/**
 * Script to fix the transaction UPDATE RLS policy
 * Run this with: npx tsx scripts/fix-transaction-policy.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables')
    console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function fixTransactionPolicy() {
    console.log('🔧 Fixing transaction UPDATE policy...')

    // Drop existing policy
    const dropQuery = `
        DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
    `

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropQuery })

    if (dropError) {
        console.error('❌ Error dropping policy:', dropError)
    } else {
        console.log('✅ Old policy dropped')
    }

    // Create new policy with WITH CHECK
    const createQuery = `
        CREATE POLICY "Users can update own transactions" 
        ON transactions 
        FOR UPDATE 
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    `

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createQuery })

    if (createError) {
        console.error('❌ Error creating policy:', createError)
        process.exit(1)
    }

    console.log('✅ Transaction UPDATE policy fixed!')
    console.log('You can now edit transactions in the app.')
}

fixTransactionPolicy()
