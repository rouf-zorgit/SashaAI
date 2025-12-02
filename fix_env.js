const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

if (envConfig.DIRECT_URL) {
    try {
        const directUrl = new URL(envConfig.DIRECT_URL);
        const password = directUrl.password;
        const host = directUrl.host; // includes port if present, but usually directUrl has :5432
        const hostname = directUrl.hostname; // just the domain

        // Construct new DATABASE_URL
        // Use the same hostname as DIRECT_URL, but port 6543 and pgbouncer=true
        // Username should be 'postgres' (standard for direct host connection)
        const newDatabaseUrl = `postgresql://postgres:${password}@${hostname}:6543/postgres?pgbouncer=true`;

        // Update the file content
        let content = fs.readFileSync(envPath, 'utf8');

        // Regex to replace DATABASE_URL line
        const regex = /^DATABASE_URL=.*$/m;
        if (regex.test(content)) {
            content = content.replace(regex, `DATABASE_URL="${newDatabaseUrl}"`);
        } else {
            content += `\nDATABASE_URL="${newDatabaseUrl}"`;
        }

        fs.writeFileSync(envPath, content);
        console.log('✅ Successfully updated DATABASE_URL in .env');
        console.log(`New Host: ${hostname}:6543`);
        console.log('User: postgres');

    } catch (error) {
        console.error('Error parsing DIRECT_URL:', error);
    }
} else {
    console.error('DIRECT_URL not found in .env');
}
