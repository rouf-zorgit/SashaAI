import dotenv from 'dotenv'
import dns from 'dns'
dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
try {
    const hostname = new URL(url).hostname
    console.log(`Hostname: ${hostname}`)

    dns.lookup(hostname, (err, address) => {
        if (err) {
            console.error('❌ DNS Lookup Failed:', err.code)
        } else {
            console.log(`✅ DNS Lookup Success: ${address}`)
        }
    })
} catch (e) {
    console.error('❌ Invalid URL format:', url)
}
