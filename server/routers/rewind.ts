import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { getBadgeInsBySeason, getActiveSeason, getWeatherRange, getDb } from '../db';
import { badgeIns, weatherCache, seasons } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getWeeklyCounts } from '../utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SeasonRewindData {
    season: {
        name: string;
        startDate: string;
        endDate: string | null;
        goal: number;
        status: string;
    };
    totalDays: number;
    avgDaysPerWeek: number;
    firstDay: string;
    lastDay: string;
    hillBreakdown: { hill: string; count: number }[];
    favoriteHill: { hill: string; count: number };
    longestStreak: { weeks: number; startDate: string; endDate: string };
    coldestDay: { date: string; tempLow: number; tempAvg: number } | null;
    bestPowderDay: { date: string; snowfall: number } | null;
    totalSnowfallOnHillDays: number;
    dayOfWeekBreakdown: { day: string; count: number }[];
    favoriteDayOfWeek: { day: string; count: number };
    goalProgress: { goal: number; current: number; met: boolean; percentage: number };
    monthlyBreakdown: { month: string; count: number }[];
    busiestMonth: { month: string; count: number };
    tempSweetSpot: string;
    seasonScore: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Find the longest consecutive-week streak from badge-in dates.
 * A "week" is any ISO week containing at least one badge-in.
 */
function computeLongestStreak(badgeInDates: Date[]): { weeks: number; startDate: string; endDate: string } {
    if (badgeInDates.length === 0) {
        return { weeks: 0, startDate: '', endDate: '' };
    }

    // Get week keys (start of week = Sunday) sorted chronologically
    const weeklyMap = getWeeklyCounts(badgeInDates);
    const weekKeys = Object.keys(weeklyMap).sort();

    if (weekKeys.length === 0) {
        return { weeks: 0, startDate: '', endDate: '' };
    }

    let bestStart = 0;
    let bestLen = 1;
    let curStart = 0;
    let curLen = 1;

    for (let i = 1; i < weekKeys.length; i++) {
        const prev = new Date(weekKeys[i - 1]);
        const curr = new Date(weekKeys[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
            curLen++;
        } else {
            if (curLen > bestLen) {
                bestLen = curLen;
                bestStart = curStart;
            }
            curStart = i;
            curLen = 1;
        }
    }

    if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
    }

    return {
        weeks: bestLen,
        startDate: weekKeys[bestStart],
        endDate: weekKeys[bestStart + bestLen - 1],
    };
}

/**
 * Compute a fun composite "Season Score" out of 100.
 */
