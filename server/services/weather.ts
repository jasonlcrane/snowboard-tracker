import { getActiveSeason, upsertWeatherData } from '../db';
import { fetchHistoricalWeather } from '../weather-api';

/**
 * Sync historical weather data for the current active season
 * This fetches data from the season start until today and caches it in the DB.
 */
export async function syncWeatherForSeason() {
    const season = await getActiveSeason();
    if (!season) {
        console.warn('[Weather Service] No active season found, skipping sync');
        return { success: false, error: 'No active season' };
    }

    const startDate = typeof season.startDate === 'string'
        ? season.startDate
        : (season.startDate as Date).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    console.log(`[Weather Service] Syncing weather from ${startDate} to ${today}`);

    try {
        const weatherData = await fetchHistoricalWeather(startDate, today);

        for (const day of weatherData) {
            await upsertWeatherData({
                date: new Date(day.date),
                tempHigh: day.tempHigh.toString(),
                tempLow: day.tempLow.toString(),
                snowfall: day.snowfall.toString(),
                conditions: day.conditions,
                source: "open-meteo",
            });
        }

        console.log(`[Weather Service] Successfully synced ${weatherData.length} days of weather data`);
        return { success: true, count: weatherData.length };
    } catch (error) {
        console.error('[Weather Service] Failed to sync weather:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
