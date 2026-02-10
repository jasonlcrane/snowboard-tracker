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
        season.status === 'active' ? today : new Date(season.actualEndDate || season.estimatedEndDate || today)
      );

      return {
        season: {
          id: season.id,
          name: season.name,
          startDate: season.startDate,
          status: season.status,
          goal: (season as any).goal || 50,
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

  updateSeasonGoal: protectedProcedure
    .input(z.object({ seasonId: z.number(), goal: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        if (process.env.NODE_ENV === 'development') {
          return { success: true };
        }
        throw new Error("Database not available");
      }
      await db.update(seasons).set({ goal: input.goal }).where(eq(seasons.id, input.seasonId));
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
            const data = Array.from({ length: 30 }).map((_, i) => {
              const d = new Date();
              d.setDate(today.getDate() - (30 - i));
              return { date: d.toISOString().split('T')[0], count: Math.floor(i * 1.5) };
            });
            const target = Array.from({ length: 120 }).map((_, i) => {
              const d = new Date();
              d.setDate(today.getDate() - 30 + i);
              return { date: d.toISOString().split('T')[0], target: (50 / 120) * i };
            });
            return { actual: data, target, goal: 50 };
          }
          return { actual: [], target: [], goal: 50 };
        }
        seasonId = season.id;
      } else {
        if (!db) return { actual: [], target: [], goal: 50 };
        const result = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
        season = result[0];
      }

      const badgeInsRows = await getBadgeInsBySeason(seasonId);

      let runningTotal = 0;
      let actualPace = [];

      if (badgeInsRows.length === 0 && process.env.NODE_ENV === 'development' && !(await getDb())) {
        // Provide some mock actual data
        const today = new Date();
        actualPace = Array.from({ length: 20 }).map((_, i) => {
          const d = new Date();
          d.setDate(today.getDate() - (20 - i));
          runningTotal += Math.random() > 0.5 ? 1 : 0;
          return {
            date: d.toISOString().split('T')[0],
            count: runningTotal,
          };
        });
      } else {
        const countsByDate = badgeInsRows.reduce((acc, b) => {
          const date = typeof b.badgeInDate === 'string' ? b.badgeInDate : b.badgeInDate.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedDates = Object.keys(countsByDate).sort();

        actualPace = sortedDates.map(date => {
          runningTotal += countsByDate[date];
          return {
            date,
            count: runningTotal,
          };
        });
      }

      const start = new Date(season.startDate);
      const estimatedEnd = (season as any).actualEndDate || (season as any).estimatedEndDate || new Date(start.getFullYear() + 1, 3, 15);
      const end = new Date(estimatedEnd);

      const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const goal = (season as any).goal || 50;

      const targetPace = [];
      for (let i = 0; i <= totalDays; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        const dateStr = current.toISOString().split('T')[0];
        targetPace.push({
          date: dateStr,
          target: Number(((goal / totalDays) * i).toFixed(2))
        });
      }

      return {
        actual: actualPace,
        target: targetPace,
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
