import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { addManualBadgeIn, getManualBadgeIns, deleteManualBadgeIn, updateManualBadgeIn, getActiveSeason, getUniqueHillNames, getOrCreateSeasonForDate } from '../db';

export const manualRouter = router({
  addManualEntry: protectedProcedure
    .input(
      z.object({
        badgeInDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
        hill: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const dateObj = new Date(input.badgeInDate);
      const dateStr = dateObj.toISOString().split('T')[0];

      const seasonId = await getOrCreateSeasonForDate(dateStr);

      await addManualBadgeIn({
        seasonId: seasonId as any,
        badgeInDate: dateStr as any,
        passType: input.hill,
        isManual: 1,
        notes: input.notes,
      });

      return { success: true };
    }),

  getManualEntries: protectedProcedure.query(async () => {
    const season = await getActiveSeason();
    if (!season) return [];

    const entries = await getManualBadgeIns(season.id);
    return entries.map((entry) => ({
      id: entry.id,
      date: entry.badgeInDate,
      hill: entry.passType,
      notes: entry.notes,
      createdAt: entry.createdAt,
    }));
  }),

  getHillNames: protectedProcedure.query(async () => {
    const season = await getActiveSeason();
    if (!season) return ["Buck Hill", "Wild Mountain"];

    const dbHills = await getUniqueHillNames(season.id);
    const defaults = ["Buck Hill", "Wild Mountain"];

    const allHills = new Set([...defaults, ...dbHills]);
    return Array.from(allHills).sort();
  }),

  updateManualEntry: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        hill: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await updateManualBadgeIn(input.id, {
        passType: input.hill,
        notes: input.notes,
      });

      return { success: true };
    }),

  deleteManualEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteManualBadgeIn(input.id);
      return { success: true };
    }),
});
