import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data (credentials)
 */
export function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data (credentials)
 */
export function decryptData(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Calculate projection based on current visit rate and remaining days
 */
export interface ProjectionScenario {
  conservativeTotal: number;
  averageTotal: number;
  optimisticTotal: number;
  customTotal?: number;
  remainingDays: number;
  visitRate: number;
}

export function calculateProjections(
  currentTotal: number,
  daysElapsed: number,
  conservativeEndDate: Date,
  averageEndDate: Date,
  optimisticEndDate: Date,
  today: Date = new Date(),
  customEndDate: Date | null = null
): ProjectionScenario {
  const visitRate = currentTotal / daysElapsed;

  const conservativeDaysRemaining = Math.max(0, Math.floor((conservativeEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const averageDaysRemaining = Math.max(0, Math.floor((averageEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const optimisticDaysRemaining = Math.max(0, Math.floor((optimisticEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const customDaysRemaining = customEndDate
    ? Math.max(0, Math.floor((customEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    conservativeTotal: Math.round(currentTotal + (visitRate * conservativeDaysRemaining)),
    averageTotal: Math.round(currentTotal + (visitRate * averageDaysRemaining)),
    optimisticTotal: Math.round(currentTotal + (visitRate * optimisticDaysRemaining)),
    customTotal: customDaysRemaining !== null ? Math.round(currentTotal + (visitRate * customDaysRemaining)) : undefined,
    remainingDays: customDaysRemaining !== null ? customDaysRemaining : averageDaysRemaining,
    visitRate: parseFloat(visitRate.toFixed(2)),
  };
}

/**
 * Determine season end date based on weather patterns
 * Returns Conservative, Average, and Optimistic dates
 */
export function estimateSeasonEndDates(today: Date = new Date()) {
  // Hyland Hills typically closes mid-to-late March
  // Conservative: March 15 (early closure due to warm weather)
  // Average: March 20 (typical closing date)
  // Optimistic: March 26 (latest possible, with late snow)

  const year = today.getFullYear();

  const conservative = new Date(year, 2, 15); // March 15
  const average = new Date(year, 2, 20); // March 20
  const optimistic = new Date(year, 2, 26); // March 26

  // If we're past the optimistic date, adjust to next year
  if (today > optimistic) {
    conservative.setFullYear(year + 1);
    average.setFullYear(year + 1);
    optimistic.setFullYear(year + 1);
  }

  return { conservative, average, optimistic };
}

/**
 * Format date for display
 */
export function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Calculate weekly badge-in counts
 */
export function getWeeklyCounts(badgeInDates: Date[]): Record<string, number> {
  const weeklyCounts: Record<string, number> = {};

  badgeInDates.forEach(date => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];

    weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1;
  });

  return weeklyCounts;
}

/**
 * Calculate daily badge-in counts
 */
export function getDailyCounts(badgeInDates: Date[]): Record<string, number> {
  const dailyCounts: Record<string, number> = {};

  badgeInDates.forEach(date => {
    const dayKey = date.toISOString().split('T')[0];
    dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
  });

  return dailyCounts;
}

/**
 * Get season information based on a date
 * A season starts on July 1st.
 * Example: 2025-12-15 belongs to "2025/2026 Season" (starting 2025-07-01)
 * Example: 2025-03-20 belongs to "2024/2025 Season" (starting 2024-07-01)
 */
export function getSeasonInfoForDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, July is 6

  let seasonStartYear: number;
  if (month >= 6) {
    seasonStartYear = year;
  } else {
    seasonStartYear = year - 1;
  }

  return {
    name: `${seasonStartYear}/${seasonStartYear + 1} Season`,
    startDate: `${seasonStartYear}-07-01`,
  };
}
