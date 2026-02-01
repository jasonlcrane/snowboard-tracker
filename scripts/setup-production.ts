#!/usr/bin/env tsx
/**
 * One-time setup script to initialize the database with a season and grant admin access
 * Run this after deploying to production: DATABASE_URL="..." npx tsx scripts/setup-production.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, seasons } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function setup() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is required");
        process.exit(1);
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.error("❌ ADMIN_EMAIL is required (e.g., ADMIN_EMAIL=you@gmail.com)");
        process.exit(1);
    }

    console.log("🔌 Connecting to database...");
    const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });
    const db = drizzle(pool);

    try {
        // 1. Find user by email and grant admin role
        console.log(`👤 Looking for user with email: ${adminEmail}`);
        const [user] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

        if (!user) {
            console.error(`❌ No user found with email: ${adminEmail}`);
            console.log("💡 Make sure you've logged in at least once via Google OAuth");
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);

        if (user.role !== "admin") {
            console.log("🔧 Granting admin role...");
            await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
            console.log("✅ Admin role granted!");
        } else {
            console.log("✅ User already has admin role");
        }

        // 2. Create an active season if none exists
        console.log("📅 Checking for active season...");
        const [activeSeason] = await db.select().from(seasons).where(eq(seasons.status, "active")).limit(1);

        if (!activeSeason) {
            console.log("🔧 Creating default season...");
            const seasonName = `Season ${new Date().getFullYear()}`;
            const startDate = new Date();
            startDate.setMonth(10); // November (0-indexed)
            startDate.setDate(1);

            await db.insert(seasons).values({
                name: seasonName,
                startDate: startDate,
                status: "active",
            });
            console.log(`✅ Created season: ${seasonName}`);
        } else {
            console.log(`✅ Active season already exists: ${activeSeason.name}`);
        }

        console.log("\n🎉 Setup complete!");
        console.log("\n📝 Next steps:");
        console.log("1. Navigate to /admin in your app");
        console.log("2. Enter your Three Rivers Parks credentials");
        console.log("3. Click 'Trigger Manual Scrape' to import your badge-in history");

    } catch (error) {
        console.error("❌ Setup failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setup();
