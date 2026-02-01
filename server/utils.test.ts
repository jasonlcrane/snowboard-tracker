import { describe, expect, it } from 'vitest';
import { calculateProjections, estimateSeasonEndDates, getWeeklyCounts, getDailyCounts } from './utils';

describe('Projection Calculations', () => {
  it('should calculate projections correctly', () => {
    const today = new Date('2026-01-31');
    const conservative = new Date('2026-03-15');
    const average = new Date('2026-03-20');
    const optimistic = new Date('2026-03-26');

    const result = calculateProjections(41, 56, conservative, average, optimistic, today);

    expect(result.visitRate).toBeCloseTo(0.73, 1);
    expect(result.conservativeTotal).toBe(72);
    expect(result.averageTotal).toBe(76);
    expect(result.optimisticTotal).toBe(81);
    expect(result.remainingDays).toBe(48);
  });

  it('should handle zero days elapsed', () => {
    const today = new Date('2026-01-31');
    const conservative = new Date('2026-03-15');
    const average = new Date('2026-03-20');
    const optimistic = new Date('2026-03-26');

    // Should not throw
    const result = calculateProjections(0, 1, conservative, average, optimistic, today);
    expect(result.visitRate).toBe(0);
  });

  it('should estimate season end dates correctly', () => {
    const today = new Date('2026-01-31');
    const { conservative, average, optimistic } = estimateSeasonEndDates(today);

    expect(conservative.getMonth()).toBe(2); // March
    expect(conservative.getDate()).toBe(15);
    expect(average.getDate()).toBe(20);
    expect(optimistic.getDate()).toBe(26);
  });
});

describe('Weekly and Daily Counts', () => {
  it('should calculate weekly counts correctly', () => {
    const dates = [
      new Date('2026-01-05'),
      new Date('2026-01-06'),
      new Date('2026-01-12'),
      new Date('2026-01-19'),
    ];

    const weeklyCounts = getWeeklyCounts(dates);
    expect(Object.keys(weeklyCounts).length).toBeGreaterThan(0);
    expect(Object.values(weeklyCounts).reduce((a, b) => a + b, 0)).toBe(4);
  });

  it('should calculate daily counts correctly', () => {
    const dates = [
      new Date('2026-01-05'),
      new Date('2026-01-05'),
      new Date('2026-01-06'),
    ];

    const dailyCounts = getDailyCounts(dates);
    expect(dailyCounts['2026-01-05']).toBe(2);
    expect(dailyCounts['2026-01-06']).toBe(1);
  });

  it('should handle empty date arrays', () => {
    const weeklyCounts = getWeeklyCounts([]);
    const dailyCounts = getDailyCounts([]);

    expect(Object.keys(weeklyCounts).length).toBe(0);
    expect(Object.keys(dailyCounts).length).toBe(0);
  });
});
