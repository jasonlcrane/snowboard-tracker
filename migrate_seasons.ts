
import "dotenv/config";
import { getDb } from "./server/db";
import { seasons, badgeIns } from "./drizzle/schema";
import { eq, inArray, lt } from "drizzle-orm";

async function migrate() {
    const db = await getDb();
    if (!db) {
        console.error("Database connection failed.");
        return;
    }

    const targetSeasonId = 1;
    const duplicateIds = [2, 3];
    const cutOffDate = "2025-07-01";

    console.log(`\n--- Production Migration Started: Consolidation and Cleanup ---`);

    // 1. Delete historical data from BEFORE July 2025 (all seasons)
    console.log(`Step 1: Purging all data before ${cutOffDate}...`);
    const purgeResult = await db.delete(badgeIns).where(lt(badgeIns.badgeInDate, cutOffDate));
    console.log(`  Purge complete.`);

    // 2. Get all remaining badge-ins from duplicate seasons (IDs 2, 3)
    console.log(`Step 2: Processing remaining data in seasons ${duplicateIds.join(', ')}...`);
    const badgeInsToMove = await db.select().from(badgeIns).where(inArray(badgeIns.seasonId, duplicateIds));
    console.log(`  Found ${badgeInsToMove.length} badge-ins to consolidate.`);

    let moved = 0;
    let deleted = 0;
    let failed = 0;

    for (const item of badgeInsToMove) {
        try {
            // Try to reassign to season 1
            await db.update(badgeIns).set({ seasonId: targetSeasonId }).where(eq(badgeIns.id, item.id));
            moved++;
        } catch (error: any) {
            if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
                // Already exists in season 1, delete the extra copy
                await db.delete(badgeIns).where(eq(badgeIns.id, item.id));
                deleted++;
            } else {
                console.error(`  Unexpected error for ID ${item.id}:`, error.message);
                failed++;
            }
        }
    }

    console.log(`  Consolidation summary: Moved ${moved}, removed ${deleted} duplicates, failed ${failed}.`);

    // 3. Cleanup duplicate seasons
    console.log(`Step 3: Cleaning up duplicate season records...`);
    await db.update(seasons)
        .set({ status: 'completed' })
        .where(inArray(seasons.id, duplicateIds));
    console.log(`  Duplicate seasons marked as completed.`);

    console.log("\n--- Migration Fully Completed ---");
    process.exit(0);
}

migrate().catch(console.error);
