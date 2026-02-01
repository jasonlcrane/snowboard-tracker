import { getDb } from '../server/db';
import { badgeIns } from '../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

async function cleanup() {
    const db = await getDb();
    if (!db) {
        console.error('Failed to connect to database');
        return;
    }

    console.log('Finding duplicates in badgeIns...');

    try {
        // Query to find rows that have duplicates
        const res = await db.execute(sql`
      SELECT season_id, badge_in_date, badge_in_time, is_manual, COUNT(*) as count, MIN(id) as keep_id
      FROM badge_ins
      GROUP BY season_id, badge_in_date, badge_in_time, is_manual
      HAVING count > 1
    `);

        const duplicateRows = res[0] as any[];

        if (!duplicateRows || duplicateRows.length === 0) {
            console.log('No duplicates found!');
            return;
        }

        console.log(`Found ${duplicateRows.length} sets of duplicates.`);

        let totalDeleted = 0;
        for (const group of duplicateRows) {
            const { season_id, badge_in_date, badge_in_time, is_manual, keep_id } = group;

            console.log(`Cleaning up ${group.count} duplicates for ${badge_in_date} ${badge_in_time || ''}`);

            // Delete all except the one with keep_id
            const deleteResult = await db.delete(badgeIns).where(
                and(
                    eq(badgeIns.seasonId, season_id),
                    eq(badgeIns.badgeInDate, badge_in_date),
                    badge_in_time ? eq(badgeIns.badgeInTime, badge_in_time) : sql`${badgeIns.badgeInTime} IS NULL`,
                    eq(badgeIns.isManual, is_manual),
                    sql`id != ${keep_id}`
                )
            );

            totalDeleted += (Number(group.count) - 1);
        }

        console.log(`Cleanup complete! Total duplicates removed: ${totalDeleted}`);
    } catch (err) {
        console.error('Error during cleanup:', err);
    }

    process.exit(0);
}

cleanup().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
