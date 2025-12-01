
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment Check:')
console.log('URL:', supabaseUrl ? 'Set ✅' : 'Missing ❌')
console.log('Key:', supabaseKey ? 'Set ✅' : 'Missing ❌')

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
    console.log('\n🔍 Checking database setup...')

    // 1. Check messages table
    console.log('Checking messages table...')
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .limit(1)

    if (messagesError) {
        console.error('❌ Error accessing messages table:', messagesError.message)
        console.error('Details:', messagesError)
    } else {
        console.log('✅ Messages table exists and is accessible')
    }

    // 2. Check session_id column
    console.log('\nChecking session_id column...')
    // We try to select the column specifically
    const { data: sessionData, error: sessionError } = await supabase
        .from('messages')
        .select('session_id')
        .limit(1)

    if (sessionError) {
        console.error('❌ Error accessing session_id column:', sessionError.message)
        console.log('⚠️ The session_id column is likely MISSING.')
    } else {
        console.log('✅ session_id column exists')
    }

    // 3. Try to insert a test message (if authenticated)
    // Since we are using anon key, we might not be able to insert without a user session.
    // But we can check if the table allows inserts generally if we had a user.

    console.log('\n🏁 Database check complete.')
}

checkDatabase()
