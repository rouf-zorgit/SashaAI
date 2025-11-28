import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!url) {
    console.error('No URL found')
    process.exit(1)
}

console.log(`Testing connection to: ${url}`)

async function checkHealth() {
    try {
        const start = Date.now()
        // Try to fetch the health endpoint (or just the root)
        const res = await fetch(`${url}/auth/v1/health`)
        console.log(`Status: ${res.status}`)
        console.log(`Time: ${Date.now() - start}ms`)

        if (res.ok) {
            console.log('✅ Supabase is reachable!')
        } else {
            console.log('❌ Supabase returned error:', res.statusText)
        }
    } catch (err) {
        const error = err as Error & { cause?: unknown }
        console.error('❌ Fetch Failed:', error.cause || error)
    }
}

checkHealth()
