#!/usr/bin/env tsx
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { seasons, badgeIns } from "../drizzle/schema";
import { eq, asc } from "drizzle-orm";

async function fix() {
    const pool = mysql.createPool({
        uri: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: false },
        connectTimeout: 20000,
    });
    const db = drizzle(pool);

    try {
        // Find the earliest badge-in in Season 1
        const [earliest] = await db.select({ date: badgeIns.badgeInDate })
            .from(badgeIns)
            .where(eq(badgeIns.seasonId, 1))
            .orderBy(asc(badgeIns.badgeInDate))
            .limit(1);

        console.log(`📅 Earliest badge-in: ${earliest?.date}`);

        if (earliest) {
            await db.update(seasons).set({
                startDate: earliest.date,
            }).where(eq(seasons.id, 1));
            console.log(`✅ Updated Season 1 start_date to ${earliest.date}`);
        }

        const [season] = await db.select().from(seasons).where(eq(seasons.id, 1));
        console.log(`📊 Season 1: name="${season.name}" start=${season.startDate}`);
    } finally {
        await pool.end();
    }
}

fix();
