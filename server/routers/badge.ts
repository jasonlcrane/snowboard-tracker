import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { getBadgeInsBySeason, getActiveSeason, getLatestProjection, getDb } from '../db';
import { badgeIns, weatherCache, seasons } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { calculateProjections, estimateSeasonEndDates, getWeeklyCounts, getDailyCounts } from '../utils';

export const badgeRouter = router({
  getSeasonStats: publicProcedure
    .input(z.object({ seasonId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      let season;

      if (input?.seasonId) {
        if (!db) return null;
        const result = await db.select().from(seasons).where(eq(seasons.id, input.seasonId)).limit(1);
        season = result[0];
      } else {
        season = await getActiveSeason();
      }

      if (!season) return null;

      const badgeInsRows = await getBadgeInsBySeason(season.id);
      const projection = await getLatestProjection(season.id);

      const today = new Date();
      const seasonStart = new Date(season.startDate);
      const daysElapsed = Math.max(1, season.status === 'active'
        ? Math.floor((today.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 120);

      const { conservative, average, optimistic } = estimateSeasonEndDates(season.status === 'active' ? today : new Date(season.startDate));

      const projections = calculateProjections(
        badgeInsRows.length,
        daysElapsed,
        conservative,
        average,
        optimistic,
        season.status === 'active' ? today : new Date(season.actualEndDate || season.estimatedEndDate || today)
      );

      return {
        season: {
          id: season.id,
          name: season.name,
          startDate: season.startDate,
          status: season.status,
        },
        stats: {
          totalBadgeIns: badgeInsRows.length,
          daysElapsed,
          visitRate: projections.visitRate,
          visitRatePerWeek: projections.visitRate * 7,
        },
        projections: {
          conservative: projections.conservativeTotal,
          average: projections.averageTotal,
          optimistic: projections.optimisticTotal,
          remainingDays: season.status === 'active' ? projections.remainingDays : 0,
        },
        dates: {
          conservative,
          average,
          optimistic,
        },
        lastUpdated: projection?.projectionDate || today,
      };
    }),

  getAllSeasons: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(seasons).orderBy(desc(seasons.startDate));
  }),

  getWeeklyBreakdown: publicProcedure
    .input(z.object({ seasonId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      let seasonId = input?.seasonId;
      if (!seasonId) {
        const season = await getActiveSeason();
        if (!season) return [];
        seasonId = season.id;
      }

      const badgeInsRows = await getBadgeInsBySeason(seasonId);
      const badgeInDates = badgeInsRows.map(b => new Date(b.badgeInDate));
      const weeklyCounts = getWeeklyCounts(badgeInDates);

      return Object.entries(weeklyCounts)
        .map(([week, count]) => ({
          week,
          count,
          date: new Date(week),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }),

  getDailyBreakdown: publicProcedure
    .input(z.object({ seasonId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      let seasonId = input?.seasonId;
      if (!seasonId) {
        const season = await getActiveSeason();
        if (!season) return [];
        seasonId = season.id;
      }

      const badgeInsRows = await getBadgeInsBySeason(seasonId);
      const badgeInDates = badgeInsRows.map(b => new Date(b.badgeInDate));
      const dailyCounts = getDailyCounts(badgeInDates);

      return Object.entries(dailyCounts)
        .map(([day, count]) => ({
          day,
          count,
          date: new Date(day),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }),

  getAllBadgeIns: publicProcedure
    .input(z.object({ seasonId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let seasonId = input?.seasonId;
      if (!seasonId) {
        const season = await getActiveSeason();
        if (!season) return [];
        seasonId = season.id;
      }

      const badgeInsWithWeather = await db.select({
        id: badgeIns.id,
        badgeInDate: badgeIns.badgeInDate,
        badgeInTime: badgeIns.badgeInTime,
        passType: badgeIns.passType,
        isManual: badgeIns.isManual,
        notes: badgeIns.notes,
        tempHigh: weatherCache.tempHigh,
        conditions: weatherCache.conditions,
      })
        .from(badgeIns)
        .leftJoin(weatherCache, eq(badgeIns.badgeInDate, weatherCache.date))
        .where(eq(badgeIns.seasonId, seasonId))
        .orderBy(desc(badgeIns.badgeInDate));

      return badgeInsWithWeather;
    }),

  getProjectionHistory: publicProcedure.query(async () => {
    const season = await getActiveSeason();
    if (!season) return [];
    return [];
  }),

  recalculateProjections: protectedProcedure
    .input(z.object({ seasonId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      return { success: true };
    }),
});
