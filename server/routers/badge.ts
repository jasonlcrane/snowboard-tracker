import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { getBadgeInsBySeason, getActiveSeason, getLatestProjection, getDb } from '../db';
import { badgeIns, weatherCache } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { calculateProjections, estimateSeasonEndDates, getWeeklyCounts, getDailyCounts } from '../utils';

export const badgeRouter = router({
  getSeasonStats: publicProcedure.query(async () => {
    const season = await getActiveSeason();
    if (!season) {
      return null;
    }

    const badgeIns = await getBadgeInsBySeason(season.id);
    const projection = await getLatestProjection(season.id);

    const badgeInDates = badgeIns.map(b => new Date(b.badgeInDate));
    const today = new Date();
    const daysElapsed = Math.floor((today.getTime() - new Date(season.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const { conservative, average, optimistic } = estimateSeasonEndDates();
    const projections = calculateProjections(
      badgeIns.length,
      daysElapsed,
      conservative,
      average,
      optimistic
    );

    return {
      season: {
        id: season.id,
        name: season.name,
        startDate: season.startDate,
        status: season.status,
      },
      stats: {
        totalBadgeIns: badgeIns.length,
        daysElapsed,
        visitRate: projections.visitRate,
        visitRatePerWeek: projections.visitRate * 7,
      },
      projections: {
        conservative: projections.conservativeTotal,
        average: projections.averageTotal,
        optimistic: projections.optimisticTotal,
        remainingDays: projections.remainingDays,
      },
      dates: {
        conservative,
        average,
        optimistic,
      },
      lastUpdated: projection?.projectionDate || today,
    };
  }),

  getWeeklyBreakdown: publicProcedure.query(async () => {
    const season = await getActiveSeason();
    if (!season) return [];

    const badgeIns = await getBadgeInsBySeason(season.id);
    const badgeInDates = badgeIns.map(b => new Date(b.badgeInDate));
    const weeklyCounts = getWeeklyCounts(badgeInDates);

    return Object.entries(weeklyCounts)
      .map(([week, count]) => ({
        week,
        count,
        date: new Date(week),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }),

  getDailyBreakdown: publicProcedure.query(async () => {
    const season = await getActiveSeason();
    if (!season) return [];

    const badgeIns = await getBadgeInsBySeason(season.id);
    const badgeInDates = badgeIns.map(b => new Date(b.badgeInDate));
    const dailyCounts = getDailyCounts(badgeInDates);

    return Object.entries(dailyCounts)
      .map(([day, count]) => ({
        day,
        count,
        date: new Date(day),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }),

  getAllBadgeIns: publicProcedure.query(async () => {
    const db = await getDb();
    const season = await getActiveSeason();
    if (!season || !db) return [];

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
      .where(eq(badgeIns.seasonId, season.id))
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
