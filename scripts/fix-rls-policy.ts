import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixPolicy() {
    console.log('🔧 Fixing transaction UPDATE RLS policy...')
    console.log('')
    console.log('Please run this SQL in your Supabase Dashboard → SQL Editor:')
    console.log('')
    console.log('```sql')
    console.log('DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;')
    console.log('')
    console.log('CREATE POLICY "Users can update own transactions"')
    console.log('ON transactions')
    console.log('FOR UPDATE')
    console.log('USING (auth.uid() = user_id)')
    console.log('WITH CHECK (auth.uid() = user_id);')
    console.log('```')
    console.log('')
    console.log('After running the SQL, try editing a transaction again.')
}

fixPolicy()
