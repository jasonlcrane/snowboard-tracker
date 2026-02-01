#!/usr/bin/env tsx
/**
 * Backfill historical weather data for all badge-in dates
 * Run: DATABASE_URL="..." npx tsx scripts/backfill-weather.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { getActiveSeason } from "../server/db";
import { fetchHistoricalWeather } from "../server/weather-api";
import { weatherCache } from "../drizzle/schema";

async function backfillWeather() {
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
        // Get active season
        const season = await getActiveSeason();
        if (!season) {
            console.error("❌ No active season found");
            process.exit(1);
        }

        const startDate = new Date(season.startDate);
        const today = new Date();

        console.log(`📅 Fetching weather data from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);

        // Fetch historical weather
        const weatherData = await fetchHistoricalWeather(
            startDate.toISOString().split('T')[0],
            today.toISOString().split('T')[0]
        );

        console.log(`📊 Fetched ${weatherData.length} days of weather data`);

        // Insert into database
        let inserted = 0;
        let updated = 0;

        for (const day of weatherData) {
            try {
                await db.insert(weatherCache).values({
                    date: day.date,
                    tempHigh: day.tempHigh.toString(),
                    tempLow: day.tempLow.toString(),
                    snowfall: day.snowfall.toString(),
                    conditions: day.conditions,
                    source: "open-meteo",
                }).onDuplicateKeyUpdate({
                    set: {
                        tempHigh: day.tempHigh.toString(),
                        tempLow: day.tempLow.toString(),
                        snowfall: day.snowfall.toString(),
                        conditions: day.conditions,
                        updatedAt: new Date(),
                    },
                });
                inserted++;
            } catch (error) {
                updated++;
            }
        }

        console.log(`✅ Backfill complete!`);
        console.log(`   Inserted: ${inserted} days`);
        console.log(`   Updated: ${updated} days`);

    } catch (error) {
        console.error("❌ Backfill failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

backfillWeather();
