import { eq, and, gte, lte, asc, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, badgeIns, InsertBadgeIn, seasons, InsertSeason, projections, InsertProjection, adminCredentials, InsertAdminCredential, scrapingLogs, InsertScrapingLog, weatherCache, InsertWeatherCache } from "../drizzle/schema";
import { ENV } from './_core/env';
import { getSeasonInfoForDate } from './utils';

import mysql from "mysql2/promise";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    if (!dbUrl || dbUrl.includes('placeholder')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("[Database] No valid DATABASE_URL found. Running in mock mode.");
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
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      const today = new Date();
      // Generate some mock scans
      return Array.from({ length: 45 }).map((_, i) => {
        const d = new Date(today.getFullYear(), 10, 15); // Start mid-Nov
        d.setDate(d.getDate() + (i * 2)); // Every other day roughly
        return {
          id: i + 1,
          seasonId,
          badgeInDate: d.toISOString().split('T')[0],
          badgeInTime: '18:30:00',
          passType: i % 5 === 0 ? 'Buck Hill' : 'Hyland Hills',
          isManual: i % 5 === 0 ? 1 : 0,
          notes: i % 5 === 0 ? 'Manual entry' : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      });
    }
    return [];
  }
  return db.select().from(badgeIns).where(eq(badgeIns.seasonId, seasonId));
}

export async function addBadgeIn(data: InsertBadgeIn) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[Database] Mock addBadgeIn:", data);
      return;
    }
    throw new Error("Database not available");
  }
  await db.insert(badgeIns).values(data).onDuplicateKeyUpdate({
    set: {
      updatedAt: new Date(),
    },
  });
}

export async function getActiveSeason() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 1,
        name: "2025/2026 Season",
        startDate: "2025-11-15",
        status: "active" as const,
        goal: 50,
        estimatedEndDate: null,
        actualEndDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return null;
  }

  try {
    const result = await db.select().from(seasons).where(eq(seasons.status, "active")).limit(1);
    if (result[0]) {
      console.log(`[Database] Found active season: ID=${result[0].id}, Name="${result[0].name}"`);
      return result[0];
    }

    // Fallback: Try to find/create a season for today if no "active" one is found
    console.log("[Database] No active season found, auto-detecting for today...");
    const today = new Date();
    const { name } = getSeasonInfoForDate(today);

    const existingByName = await db.select().from(seasons).where(eq(seasons.name, name)).limit(1);
    if (existingByName[0]) {
      // If it exists but wasn't 'active', mark it active
      await db.update(seasons).set({ status: 'active' }).where(eq(seasons.id, existingByName[0].id));
      return { ...existingByName[0], status: 'active' as const };
    }

    // Still nothing? Create it.
    console.log(`[Database] Creating missing season: ${name}`);
    const seasonId = await getOrCreateSeasonForDate(today);
    const newSeason = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
    return newSeason[0] || null;
  } catch (error) {
    console.error("[Database] Error in getActiveSeason:", error);
    // If it's a schema issue (missing goal column), this might fail.
    // In dev, we can fallback to mock, but in prod we might need to be careful.
    return null;
  }
}

export async function createSeason(data: InsertSeason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(seasons).values(data);
  return result;
}

export async function getOrCreateSeasonForDate(date: string | Date): Promise<number> {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') return 1;
    throw new Error("Database not available");
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Use UTC dates for season calculation to avoid timezone shifts
  const utcDate = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
  const { name, startDate } = getSeasonInfoForDate(utcDate);

  // Check if season exists (insensitive match, including completed ones)
  const existing = await db.select().from(seasons).where(eq(seasons.name, name.trim())).limit(1);
  if (existing[0]) {
    console.log(`[Database] Found existing season "${name.trim()}" (ID=${existing[0].id}, Status=${existing[0].status})`);
    return existing[0].id;
  }

  // Create new season
  const [result] = await db.insert(seasons).values({
    name,
    startDate: new Date(startDate) as any,
    status: 'active',
  });

  return result.insertId;
}

// Projection queries
export async function getLatestProjection(seasonId: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 1,
        seasonId,
        projectionDate: new Date().toISOString().split('T')[0],
        conservativeTotal: 40,
        averageTotal: 48,
        optimisticTotal: 55,
        currentTotal: 30,
        visitRate: "3.5",
        estimatedEndDate: null,
        createdAt: new Date()
      } as any;
    }
    return null;
  }
  const result = await db.select().from(projections)
    .where(eq(projections.seasonId, seasonId))
    .orderBy((t) => t.projectionDate)
    .limit(1);
  return result[0] || null;
}

export async function saveProjection(data: InsertProjection) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[Database] Mock saveProjection:", data);
      return;
    }
    throw new Error("Database not available");
  }
  await db.insert(projections).values(data);
}

