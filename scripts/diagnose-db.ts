import { getDb } from '../server/db';
import { sql } from 'drizzle-orm';

async function diagnose() {
    const db = await getDb();
    if (!db) {
        console.error('Failed to connect to database');
        return;
    }

    console.log('--- DATABASE DIAGNOSTIC ---');

    try {
        // Check table structure and indexes
        console.log('\n1. Checking badge_ins table structure and indexes:');
        const indexesRes = await db.execute(sql`SHOW INDEX FROM badge_ins`);
        const indexes = indexesRes[0] as any[];
        console.table(indexes.map(idx => ({
            Table: idx.Table,
            Non_unique: idx.Non_unique,
            Key_name: idx.Key_name,
            Column_name: idx.Column_name
        })));

        // Check for NULL values in badge_in_time
        console.log('\n2. Checking for NULL or empty values in badge_in_time:');
        const nullStatsRes = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN badge_in_time IS NULL THEN 1 ELSE 0 END) as null_count,
        SUM(CASE WHEN badge_in_time = '' THEN 1 ELSE 0 END) as empty_count
      FROM badge_ins
    `);
        console.table(nullStatsRes[0]);

        // Sample data
        console.log('\n3. Sampling recent entries:');
        const sampleRes = await db.execute(sql`
      SELECT id, season_id, badge_in_date, badge_in_time, is_manual, created_at
      FROM badge_ins
      ORDER BY created_at DESC
      LIMIT 10
    `);
        console.table(sampleRes[0]);

    } catch (err) {
        console.error('Diagnostic failed:', err);
    }

    process.exit(0);
}

diagnose().catch(err => {
    console.error('Diagnostic failed:', err);
    process.exit(1);
});
