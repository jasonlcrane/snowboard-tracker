import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getAdminCredentials, saveAdminCredentials, getScrapingLogs, addScrapingLog } from '../db';
import { encryptData } from '../utils';
import { scrapeThreeRiversParks } from '../scrapers/threeRiversParksScraper';

export const adminRouter = router({
  getCredentials: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const credentials = await getAdminCredentials(ctx.user.id);
    if (!credentials) {
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

    if (!result.success) {
      throw new Error(result.errorMessage || 'Scrape failed');
    }

    return {
      success: true,
      message: `Found ${result.badgeInsFound} entries, added ${result.badgeInsAdded} new entries`,
      badgeInsFound: result.badgeInsFound,
      badgeInsAdded: result.badgeInsAdded,
    };
  }),
});
