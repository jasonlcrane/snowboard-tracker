#!/usr/bin/env tsx
/**
 * Run database migrations locally or against production
 * Usage: 
 *   Local: npm run migrate
 *   Production: DATABASE_URL="..." npm run migrate
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigrations() {
    console.log('🔄 Running database migrations...\n');

    try {
        // Run drizzle-kit migrate
        const { stdout, stderr } = await execAsync('npx drizzle-kit migrate');

        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);

        console.log('\n✅ Migrations completed successfully!');
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigrations();