function computeSeasonScore(
    totalDays: number,
    goal: number,
    streakWeeks: number,
    uniqueHills: number,
    coldDaysBelow10: number,
    powderDays: number,
    activeMonths: number,
): number {
    const goalPts = Math.min(40, Math.round((totalDays / Math.max(1, goal)) * 40));
    const streakPts = Math.min(15, streakWeeks * 3);
    const varietyPts = Math.min(15, uniqueHills * 5);
    const braveryPts = Math.min(10, coldDaysBelow10 * 2);
    const powderPts = Math.min(10, powderDays * 2);
    const consistencyPts = activeMonths >= 4 ? 10 : Math.round((activeMonths / 4) * 10);

    return Math.min(100, goalPts + streakPts + varietyPts + braveryPts + powderPts + consistencyPts);
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const rewindRouter = router({
    getSeasonRewind: publicProcedure
        .input(z.object({ seasonId: z.number().optional() }).optional())
        .query(async ({ input }): Promise<SeasonRewindData | null> => {
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

            // ── Fetch raw data ──────────────────────────────────────────────────
            const allBadgeIns = await getBadgeInsBySeason(season.id);

            if (allBadgeIns.length === 0) return null; // Nothing to rewind

            const badgeInDates = allBadgeIns.map(b => new Date(b.badgeInDate));
            const sortedDates = [...badgeInDates].sort((a, b) => a.getTime() - b.getTime());
            const firstDay = sortedDates[0].toISOString().split('T')[0];
            const lastDay = sortedDates[sortedDates.length - 1].toISOString().split('T')[0];

            // Weather data for the season range
            const weatherData = await getWeatherRange(firstDay, lastDay);
            const weatherMap = new Map(
                weatherData.map(w => [
                    new Date(w.date).toISOString().split('T')[0],
                    {
                        tempHigh: parseFloat(w.tempHigh || '0'),
                        tempLow: parseFloat(w.tempLow || '0'),
                        snowfall: parseFloat(w.snowfall || '0'),
                        conditions: w.conditions || 'Unknown',
                    }
                ])
            );

            // ── Total days & rate ───────────────────────────────────────────────
            const totalDays = allBadgeIns.length;
            const spanDays = Math.max(1, Math.ceil(
                (sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime()) / (1000 * 60 * 60 * 24)
            ) + 1);
            const weeksSpan = Math.max(1, spanDays / 7);
            const avgDaysPerWeek = parseFloat((totalDays / weeksSpan).toFixed(2));

            // ── Hill breakdown ──────────────────────────────────────────────────
            // Scraped entries (isManual=0) all come from the Three Rivers Parks /
            // Hyland Hills scraper, so normalize them.  Manual entries (isManual=1)
            // store the actual hill name the user selected in passType.
            const hillCounts: Record<string, number> = {};
            for (const b of allBadgeIns) {
                const hill = b.isManual === 1
                    ? (b.passType || 'Unknown Hill')
                    : 'Hyland Hills';
                hillCounts[hill] = (hillCounts[hill] || 0) + 1;
            }
            const hillBreakdown = Object.entries(hillCounts)
                .map(([hill, count]) => ({ hill, count }))
                .sort((a, b) => b.count - a.count);
            const favoriteHill = hillBreakdown[0] || { hill: 'Unknown', count: 0 };

            // ── Longest streak ──────────────────────────────────────────────────
            const longestStreak = computeLongestStreak(badgeInDates);

            // ── Weather superlatives ────────────────────────────────────────────
            let coldestDay: SeasonRewindData['coldestDay'] = null;
            let bestPowderDay: SeasonRewindData['bestPowderDay'] = null;
            let totalSnowfallOnHillDays = 0;
            let coldDaysBelow10 = 0;
            let powderDaysCount = 0;

            // Temperature ranges for sweet spot
            const tempRanges: Record<string, number> = {
                '0-10°F': 0, '10-20°F': 0, '20-30°F': 0, '30-40°F': 0, '40+°F': 0,
            };

            for (const date of badgeInDates) {
                const dateStr = date.toISOString().split('T')[0];
                const weather = weatherMap.get(dateStr);
                if (!weather) continue;

                const avgTemp = (weather.tempHigh + weather.tempLow) / 2;

                // Coldest day
                if (!coldestDay || weather.tempLow < coldestDay.tempLow) {
                    coldestDay = {
                        date: dateStr,
                        tempLow: Math.round(weather.tempLow),
                        tempAvg: Math.round(avgTemp),
                    };
                }

                // Best powder day
                if (weather.snowfall > 0) {
                    totalSnowfallOnHillDays += weather.snowfall;
                    if (!bestPowderDay || weather.snowfall > bestPowderDay.snowfall) {
                        bestPowderDay = {
                            date: dateStr,
                            snowfall: Math.round(weather.snowfall * 10) / 10,
                        };
                    }
                    if (weather.snowfall >= 2) powderDaysCount++;
                }

                // Cold day counting
                if (avgTemp < 10) coldDaysBelow10++;

                // Sweet spot
                if (avgTemp < 10) tempRanges['0-10°F']++;
                else if (avgTemp < 20) tempRanges['10-20°F']++;
                else if (avgTemp < 30) tempRanges['20-30°F']++;
                else if (avgTemp < 40) tempRanges['30-40°F']++;
                else tempRanges['40+°F']++;
            }

            totalSnowfallOnHillDays = Math.round(totalSnowfallOnHillDays * 10) / 10;

            // Find sweet spot (most frequent temp range)
            const tempSweetSpot = Object.entries(tempRanges)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

            // ── Day of week breakdown ───────────────────────────────────────────
            const dowCounts: Record<string, number> = {};
            for (const d of badgeInDates) {
                const dayName = DAY_NAMES[d.getDay()];
                dowCounts[dayName] = (dowCounts[dayName] || 0) + 1;
            }
            const dayOfWeekBreakdown = DAY_NAMES
                .map(day => ({ day, count: dowCounts[day] || 0 }));
            const favoriteDayOfWeek = dayOfWeekBreakdown.reduce(
                (max, curr) => curr.count > max.count ? curr : max,
                dayOfWeekBreakdown[0],
            );

            // ── Goal progress ──────────────────────────────────────────────────
            const goal = (season as any).goal || 50;
            const goalProgress = {
                goal,
                current: totalDays,
                met: totalDays >= goal,
                percentage: Math.min(100, Math.round((totalDays / goal) * 100)),
            };

            // ── Monthly breakdown ──────────────────────────────────────────────
            const monthCounts: Record<string, number> = {};
            for (const d of badgeInDates) {
                const monthKey = MONTH_NAMES[d.getMonth()];
                monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
            }
            const monthlyBreakdown = MONTH_NAMES
                .filter(m => monthCounts[m])
                .map(month => ({ month, count: monthCounts[month] || 0 }));
            const busiestMonth = monthlyBreakdown.reduce(
                (max, curr) => curr.count > max.count ? curr : max,
                monthlyBreakdown[0] || { month: 'N/A', count: 0 },
            );

            // ── Season score ───────────────────────────────────────────────────
            const uniqueHills = hillBreakdown.length;
            const activeMonths = monthlyBreakdown.length;
            const seasonScore = computeSeasonScore(
                totalDays, goal, longestStreak.weeks, uniqueHills,
                coldDaysBelow10, powderDaysCount, activeMonths,
            );

            // ── Assemble ───────────────────────────────────────────────────────
            return {
                season: {
                    name: season.name,
                    startDate: season.startDate as string,
                    endDate: ((season as any).actualEndDate || (season as any).estimatedEndDate || null) as string | null,
                    goal,
                    status: season.status,
                },
                totalDays,
                avgDaysPerWeek,
                firstDay,
                lastDay,
                hillBreakdown,
                favoriteHill,
                longestStreak,
                coldestDay,
                bestPowderDay,
                totalSnowfallOnHillDays,
                dayOfWeekBreakdown,
                favoriteDayOfWeek,
                goalProgress,
                monthlyBreakdown,
                busiestMonth,
                tempSweetSpot,
                seasonScore,
            };
        }),
});
