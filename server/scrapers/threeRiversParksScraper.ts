import puppeteer, { Browser, Page } from 'puppeteer';
import { addBadgeIn, getActiveSeason, addScrapingLog } from '../db';
import { decryptData } from '../utils';

interface ScraperResult {
  success: boolean;
  badgeInsFound: number;
  badgeInsAdded: number;
  errorMessage?: string;
}

/**
 * Scrape badge-in history from Three Rivers Parks account
 */
export async function scrapeThreeRiversParks(
  encryptedUsername: string,
  encryptedPassword: string,
  credentialId: number
): Promise<ScraperResult> {
  let browser: Browser | null = null;
  let result: ScraperResult = {
    success: false,
    badgeInsFound: 0,
    badgeInsAdded: 0,
  };

  try {
    // Decrypt credentials
    const username = decryptData(encryptedUsername);
    const password = decryptData(encryptedPassword);

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1920,1080'
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Set a real User-Agent to avoid 403/Bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // Navigate to login page
    await page.goto('https://mnthreeriversweb.myvscloud.com/webtrac/web/login.html', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Fill in credentials
    await page.type('input[name="weblogin_username"]', username);
    await page.type('input[name="weblogin_password"]', password);

    // Submit login form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(e => { /* Nav wait warning */ }),
      page.click('button[type="submit"]'),
    ]);

    // Wait for any redirects or cookie setting
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check for error messages
    const errorEl = await page.$('.page-message.message.error');
    if (errorEl) {
      const errorText = await page.evaluate(el => el.textContent, errorEl);
      throw new Error(`Login failed: ${errorText?.trim()}`);
    }

    // Verify login success by looking for "Sign In / Register". If present, we failed.
    const content = await page.content();
    if (content.includes('Sign In / Register')) {
      throw new Error('Login verification failed: "Sign In / Register" still present');
    }

    // Navigate to history page
    await page.goto(
      'https://mnthreeriversweb.myvscloud.com/webtrac/web/history.html?historyoption=inquiry',
      { waitUntil: 'domcontentloaded' }
    );

    // Extract badge-in data
    const badgeIns = await extractBadgeIns(page);
    result.badgeInsFound = badgeIns.length;

    // Get active season
    const season = await getActiveSeason();

    if (!season) {
      throw new Error('No active season found');
    }

    // Add badge-ins to database
    let addedCount = 0;
    for (const badgeIn of badgeIns) {
      try {
        // Check if already exists
        await addBadgeIn({
          seasonId: season.id,
          badgeInDate: badgeIn.date as any,
          badgeInTime: badgeIn.time,
          passType: badgeIn.passType,
          isManual: 0,
        });
        addedCount++;
      } catch (error) {
        // Likely duplicate - continue
      }
    }

    result.badgeInsAdded = addedCount;
    result.success = true;

    // Log successful scrape
    try {
      await addScrapingLog({
        credentialId,
        status: 'success',
        badgeInsFound: badgeIns.length,
        badgeInsAdded: addedCount,
      });
    } catch (e) {
      console.warn('Could not save success log to DB (normal for manual testing).');
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errorMessage = errorMessage;

    // Log failed scrape
    await addScrapingLog({
      credentialId,
      status: 'failed',
      badgeInsFound: 0,
      badgeInsAdded: 0,
      errorMessage,
    });

    return result;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extract badge-in entries from the history page
 */
async function extractBadgeIns(
  page: Page
): Promise<Array<{ date: string; time?: string; passType?: string }>> {
  try {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Extract all rows from the table
    const rows = await page.$$eval('table tbody tr', (elements) => {
      return elements.map((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return null;

        // Extract date (usually first column)
        const dateCell = cells[0]?.textContent?.trim();
        // Extract time (usually second column)
        const timeCell = cells[1]?.textContent?.trim();
        // Extract pass type if available
        const passTypeCell = cells[2]?.textContent?.trim();

        return {
          date: dateCell,
          time: timeCell,
          passType: passTypeCell,
        };
      });
    });

    // Filter out nulls and parse dates
    const validEntries = rows
      .filter((row): row is Exclude<typeof row, null> => row !== null)
      .map((row) => {
        // Try to parse the date - Three Rivers Parks uses format like "01/31/2026"
        const dateMatch = row.date?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dateMatch) {
          const [, month, day, year] = dateMatch;
          const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          return {
            date,
            time: row.time,
            passType: row.passType,
          };
        }
        return null;
      })
      .filter((entry): entry is Exclude<typeof entry, null> => entry !== null);

    return validEntries;
  } catch (error) {
    console.error('Error extracting badge-ins:', error);
    return [];
  }
}
