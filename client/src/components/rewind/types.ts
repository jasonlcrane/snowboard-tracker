// Shared types for Season Rewind card components

export interface RewindData {
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
    longestStreak: { days: number; startDate: string; endDate: string };
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
    badgeInDates: string[];
}

export interface CardProps {
    data: RewindData;
    isActive: boolean;
}

/** Format a YYYY-MM-DD date string for display */
export function formatRewindDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function formatRewindDateShort(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
