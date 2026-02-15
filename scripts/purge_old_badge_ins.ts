#!/usr/bin/env tsx
/**
 * One-time script to delete badge-ins from Season 1 that predate July 2025.
 * Usage: DATABASE_URL="..." npx tsx scripts/purge_old_badge_ins.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { badgeIns } from "../drizzle/schema";
import { eq, lt, and } from "drizzle-orm";

async function purge() {
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
        const SEASON_ID = 1;
        const CUTOFF = "2025-07-01";

        // Show what will be deleted
        const oldEntries = await db.select().from(badgeIns).where(
            and(eq(badgeIns.seasonId, SEASON_ID), lt(badgeIns.badgeInDate, new Date(CUTOFF)))
        );
        console.log(`\n📊 Found ${oldEntries.length} badge-ins before ${CUTOFF}:`);
        for (const e of oldEntries) {
            console.log(`  ${e.badgeInDate} ${e.badgeInTime} ${e.passType} (manual=${e.isManual})`);
        }

        if (oldEntries.length === 0) {
            console.log("✅ Nothing to purge!");
        } else {
            await db.delete(badgeIns).where(
                and(eq(badgeIns.seasonId, SEASON_ID), lt(badgeIns.badgeInDate, new Date(CUTOFF)))
            );
            console.log(`\n✅ Deleted ${oldEntries.length} pre-season badge-ins`);
        }

        // Final count
        const remaining = await db.select().from(badgeIns).where(eq(badgeIns.seasonId, SEASON_ID));
        console.log(`📈 Remaining badge-ins in Season 1: ${remaining.length}`);

        console.log("\n🎉 Done!");
    } catch (error) {
        console.error("❌ Purge failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

purge();
