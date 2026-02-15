
import "dotenv/config";
import { getDb } from "./server/db";
import { seasons, badgeIns } from "./drizzle/schema";
import { desc, count, eq } from "drizzle-orm";

async function diagnose() {
    const db = await getDb();
    if (!db) {
        console.log("Database not available.");
        return;
    }

    console.log("--- Season Details ---");
    const allSeasons = await db.select().from(seasons);
    console.table(allSeasons);

    console.log("\n--- Badge-in Counts per Season ---");
    const counts = await db.select({
        seasonId: badgeIns.seasonId,
        badgeCount: count()
    }).from(badgeIns).groupBy(badgeIns.seasonId);
    console.table(counts);

    process.exit(0);
}

diagnose().catch(console.error);
