
import "dotenv/config";
import { getDb } from "./server/db";
import { seasons, badgeIns } from "./drizzle/schema";
import { desc, eq, gte } from "drizzle-orm";

async function diagnose() {
    const db = await getDb();
    if (!db) {
        console.log("Database not available.");
        return;
    }

    console.log("--- All Seasons ---");
    const allSeasons = await db.select().from(seasons);
    console.table(allSeasons);

    console.log("\n--- Recent Badge-ins (Last 10) ---");
    const recentBadges = await db.select().from(badgeIns).orderBy(desc(badgeIns.badgeInDate), desc(badgeIns.id)).limit(10);
    console.table(recentBadges);

    // Check specifically for ones that might be in a "wrong" season
    const activeSeason = allSeasons.find(s => s.status === 'active');
    if (activeSeason) {
        console.log(`\n--- Badge-ins NOT in Active Season (${activeSeason.id}) ---`);
        const mismatched = await db.select().from(badgeIns).where(gte(badgeIns.badgeInDate, '2026-02-01')).limit(20);
        const filtered = mismatched.filter(b => b.seasonId !== activeSeason.id);
        console.table(filtered);
    }

    process.exit(0);
}

diagnose().catch(console.error);
