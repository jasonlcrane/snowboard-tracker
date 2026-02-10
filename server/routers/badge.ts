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

      if (!season) {
        if (process.env.NODE_ENV === 'development') {
          const today = new Date();
          const startDate = new Date(today.getFullYear(), 10, 15);
          const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const { conservative, average, optimistic } = estimateSeasonEndDates();
          const projections = calculateProjections(42, daysElapsed, conservative, average, optimistic);
          return {
            season: { id: 1, name: '2025/2026 Season (Mock)', startDate: startDate.toISOString().split('T')[0], status: 'active', goal: 50 },
            stats: { totalBadgeIns: 42, daysElapsed, visitRate: projections.visitRate, visitRatePerWeek: projections.visitRate * 7 },
            projections: { conservative: projections.conservativeTotal, average: projections.averageTotal, optimistic: projections.optimisticTotal, remainingDays: projections.remainingDays },
            dates: { conservative, average, optimistic },
            lastUpdated: today,
          };
        }
        return null;
      }

      const badgeInsRows = await getBadgeInsBySeason(season.id);

      // If we have no real data and are in dev, provide some mock stats
      if (badgeInsRows.length === 0 && process.env.NODE_ENV === 'development' && !db) {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), 10, 15);
        const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const { conservative, average, optimistic } = estimateSeasonEndDates();
        const projections = calculateProjections(42, daysElapsed, conservative, average, optimistic);
        return {
          season: { id: season.id, name: season.name, startDate: season.startDate, status: season.status, goal: 50 },
          stats: { totalBadgeIns: 42, daysElapsed, visitRate: projections.visitRate, visitRatePerWeek: projections.visitRate * 7 },
          projections: { conservative: projections.conservativeTotal, average: projections.averageTotal, optimistic: projections.optimisticTotal, remainingDays: projections.remainingDays },
          dates: { conservative, average, optimistic },
          lastUpdated: today,
        };
      }

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
        season.status === 'active' ? today : new Date((season as any).actualEndDate || (season as any).estimatedEndDate || today)
      );

      const remainingGoal = Math.max(0, ((season as any).goal || 50) - badgeInsRows.length);
      const neededVisitRate = projections.remainingDays > 0 ? (remainingGoal / projections.remainingDays) : 0;

      return {
        season: {
          id: season.id,
          name: season.name,
          startDate: season.startDate,
          status: season.status,
          goal: (season as any).goal || 50,
          estimatedEndDate: (season as any).estimatedEndDate,
          actualEndDate: (season as any).actualEndDate,
        },
        stats: {
          totalBadgeIns: badgeInsRows.length,
          daysElapsed,
          visitRate: projections.visitRate,
          visitRatePerWeek: projections.visitRate * 7,
          neededVisitRate: neededVisitRate,
          neededVisitRatePerWeek: neededVisitRate * 7,
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
    if (!db) {
      if (process.env.NODE_ENV === 'development') {
        return [
          { id: 1, name: '2025/2026 Season (Mock)', status: 'active', startDate: '2025-07-01' },
          { id: 2, name: '2024/2025 Season (Mock Arch)', status: 'completed', startDate: '2024-07-01' },
        ];
      }
      return [];
    }
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

      if (badgeInsRows.length === 0 && process.env.NODE_ENV === 'development' && !(await getDb())) {
        return Array.from({ length: 8 }).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (i * 7));
          return { week: date.toISOString().split('T')[0], count: Math.floor(Math.random() * 5) + 1, date };
        }).reverse();
      }

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

      if (badgeInsRows.length === 0 && process.env.NODE_ENV === 'development' && !(await getDb())) {
        return Array.from({ length: 30 }).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return { day: date.toISOString().split('T')[0], count: Math.random() > 0.7 ? 1 : 0, date };
        }).reverse();
      }

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

      const badgeInsRows = await getBadgeInsBySeason(seasonId);

      if (badgeInsRows.length === 0 && process.env.NODE_ENV === 'development' && !db) {
        return Array.from({ length: 5 }).map((_, i) => ({
          id: i + 1,
          badgeInDate: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          badgeInTime: '10:00 AM',
          passType: i % 2 === 0 ? 'Hyland Hills' : 'Buck Hill',
          isManual: i % 2 === 0 ? 0 : 1,
          notes: i % 2 === 0 ? '' : 'Mock entry',
          tempHigh: 25 - i * 2,
          conditions: 'Snowing',
        }));
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

  updateSeasonSettings: protectedProcedure
    .input(z.object({
      seasonId: z.number(),
      goal: z.number().optional(),
      estimatedEndDate: z.string().optional(),
      actualEndDate: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        if (process.env.NODE_ENV === 'development') {
          return { success: true };
        }
        throw new Error("Database not available");
      }

      const updateData: any = {};
      if (input.goal !== undefined) updateData.goal = input.goal;
      if (input.estimatedEndDate !== undefined) updateData.estimatedEndDate = input.estimatedEndDate === "" ? null : input.estimatedEndDate;
      if (input.actualEndDate !== undefined) updateData.actualEndDate = input.actualEndDate === "" ? null : input.actualEndDate;

      await db.update(seasons).set(updateData).where(eq(seasons.id, input.seasonId));
      return { success: true };
    }),

  getCumulativePace: publicProcedure
    .input(z.object({ seasonId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      let seasonId = input?.seasonId;
      let season;
      const db = await getDb();

      if (!seasonId) {
        season = await getActiveSeason();
        if (!season) {
          if (process.env.NODE_ENV === 'development') {
            const today = new Date();
            const data = Array.from({ length: 120 }).map((_, i) => {
              const d = new Date(today.getFullYear(), 10, 15);
              d.setDate(d.getDate() + i);
              const dateStr = d.toISOString().split('T')[0];
              const isPast = d <= today;
              return {
                date: dateStr,
                count: isPast ? Math.floor(i * 0.8) : undefined,
                target: (50 / 120) * i
              };
            });
            return { combined: data, goal: 50 };
          }
          return { combined: [], goal: 50 };
        }
        seasonId = season.id;
      } else {
        if (!db) return { combined: [], goal: 50 };
        const result = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
        season = result[0];
      }

      const badgeInsRows = await getBadgeInsBySeason(seasonId);
      const goal = (season as any).goal || 50;

      // Define a realistic "Snow Season" start and end
      // We'll use the earlier of Nov 15th OR the first badge-in date
      const firstBadgeIn = badgeInsRows.length > 0
        ? new Date(Math.min(...badgeInsRows.map(b => new Date(b.badgeInDate).getTime())))
        : new Date(new Date(season.startDate).getFullYear(), 10, 15);

      const snowStart = new Date(new Date(season.startDate).getFullYear(), 10, 1); // Start Nov 1
      if (firstBadgeIn < snowStart) snowStart.setTime(firstBadgeIn.getTime());

      const { average: fallbackEnd } = estimateSeasonEndDates(new Date());
      const snowEnd = (season as any).actualEndDate ? new Date((season as any).actualEndDate)
        : (season as any).estimatedEndDate ? new Date((season as any).estimatedEndDate)
          : fallbackEnd;

      const totalDays = Math.max(1, Math.ceil((snowEnd.getTime() - snowStart.getTime()) / (1000 * 60 * 60 * 24)));

      const countsByDate = badgeInsRows.reduce((acc, b) => {
        const date = typeof b.badgeInDate === 'string' ? b.badgeInDate : b.badgeInDate.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const todayStr = new Date().toISOString().split('T')[0];
      let runningTotal = 0;
      const combined = [];

      for (let i = 0; i <= totalDays; i++) {
        const current = new Date(snowStart);
        current.setDate(snowStart.getDate() + i);
        const dateStr = current.toISOString().split('T')[0];

        runningTotal += (countsByDate[dateStr] || 0);

        const isPastOrToday = dateStr <= todayStr;

        combined.push({
          date: dateStr,
          target: Number(((goal / totalDays) * i).toFixed(2)),
          count: isPastOrToday ? runningTotal : undefined,
        });
      }

      return {
        combined,
        goal
      };
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
