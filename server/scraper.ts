import { getActiveSeason, addScrapingLog } from './db';
import { scrapeThreeRiversParks as scrapeThreeRiversImplementation } from './scrapers/threeRiversParksScraper';
import { logger } from './logger';
import type { InsertScrapingLog } from '../drizzle/schema';

/**
 * Three Rivers Parks scraper service
 * Handles authentication and badge-in data extraction
 */

interface ScraperResult {
  success: boolean;
  badgeInsFound: number;
  badgeInsAdded: number;
  error?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 10000; // 10 seconds

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrape badge-in data from Three Rivers Parks account
 * Uses the Puppeteer implementation with retry logic
 */
export async function scrapeThreeRiversParks(
  encryptedUsername: string,
  encryptedPassword: string,
  credentialId: number
): Promise<ScraperResult> {
  let attempt = 1;
  let lastError: string = 'Unknown error';

  while (attempt <= MAX_RETRIES) {
    try {
      logger.info(`Starting scrape attempt ${attempt}/${MAX_RETRIES} for credential ${credentialId}`);

      const result = await scrapeThreeRiversImplementation(
        encryptedUsername,
        encryptedPassword,
        credentialId
      );

      // If implementation logs success but returns false (shouldn't happen with current logic but for safety)
      if (!result.success) {
        throw new Error(result.errorMessage || 'Scraper failed without error message');
      }

      logger.info(`Scrape successful on attempt ${attempt}`, {
        found: result.badgeInsFound,
        added: result.badgeInsAdded
      });

      return {
        success: true,
        badgeInsFound: result.badgeInsFound,
        badgeInsAdded: result.badgeInsAdded
      };

    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      logger.error(`Scrape attempt ${attempt} failed: ${lastError}`);

      if (attempt < MAX_RETRIES) {
        logger.info(`Waiting ${RETRY_DELAY}ms before next attempt...`);
        await wait(RETRY_DELAY);
      }
      attempt++;
    }
  }

  // If all retries fail, log the final failure here (redundant with inner scraper logging potentially, 
  // but ensures the service layer catches generic errors too)

  // Note: The inner scraper implementation adds its own logs to the DB.
  // We might arguably want to manage DB logging *here* instead of inside the scraper function
  // to avoid duplicate failed logs, but for now we'll assume the inner scraper handles it.

  return {
    success: false,
    badgeInsFound: 0,
    badgeInsAdded: 0,
    error: `Failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`,
  };
}

/**
 * Manual scrape trigger for admin panel
 */
export async function triggerManualScrape(userId: number, credentialId: number): Promise<ScraperResult> {
  // This would be called from an admin endpoint
  // Implementation would fetch credentials and call scrapeThreeRiversParks
  return {
    success: false,
    badgeInsFound: 0,
    badgeInsAdded: 0,
    error: 'Manual scrape not yet implemented',
  };
}
