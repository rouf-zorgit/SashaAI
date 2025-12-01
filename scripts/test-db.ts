import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env vars
dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('--- Supabase Connection Test ---')
console.log(`URL Configured: ${url ? 'YES' : 'NO'}`)
console.log(`Key Configured: ${key ? 'YES' : 'NO'}`)

if (url) {
    console.log(`URL Value: ${url}`)
}

if (!url || !key) {
    console.error('❌ Missing environment variables!')
    process.exit(1)
}

const supabase = createClient(url, key)

async function testConnection() {
    try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        if (error) {
            console.error('❌ Connection Failed:', error.message)
        } else {
            console.log('✅ Connection Successful!')
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err)
    }
}

testConnection()
