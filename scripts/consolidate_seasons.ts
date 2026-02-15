
import "dotenv/config";
import { getDb } from "../server/db";
import { seasons, badgeIns } from "../drizzle/schema";
import { eq, ne, inArray, sql } from "drizzle-orm";

async function consolidate() {
    const db = await getDb();
    if (!db) {
        console.error("Database connection failed.");
        return;
    }

    const TARGET_SEASON_ID = 1;

    console.log(`\n--- Season Consolidation Started ---`);

    // 1. Ensure Season 1 exists and is active
    console.log(`Step 1: Ensuring Season 1 is active...`);
    const season1 = await db.select().from(seasons).where(eq(seasons.id, TARGET_SEASON_ID)).limit(1);
    if (!season1.length) {
        console.log("  Season 1 not found! Creating it...");
        await db.insert(seasons).values({
            id: TARGET_SEASON_ID,
            name: "2025/2026 Season",
            startDate: "2025-07-01",
            status: "active",
            goal: 50
        } as any);
    } else {
        await db.update(seasons).set({ status: 'active' }).where(eq(seasons.id, TARGET_SEASON_ID));
    }

    // 2. Get all badge-ins NOT in Season 1
    console.log(`Step 2: Finding records to migrate...`);
    const recordsToMove = await db.select().from(badgeIns).where(ne(badgeIns.seasonId, TARGET_SEASON_ID));
    console.log(`  Found ${recordsToMove.length} records to consolidate.`);

    let moved = 0;
    let deleted = 0;
    let failed = 0;

    for (const record of recordsToMove) {
        try {
            // Try to update seasonId to 1
            await db.update(badgeIns)
                .set({ seasonId: TARGET_SEASON_ID })
                .where(eq(badgeIns.id, record.id));
            moved++;
        } catch (error: any) {
            // Check for duplicate entry - Drizzle/MySQL2 often wraps errors or uses different codes
            const isDuplicate =
                error.code === 'ER_DUP_ENTRY' ||
                error.message?.includes('Duplicate entry') ||
                error.cause?.code === 'ER_DUP_ENTRY';

            if (isDuplicate) {
                // Duplicate entry found in Season 1, delete this one
                console.log(`  Duplicate found for record ${record.id} (${record.badgeInDate}). Deleting...`);
                await db.delete(badgeIns).where(eq(badgeIns.id, record.id));
                deleted++;
            } else {
                console.error(`  Failed to migrate record ${record.id}:`, error.message);
                failed++;
            }
        }
    }

    // 3. Purge pre-July 2025 data from Season 1 (and potentially others before final cleanup)
    console.log(`Step 3: Purging historical data (pre-July 1, 2025)...`);
    const purgeResult = await db.delete(badgeIns).where(
        sql`${badgeIns.badgeInDate} < '2025-07-01'`
    );
    console.log(`  Purged ${purgeResult[0].affectedRows} historical records.`);

    // 4. Delete other seasons
    console.log(`Step 4: Removing redundant seasons...`);
    const deleteResult = await db.delete(seasons).where(ne(seasons.id, TARGET_SEASON_ID));
    console.log(`  Cleaned up redundant seasons.`);

    console.log("\n--- Consolidation Completed ---");
    process.exit(0);
}

consolidate().catch(err => {
    console.error("Consolidation failed:", err);
    process.exit(1);
});
