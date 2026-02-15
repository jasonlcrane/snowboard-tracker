
import "dotenv/config";
import { getDb } from "./server/db";
import { seasons, badgeIns } from "./drizzle/schema";
import { eq, lt, and } from "drizzle-orm";

async function checkHistorical() {
    const db = await getDb();
    if (!db) {
        console.error("Database connection failed.");
        return;
    }

    const season1Id = 1;
    const cutOffDate = "2025-07-01";

    console.log(`\n--- Checking for Historical Data in Season ID ${season1Id} (Before ${cutOffDate}) ---`);

    const historicalBadgeIns = await db.select().from(badgeIns).where(
        and(
            eq(badgeIns.seasonId, season1Id),
            lt(badgeIns.badgeInDate, cutOffDate)
        )
    );

    console.log(`Found ${historicalBadgeIns.length} historical entries.`);

    if (historicalBadgeIns.length > 0) {
        console.log("Sample of historical entries:");
        console.table(historicalBadgeIns.slice(0, 10).map(b => ({
            id: b.id,
            date: b.badgeInDate,
            passType: b.passType
        })));
    }

    process.exit(0);
}

checkHistorical().catch(console.error);
