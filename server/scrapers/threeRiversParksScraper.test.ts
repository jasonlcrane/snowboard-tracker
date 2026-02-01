import { describe, expect, it, vi } from 'vitest';
import { scrapeThreeRiversParks } from './threeRiversParksScraper';
import * as db from '../db';
import * as utils from '../utils';

// Mock dependencies
vi.mock('../db');
vi.mock('../utils');
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

describe('Three Rivers Parks Scraper', () => {
  it('should return error when credentials are invalid', async () => {
    // Mock getActiveSeason to return null
    vi.mocked(db.getActiveSeason).mockResolvedValueOnce(null);

    const result = await scrapeThreeRiversParks(
      'encrypted-username',
      'encrypted-password',
      1
    );

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
  });

  it('should handle decryption errors gracefully', async () => {
    // Mock decryptData to throw error
    vi.mocked(utils.decryptData).mockImplementationOnce(() => {
      throw new Error('Decryption failed');
    });

    const result = await scrapeThreeRiversParks(
      'encrypted-username',
      'encrypted-password',
      1
    );

    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('Decryption failed');
  });

  it('should log scraping results', async () => {
    const addScrapingLogSpy = vi.spyOn(db, 'addScrapingLog');

    vi.mocked(utils.decryptData).mockImplementation((data) => data.replace('encrypted-', ''));
    vi.mocked(db.getActiveSeason).mockResolvedValueOnce(null);

    await scrapeThreeRiversParks('encrypted-username', 'encrypted-password', 1);

    expect(addScrapingLogSpy).toHaveBeenCalled();
  });
});
