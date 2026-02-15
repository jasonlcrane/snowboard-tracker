#!/usr/bin/env tsx
/**
 * One-time script to fix season data:
 * 1. Rename Season 1 ("Season 2026") to "2025/2026 Season" and update start_date to 2025-07-01
 * 2. Move any badge_ins from orphaned seasons (5, 6) back to Season 1
 * 3. Delete orphaned seasons 5 and 6
 *
 * Usage: DATABASE_URL="..." npx tsx scripts/fix_seasons.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { seasons, badgeIns } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

async function fix() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is required");
        process.exit(1);
    }

    console.log("🔌 Connecting to database...");
    const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectTimeout: 20000,
    });
    const db = drizzle(pool);

    try {
        // Step 1: Show current state
        console.log("\n📊 Current seasons:");
        const allSeasons = await db.select().from(seasons);
        for (const s of allSeasons) {
            console.log(`  ID=${s.id} name="${s.name}" start=${s.startDate} status=${s.status}`);
        }

        // Step 2: Rename Season 1 and update start_date
        const TARGET_ID = 1;
        const TARGET_NAME = "2025/2026 Season";
        const TARGET_START = "2025-07-01";

        const [season1] = await db.select().from(seasons).where(eq(seasons.id, TARGET_ID)).limit(1);
        if (!season1) {
            console.error("❌ Season 1 not found! Cannot proceed.");
            process.exit(1);
        }

        console.log(`\n🔧 Renaming Season 1 from "${season1.name}" to "${TARGET_NAME}"...`);
        console.log(`   Updating start_date from "${season1.startDate}" to "${TARGET_START}"...`);
        await db.update(seasons).set({
            name: TARGET_NAME,
            startDate: TARGET_START as any,
        }).where(eq(seasons.id, TARGET_ID));
        console.log("✅ Season 1 updated");

        // Step 3: Move badge-ins from orphaned seasons to Season 1
        const orphanedIds = allSeasons
            .filter(s => s.id !== TARGET_ID)
            .map(s => s.id);

        if (orphanedIds.length > 0) {
            console.log(`\n🔄 Moving badge-ins from seasons [${orphanedIds.join(", ")}] to Season 1...`);

            // Get badge-ins already in Season 1 (to find duplicates)
            const season1BadgeIns = await db.select({
                date: badgeIns.badgeInDate,
                time: badgeIns.badgeInTime,
                isManual: badgeIns.isManual,
            }).from(badgeIns).where(eq(badgeIns.seasonId, TARGET_ID));

            const season1Keys = new Set(
                season1BadgeIns.map(b => `${b.date}|${b.time}|${b.isManual}`)
            );

            // Get orphaned badge-ins
            const orphanedBadgeIns = await db.select().from(badgeIns).where(inArray(badgeIns.seasonId, orphanedIds));
            console.log(`   Found ${orphanedBadgeIns.length} badge-ins in orphaned seasons`);

            // Split into duplicates and unique entries
            const duplicateIds: number[] = [];
            const uniqueIds: number[] = [];
            for (const b of orphanedBadgeIns) {
                const key = `${b.badgeInDate}|${b.badgeInTime}|${b.isManual}`;
                if (season1Keys.has(key)) {
                    duplicateIds.push(b.id);
                } else {
                    uniqueIds.push(b.id);
                }
            }

            console.log(`   ${duplicateIds.length} duplicates (will delete), ${uniqueIds.length} unique (will move)`);

            // Delete duplicates
            if (duplicateIds.length > 0) {
                await db.delete(badgeIns).where(inArray(badgeIns.id, duplicateIds));
                console.log(`✅ Deleted ${duplicateIds.length} duplicate badge-ins`);
            }

            // Move unique entries to Season 1
            if (uniqueIds.length > 0) {
                await db.update(badgeIns).set({ seasonId: TARGET_ID }).where(inArray(badgeIns.id, uniqueIds));
                console.log(`✅ Moved ${uniqueIds.length} unique badge-ins to Season 1`);
            }

            // Step 4: Delete orphaned seasons
            console.log(`\n🗑️  Deleting orphaned seasons [${orphanedIds.join(", ")}]...`);
            for (const id of orphanedIds) {
                await db.delete(seasons).where(eq(seasons.id, id));
                console.log(`   Deleted season ${id}`);
            }
            console.log("✅ Orphaned seasons deleted");
        } else {
            console.log("\n✅ No orphaned seasons found");
        }

        // Step 5: Verify final state
        console.log("\n📊 Final seasons state:");
        const finalSeasons = await db.select().from(seasons);
        for (const s of finalSeasons) {
            console.log(`  ID=${s.id} name="${s.name}" start=${s.startDate} status=${s.status}`);
        }

        const finalBadgeIns = await db.select().from(badgeIns).where(eq(badgeIns.seasonId, TARGET_ID));
        console.log(`\n📈 Total badge-ins in Season 1: ${finalBadgeIns.length}`);

        console.log("\n🎉 Fix complete!");
    } catch (error) {
        console.error("❌ Fix failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fix();
