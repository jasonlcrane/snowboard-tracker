import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getAdminCredentials, saveAdminCredentials, getScrapingLogs, addScrapingLog, updateAdminCredentialScrapeTime, getDb } from '../db';
import { badgeIns } from '../../drizzle/schema';
import { encryptData } from '../utils';
import { scrapeThreeRiversParks } from '../scrapers/threeRiversParksScraper';
import { syncWeatherForSeason } from '../services/weather';

export const adminRouter = router({
  getCredentials: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const credentials = await getAdminCredentials(ctx.user.id);
    if (!credentials) {
      if (process.env.NODE_ENV === 'development') {
        return {
          id: 1,
          accountType: 'three_rivers_parks',
          isActive: true,
          lastScrapedAt: new Date(),
        };
      }
      return null;
    }

    return {
      id: credentials.id,
      accountType: credentials.accountType,
      isActive: credentials.isActive === 1,
      lastScrapedAt: credentials.lastScrapedAt,
    };
  }),

  saveCredentials: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const encryptedUsername = encryptData(input.username);
      const encryptedPassword = encryptData(input.password);

      await saveAdminCredentials({
        userId: ctx.user.id,
        encryptedUsername,
        encryptedPassword,
        accountType: 'three_rivers_parks',
        isActive: 1,
      });

      return { success: true };
    }),

  getScrapingLogs: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const credentials = await getAdminCredentials(ctx.user.id);
      if (!credentials) {
        return [];
      }

      return getScrapingLogs(credentials.id, input.limit);
    }),

  triggerManualScrape: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const credentials = await getAdminCredentials(ctx.user.id);
    if (!credentials) {
      throw new Error('No credentials configured');
    }

    // Create a pending log entry
    const logId = await addScrapingLog({
      credentialId: credentials.id,
      status: 'pending',
    });

    const result = await scrapeThreeRiversParks(
      credentials.encryptedUsername,
      credentials.encryptedPassword,
      credentials.id,
      Number(logId)
    );

    if (result.success) {
      // Update last scraped time
      await updateAdminCredentialScrapeTime(credentials.id, new Date());
      // Also sync weather data
      await syncWeatherForSeason();
    } else {
      throw new Error(result.errorMessage || 'Scrape failed');
    }

    return {
      success: true,
      message: `Found ${result.badgeInsFound} entries, added ${result.badgeInsAdded} new entries`,
      badgeInsFound: result.badgeInsFound,
      badgeInsAdded: result.badgeInsAdded,
    };
  }),

  syncWeather: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const { success, count, error } = await syncWeatherForSeason();
    if (!success) {
      throw new Error(error || 'Weather sync failed');
    }

    return {
      success: true,
      message: `Successfully synced ${count} days of weather data`,
    };
  }),

  triggerAutoSync: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      return { status: 'skipped', reason: 'Not an admin' };
    }

    const credentials = await getAdminCredentials(ctx.user.id);
    if (!credentials) {
      return { status: 'skipped', reason: 'No credentials' };
    }

    // Check if we already scraped today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastScrapedStr = credentials.lastScrapedAt
      ? new Date(credentials.lastScrapedAt).toISOString().split('T')[0]
      : null;

    if (lastScrapedStr === todayStr) {
      return { status: 'skipped', reason: 'Already updated today' };
    }

    // Create a pending log entry
    const logId = await addScrapingLog({
      credentialId: credentials.id,
      status: 'pending',
    });

    // Start scraping
    const result = await scrapeThreeRiversParks(
      credentials.encryptedUsername,
      credentials.encryptedPassword,
      credentials.id,
      Number(logId)
    );

    if (result.success) {
      await updateAdminCredentialScrapeTime(credentials.id, new Date());
      // Sync weather data after successful auto-sync
      await syncWeatherForSeason();
      return {
        status: 'triggered',
        badgeInsAdded: result.badgeInsAdded,
        badgeInsFound: result.badgeInsFound,
      };
    }

    return {
      status: 'failed',
      error: result.errorMessage
    };
  }),

  // Preview what hill name cleanup would do (dry run)
  previewHillCleanup: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const db = await getDb();
    if (!db) {
      return { changes: [], message: 'Database not available' };
    }

    const allEntries = await db.select({
      id: badgeIns.id,
      passType: badgeIns.passType,
      isManual: badgeIns.isManual,
      badgeInDate: badgeIns.badgeInDate,
    }).from(badgeIns);

    const changes: Array<{ id: number; date: string; from: string; to: string }> = [];

    for (const entry of allEntries) {
      const raw = entry.passType;
      if (!raw) continue;

      let normalized = raw;

      // "Non-Hyland (Wild Mountain)" → "Wild Mountain"
      // "Non-Hyland\n(Wild Mountain)" → "Wild Mountain"  (handles newlines too)
      const parenMatch = raw.match(/\(([^)]+)\)/);
      if (raw.toLowerCase().includes('non-hyland') && parenMatch) {
        normalized = parenMatch[1].trim();
      }

      // Title-case fix: "buck hill" → "Buck Hill", "wild mountain" → "Wild Mountain"
      if (normalized !== normalized.replace(/\b\w/g, c => c.toUpperCase()) &&
        normalized === normalized.toLowerCase()) {
        normalized = normalized.replace(/\b\w/g, c => c.toUpperCase());
      }

      if (normalized !== raw) {
        changes.push({
          id: entry.id,
          date: String(entry.badgeInDate),
          from: raw,
          to: normalized,
        });
      }
    }

    return { changes, message: `Found ${changes.length} entries to clean up` };
  }),

  // Actually perform the hill name cleanup
  cleanupHillNames: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const { eq } = await import('drizzle-orm');

    const allEntries = await db.select({
      id: badgeIns.id,
      passType: badgeIns.passType,
      isManual: badgeIns.isManual,
    }).from(badgeIns);

    let updated = 0;
    const details: Array<{ from: string; to: string }> = [];

    for (const entry of allEntries) {
      const raw = entry.passType;
      if (!raw) continue;

      let normalized = raw;

      // "Non-Hyland (Wild Mountain)" → "Wild Mountain"
      const parenMatch = raw.match(/\(([^)]+)\)/);
      if (raw.toLowerCase().includes('non-hyland') && parenMatch) {
        normalized = parenMatch[1].trim();
      }

      // Title-case fix: "buck hill" → "Buck Hill"
      if (normalized !== normalized.replace(/\b\w/g, c => c.toUpperCase()) &&
        normalized === normalized.toLowerCase()) {
        normalized = normalized.replace(/\b\w/g, c => c.toUpperCase());
      }

      if (normalized !== raw) {
        await db.update(badgeIns)
          .set({ passType: normalized })
          .where(eq(badgeIns.id, entry.id));
        details.push({ from: raw, to: normalized });
        updated++;
      }
    }

    return {
      success: true,
      updated,
      details,
      message: `Updated ${updated} entries`,
    };
  }),
});
