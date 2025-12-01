import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
if (!url.startsWith('https://')) {
    console.log('MISSING_PROTOCOL')
} else {
    console.log('PROTOCOL_OK')
}
