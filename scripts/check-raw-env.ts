import fs from 'fs'

const content = fs.readFileSync('.env.local', 'utf-8')
const lines = content.split('\n')
const urlLine = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL'))

if (urlLine) {
    console.log(`Raw URL Line: [${urlLine}]`)
} else {
    console.log('URL Line not found')
}
