#!/usr/bin/env tsx
/**
 * One-time script to fix the season start date
 * Run: DATABASE_URL="..." npx tsx scripts/fix-season-date.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { seasons } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function fixSeasonDate() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is required");
        process.exit(1);
    }

    console.log("🔌 Connecting to database...");
    const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });
    const db = drizzle(pool);

    try {
        // Find active season
        const [activeSeason] = await db.select().from(seasons).where(eq(seasons.status, "active")).limit(1);

        if (!activeSeason) {
            console.error("❌ No active season found");
            process.exit(1);
        }

        console.log(`📅 Current season: ${activeSeason.name}`);
        console.log(`   Start date: ${activeSeason.startDate}`);

        // Update to correct date
        const correctStartDate = new Date(2025, 11, 1); // December 1, 2025

        await db.update(seasons)
            .set({
                startDate: correctStartDate,
                name: "Season 2026"
            })
            .where(eq(seasons.id, activeSeason.id));

        console.log("✅ Season updated!");
        console.log(`   New start date: ${correctStartDate.toISOString().split('T')[0]}`);
        console.log(`   New name: Season 2026`);
        console.log("\n🎉 Refresh your dashboard to see corrected calculations!");

    } catch (error) {
        console.error("❌ Fix failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixSeasonDate();
