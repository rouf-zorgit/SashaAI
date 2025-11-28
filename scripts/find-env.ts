import fs from 'fs'

function checkFile(path: string) {
    if (!fs.existsSync(path)) {
        console.log(`${path} does not exist`)
        return
    }
    console.log(`Checking ${path}...`)
    const content = fs.readFileSync(path, 'utf-8')
    const lines = content.split('\n')
    lines.forEach(line => {
        if (line.includes('SUPABASE_URL')) {
            console.log(`Found: [${line.trim()}]`)
        }
    })
}

checkFile('.env.local')
checkFile('.env')
