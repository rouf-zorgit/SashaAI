const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

if (envConfig.DIRECT_URL) {
    // Set DATABASE_URL to exactly match DIRECT_URL
    // This bypasses the pooler and uses port 5432
    const newDatabaseUrl = envConfig.DIRECT_URL;

    let content = fs.readFileSync(envPath, 'utf8');

    // Regex to replace DATABASE_URL line
    const regex = /^DATABASE_URL=.*$/m;
    if (regex.test(content)) {
        content = content.replace(regex, `DATABASE_URL="${newDatabaseUrl}"`);
    } else {
        content += `\nDATABASE_URL="${newDatabaseUrl}"`;
    }

    fs.writeFileSync(envPath, content);
    console.log('✅ Successfully switched DATABASE_URL to Direct Connection');
    console.log(`New URL: ${newDatabaseUrl.substring(0, 20)}...`);

} else {
    console.error('DIRECT_URL not found in .env');
}
