
import "dotenv/config";
import mysql from "mysql2/promise";

async function inspect() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    console.log("--- Table: badge_ins ---");
    const [columns] = await connection.query("DESCRIBE badge_ins");
    console.table(columns);

    console.log("\n--- Indexes: badge_ins ---");
    const [indexes] = await connection.query("SHOW INDEX FROM badge_ins");
    console.table(indexes);

    await connection.end();
    process.exit(0);
}

inspect().catch(console.error);
