import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, badgeIns, InsertBadgeIn, seasons, InsertSeason, projections, InsertProjection, adminCredentials, InsertAdminCredential, scrapingLogs, InsertScrapingLog } from "../drizzle/schema";
import { ENV } from './_core/env';

import mysql from "mysql2/promise";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Critical for Railway/Cloud DBs
      });
      _db = drizzle(connection);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Badge-in queries
export async function getBadgeInsBySeason(seasonId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badgeIns).where(eq(badgeIns.seasonId, seasonId));
}

export async function addBadgeIn(data: InsertBadgeIn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(badgeIns).values(data);
}

// Season queries
export async function getActiveSeason() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(seasons).where(eq(seasons.status, "active")).limit(1);
  return result[0] || null;
}

export async function createSeason(data: InsertSeason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(seasons).values(data);
  return result;
}

// Projection queries
export async function getLatestProjection(seasonId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(projections)
    .where(eq(projections.seasonId, seasonId))
    .orderBy((t) => t.projectionDate)
    .limit(1);
  return result[0] || null;
}

export async function saveProjection(data: InsertProjection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(projections).values(data);
}

// Credential queries
export async function getAdminCredentials(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(adminCredentials).where(eq(adminCredentials.userId, userId)).limit(1);
  return result[0] || null;
}

export async function saveAdminCredentials(data: InsertAdminCredential) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adminCredentials).values(data).onDuplicateKeyUpdate({
    set: {
      encryptedUsername: data.encryptedUsername,
      encryptedPassword: data.encryptedPassword,
      updatedAt: new Date(),
    },
  });
}

// Scraping log queries
export async function addScrapingLog(data: InsertScrapingLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(scrapingLogs).values(data);
}

export async function getScrapingLogs(credentialId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scrapingLogs).where(eq(scrapingLogs.credentialId, credentialId)).limit(limit);
}

// Manual badge-in queries
export async function addManualBadgeIn(data: InsertBadgeIn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(badgeIns).values(data);
  return result;
}

export async function getManualBadgeIns(seasonId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badgeIns).where(
    and(eq(badgeIns.seasonId, seasonId), eq(badgeIns.isManual, 1))
  );
}

export async function deleteManualBadgeIn(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(badgeIns).where(and(eq(badgeIns.id, id), eq(badgeIns.isManual, 1)));
}

export async function updateManualBadgeIn(id: number, data: Partial<InsertBadgeIn>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(badgeIns).set({ ...data, updatedAt: new Date() }).where(and(eq(badgeIns.id, id), eq(badgeIns.isManual, 1)));
}


