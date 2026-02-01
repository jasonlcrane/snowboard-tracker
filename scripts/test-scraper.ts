import { scrapeThreeRiversParks } from '../server/scraper';
import { encryptData } from '../server/utils';
import "dotenv/config";

/**
 * Manual Scraper Test Script
 * 
 * Usage:
 * 1. Create a .env file with ENCRYPTION_KEY if not present
 * 2. Run: npx tsx scripts/test-scraper.ts <username> <password>
 */

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: npx tsx scripts/test-scraper.ts <username> <password>');
        process.exit(1);
    }

    const [username, password] = args;

    console.log('--- Starting Manual Scraper Test ---');
    console.log('Encrypting provided credentials...');

    // Mock credential ID for testing
    const MOCK_CREDENTIAL_ID = 999;

    // We need to verify utils.ts has encryptData
    // Assuming it does based on scraper usage of decryptData

    try {
        const encryptedUsername = encryptData(username);
        const encryptedPassword = encryptData(password);

        console.log('Calling scraper service...');

        const result = await scrapeThreeRiversParks(
            encryptedUsername,
            encryptedPassword,
            MOCK_CREDENTIAL_ID
        );

        console.log('\n--- Test Results ---');
        console.log('Success:', result.success);
        console.log('Found:', result.badgeInsFound);
        console.log('Added:', result.badgeInsAdded);

        if (result.error) {
            console.error('Error:', result.error);
        }

    } catch (error) {
        console.error('Test execution failed:', error);
    }
}

main();
