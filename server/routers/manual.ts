import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { addManualBadgeIn, getManualBadgeIns, deleteManualBadgeIn, updateManualBadgeIn, getActiveSeason } from '../db';

export const manualRouter = router({
  addManualEntry: protectedProcedure
    .input(
      z.object({
        badgeInDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
        badgeInTime: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const season = await getActiveSeason();
      if (!season) {
        throw new Error('No active season found');
      }

      const dateObj = new Date(input.badgeInDate);
      const dateStr = dateObj.toISOString().split('T')[0];

      await addManualBadgeIn({
        seasonId: season.id,
        badgeInDate: dateStr as any,
        badgeInTime: input.badgeInTime,
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
      time: entry.badgeInTime,
      notes: entry.notes,
      createdAt: entry.createdAt,
    }));
  }),

  updateManualEntry: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        badgeInTime: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await updateManualBadgeIn(input.id, {
        badgeInTime: input.badgeInTime,
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
