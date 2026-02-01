import { router, publicProcedure } from '../_core/trpc';
import { getBadgeInsBySeason, getActiveSeason, getWeatherRange } from '../db';

export const weatherRouter = router({
    /**
     * Get temperature analysis - shows hill days grouped by temperature ranges
     */
    getTemperatureAnalysis: publicProcedure.query(async () => {
        const season = await getActiveSeason();
        if (!season) return null;

        const badgeIns = await getBadgeInsBySeason(season.id);
        const startDate = new Date(season.startDate).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        // Get weather data for the season
        const weatherData = await getWeatherRange(startDate, today);

        // Create a map of date -> weather
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

        // Group hill days by temperature ranges
        const tempRanges = {
            '0-10°F': { count: 0, temps: [] as number[], snowfall: 0 },
            '10-20°F': { count: 0, temps: [] as number[], snowfall: 0 },
            '20-30°F': { count: 0, temps: [] as number[], snowfall: 0 },
            '30-40°F': { count: 0, temps: [] as number[], snowfall: 0 },
            '40+°F': { count: 0, temps: [] as number[], snowfall: 0 },
        };

        for (const badgeIn of badgeIns) {
            const dateStr = new Date(badgeIn.badgeInDate).toISOString().split('T')[0];
            const weather = weatherMap.get(dateStr);

            if (!weather) continue; // Skip if no weather data

            const avgTemp = (weather.tempHigh + weather.tempLow) / 2;

            // Determine range
            let range: keyof typeof tempRanges;
            if (avgTemp < 10) range = '0-10°F';
            else if (avgTemp < 20) range = '10-20°F';
            else if (avgTemp < 30) range = '20-30°F';
            else if (avgTemp < 40) range = '30-40°F';
            else range = '40+°F';

            tempRanges[range].count++;
            tempRanges[range].temps.push(avgTemp);
            tempRanges[range].snowfall += weather.snowfall;
        }

        // Calculate averages and find sweet spot
        const analysis = Object.entries(tempRanges).map(([range, data]) => ({
            range,
            count: data.count,
            avgTemp: data.temps.length > 0
                ? Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length)
                : 0,
            totalSnowfall: Math.round(data.snowfall * 10) / 10,
        }));

        // Find sweet spot (most frequent range)
        const sweetSpot = analysis.reduce((max, curr) =>
            curr.count > max.count ? curr : max
            , analysis[0]);

        return {
            ranges: analysis,
            sweetSpot: sweetSpot.range,
            totalBadgeIns: badgeIns.length,
            withWeatherData: analysis.reduce((sum, r) => sum + r.count, 0),
        };
    }),

    /**
     * Get 7-day weather forecast
     */
    getForecast: publicProcedure.query(async () => {
        const { fetchWeatherForecast } = await import('../weather-api');
        return fetchWeatherForecast();
    }),
});