// Credential queries
export async function getAdminCredentials(userId: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 1,
        userId,
        encryptedUsername: "mock",
        encryptedPassword: "mock",
        accountType: "three_rivers_parks",
        isActive: 1,
        lastScrapedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
    }
    return null;
  }
  const result = await db.select().from(adminCredentials).where(eq(adminCredentials.userId, userId)).limit(1);
  return result[0] || null;
}

export async function saveAdminCredentials(data: InsertAdminCredential) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[Database] Mock saveAdminCredentials:", data);
      return;
    }
    throw new Error("Database not available");
  }
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
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[Database] Mock updateAdminCredentialScrapeTime:", id, date);
      return;
    }
    throw new Error("Database not available");
  }
  await db.update(adminCredentials).set({ lastScrapedAt: date }).where(eq(adminCredentials.id, id));
}

// Scraping log queries
export async function addScrapingLog(data: InsertScrapingLog) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[Database] Mock addScrapingLog:", data);
      return 123;
    }
    throw new Error("Database not available");
  }
  const [result] = await db.insert(scrapingLogs).values(data);
  return result.insertId;
}

export async function getScrapingLogs(credentialId: number, limit = 50) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      return Array.from({ length: 5 }).map((_, i) => ({
        id: i + 1,
        credentialId,
        status: i === 0 ? 'success' : 'pending',
        badgeInsFound: 42,
        badgeInsAdded: 0,
        errorMessage: null,
        createdAt: new Date(Date.now() - i * 60000)
      })) as any;
    }
    return [];
  }
  return db.select().from(scrapingLogs)
    .where(eq(scrapingLogs.credentialId, credentialId))
    .orderBy(desc(scrapingLogs.createdAt))
    .limit(limit);
}

export async function updateScrapingLog(id: number, data: Partial<InsertScrapingLog>) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[Database] Mock updateScrapingLog:", id, data);
      return;
    }
    throw new Error("Database not available");
  }
  await db.update(scrapingLogs).set(data).where(eq(scrapingLogs.id, id));
}

// Manual badge-in queries
export async function addManualBadgeIn(data: InsertBadgeIn) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[Database] Mock addManualBadgeIn:", data);
      return { insertId: Math.floor(Math.random() * 1000) };
    }
    throw new Error("Database not available");
  }
  const result = await db.insert(badgeIns).values(data);
  return result;
}

export async function getManualBadgeIns(seasonId: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      return Array.from({ length: 3 }).map((_, i) => ({
        id: 100 + i,
        seasonId,
        badgeInDate: new Date().toISOString().split('T')[0],
        badgeInTime: '',
        passType: 'Buck Hill',
        isManual: 1,
        notes: 'Mock manual entry',
        createdAt: new Date(),
        updatedAt: new Date()
      })) as any;
    }
    return [];
  }
  return db.select().from(badgeIns).where(
    and(eq(badgeIns.seasonId, seasonId), eq(badgeIns.isManual, 1))
  );
}

export async function getUniqueHillNames(seasonId: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      return ["Buck Hill", "Wild Mountain"];
    }
    return [];
  }
  const results = await db.select({ hill: badgeIns.passType })
    .from(badgeIns)
    .where(and(eq(badgeIns.seasonId, seasonId), eq(badgeIns.isManual, 1)));

  return results
    .map(r => r.hill)
    .filter((h): h is string => !!h);
}

export async function deleteManualBadgeIn(id: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[Database] Mock deleteManualBadgeIn:", id);
      return;
    }
    throw new Error("Database not available");
  }
  await db.delete(badgeIns).where(and(eq(badgeIns.id, id), eq(badgeIns.isManual, 1)));
}

export async function updateManualBadgeIn(id: number, data: Partial<InsertBadgeIn>) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.log("[Database] Mock updateManualBadgeIn:", id, data);
      return;
    }
    throw new Error("Database not available");
  }
  await db.update(badgeIns).set({ ...data, updatedAt: new Date() }).where(and(eq(badgeIns.id, id), eq(badgeIns.isManual, 1)));
}

// Weather cache queries
export async function getWeatherForDate(dateStr: string) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      return {
        date: dateStr,
        tempHigh: "25.5",
        tempLow: "10.2",
        snowfall: "2.00",
        conditions: "Light Snow",
        source: "mock",
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
    }
    return null;
  }
  // Convert string to Date for comparison
  const result = await db.select().from(weatherCache)
    .where(eq(weatherCache.date, new Date(dateStr)))
    .limit(1);
  return result[0] || null;
}

export async function getWeatherRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      // Generate 20 days of mock weather
      return Array.from({ length: 20 }).map((_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return {
          date: d.toISOString().split('T')[0],
          tempHigh: (20 + (i % 10)).toFixed(2),
          tempLow: (10 + (i % 10)).toFixed(2),
          snowfall: (i % 3 === 0 ? 1.5 : 0).toFixed(2),
          conditions: i % 3 === 0 ? "Snow" : "Cloudy",
          source: "mock",
          createdAt: new Date(),
          updatedAt: new Date()
        } as any;
      });
    }
    return [];
  }
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
