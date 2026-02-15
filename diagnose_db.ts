
import { getDb } from "./server/db";
import { scrapingLogs, badgeIns } from "./drizzle/schema";
import { desc } from "drizzle-orm";

async function diagnose() {
    const db = await getDb();
    if (!db) {
        console.log("Database not available.");
        return;
    }

    console.log("--- Recent Scraping Logs ---");
    const logs = await db.select().from(scrapingLogs).orderBy(desc(scrapingLogs.createdAt)).limit(10);
    console.table(logs);

    console.log("\n--- Recent Badge-ins ---");
    const badges = await db.select().from(badgeIns).orderBy(desc(badgeIns.badgeInDate)).limit(10);
    console.table(badges);

    process.exit(0);
}

diagnose().catch(console.error);
