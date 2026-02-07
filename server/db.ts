import { eq, and, gte, lte, asc, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, badgeIns, InsertBadgeIn, seasons, InsertSeason, projections, InsertProjection, adminCredentials, InsertAdminCredential, scrapingLogs, InsertScrapingLog, weatherCache, InsertWeatherCache } from "../drizzle/schema";
import { ENV } from './_core/env';

import mysql from "mysql2/promise";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || dbUrl.includes('localhost:3306') || dbUrl.includes('placeholder')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("[Database] No valid DATABASE_URL found or using default. Running in mock mode.");
        return null;
      }
    }

    try {
      const pool = mysql.createPool({
        uri: dbUrl,
        ssl: { rejectUnauthorized: false }, // Critical for Railway/Cloud DBs
        connectTimeout: 2000,
      });
      _db = drizzle(pool);
      console.log("[Database] Connected successfully");
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("[Database] Could not connect to MySQL. This is expected on some Chromebook/Docker setups. Using mock data.");
        _db = null;
      } else {
        console.error("[Database] Failed to connect:", error);
        throw error;
      }
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
    } else if (user.openId === ENV.ownerOpenId || (user.email && ENV.allowedEmails.includes(user.email))) {
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
  await db.insert(badgeIns).values(data).onDuplicateKeyUpdate({
    set: {
      updatedAt: new Date(),
    },
  });
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

export async function updateAdminCredentialScrapeTime(id: number, date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminCredentials).set({ lastScrapedAt: date }).where(eq(adminCredentials.id, id));
}

// Scraping log queries
export async function addScrapingLog(data: InsertScrapingLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(scrapingLogs).values(data);
  return result.insertId;
}

export async function getScrapingLogs(credentialId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scrapingLogs)
    .where(eq(scrapingLogs.credentialId, credentialId))
    .orderBy(desc(scrapingLogs.createdAt))
    .limit(limit);
}

export async function updateScrapingLog(id: number, data: Partial<InsertScrapingLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scrapingLogs).set(data).where(eq(scrapingLogs.id, id));
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

// Weather cache queries
export async function getWeatherForDate(dateStr: string) {
  const db = await getDb();
  if (!db) return null;
  // Convert string to Date for comparison
  const result = await db.select().from(weatherCache)
    .where(eq(weatherCache.date, new Date(dateStr)))
    .limit(1);
  return result[0] || null;
}

export async function getWeatherRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  // Convert strings to Dates for comparison
  return db.select().from(weatherCache)
    .where(and(
      gte(weatherCache.date, new Date(startDate)),
      lte(weatherCache.date, new Date(endDate))
    ))
    .orderBy(asc(weatherCache.date));
}

export async function upsertWeatherData(data: InsertWeatherCache) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(weatherCache).values(data).onDuplicateKeyUpdate({
    set: {
      tempHigh: data.tempHigh,
      tempLow: data.tempLow,
      snowfall: data.snowfall,
      conditions: data.conditions,
      updatedAt: new Date(),
    },
  });
}
