import axios from 'axios';

/**
 * Open-Meteo API integration for weather data
 * Free API, no authentication required
 * Docs: https://open-meteo.com/en/docs
 */

// Hyland Hills Ski Area coordinates
const HYLAND_LAT = 44.8597;
const HYLAND_LON = -93.3478;

interface HistoricalWeatherDay {
    date: string; // YYYY-MM-DD
    tempHigh: number; // °F
    tempLow: number; // °F
    snowfall: number; // inches
    conditions: string;
}

interface ForecastDay {
    date: string;
    tempHigh: number;
    tempLow: number;
    snowProbability: number; // 0-100
    conditions: string;
}

/**
 * Fetch historical weather data for a date range
 */
export async function fetchHistoricalWeather(
    startDate: string, // YYYY-MM-DD
    endDate: string // YYYY-MM-DD
): Promise<HistoricalWeatherDay[]> {
    try {
        const url = `https://archive-api.open-meteo.com/v1/archive`;
        const params = {
            latitude: HYLAND_LAT,
            longitude: HYLAND_LON,
            start_date: startDate,
            end_date: endDate,
            daily: 'temperature_2m_max,temperature_2m_min,snowfall_sum,weathercode',
            temperature_unit: 'fahrenheit',
            precipitation_unit: 'inch',
            timezone: 'America/Chicago',
        };

        const response = await axios.get(url, { params });
        const data = response.data.daily;

        return data.time.map((date: string, i: number) => ({
            date,
            tempHigh: data.temperature_2m_max[i],
            tempLow: data.temperature_2m_min[i],
            snowfall: data.snowfall_sum[i] || 0,
            conditions: weatherCodeToCondition(data.weathercode[i]),
        }));
    } catch (error) {
        console.error('[Weather API] Failed to fetch historical data:', error);
        throw error;
    }
}

/**
 * Fetch 7-day weather forecast
 */
export async function fetchWeatherForecast(): Promise<ForecastDay[]> {
    try {
        const url = `https://api.open-meteo.com/v1/forecast`;
        const params = {
            latitude: HYLAND_LAT,
            longitude: HYLAND_LON,
            daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode',
            temperature_unit: 'fahrenheit',
            precipitation_unit: 'inch',
            timezone: 'America/Chicago',
            forecast_days: 7,
        };

        const response = await axios.get(url, { params });
        const data = response.data.daily;

        return data.time.map((date: string, i: number) => ({
            date,
            tempHigh: data.temperature_2m_max[i],
            tempLow: data.temperature_2m_min[i],
            snowProbability: data.precipitation_probability_max[i] || 0,
            conditions: weatherCodeToCondition(data.weathercode[i]),
        }));
    } catch (error) {
        console.error('[Weather API] Failed to fetch forecast:', error);
        throw error;
    }
}

/**
 * Convert Open-Meteo weather code to human-readable condition
 * https://open-meteo.com/en/docs
 */
function weatherCodeToCondition(code: number): string {
    const codeMap: Record<number, string> = {
        0: 'Clear',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Light drizzle',
        53: 'Drizzle',
        55: 'Heavy drizzle',
        61: 'Light rain',
        63: 'Rain',
        65: 'Heavy rain',
        71: 'Light snow',
        73: 'Snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Light showers',
        81: 'Showers',
        82: 'Heavy showers',
        85: 'Light snow showers',
        86: 'Snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Thunderstorm with hail',
    };

    return codeMap[code] || 'Unknown';
}
