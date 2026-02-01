import { estimateSeasonEndDates } from './utils';

/**
 * Weather service for fetching forecasts and predicting season end
 */

export interface WeatherData {
  date: Date;
  temperature: number;
  condition: string;
  snowProbability: number;
}

/**
 * Fetch weather forecast from OpenWeather API
 * Note: Requires OPENWEATHER_API_KEY environment variable
 */
export async function fetchWeatherForecast(
  latitude: number = 44.9778,
  longitude: number = -93.2650,
  days: number = 14
): Promise<WeatherData[]> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn('OPENWEATHER_API_KEY not set, using mock data');
      return getMockWeatherData(days);
    }
    
    // Fetch from OpenWeather API
    const url = `https://api.openweathermap.org/forecast/daily?lat=${latitude}&lon=${longitude}&cnt=${days}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.list.map((item: any) => ({
      date: new Date(item.dt * 1000),
      temperature: item.temp.day,
      condition: item.weather[0].main,
      snowProbability: item.snow ? (item.snow / 100) : 0,
    }));
  } catch (error) {
    console.error('Error fetching weather:', error);
    return getMockWeatherData(days);
  }
}

/**
 * Predict season end date based on weather patterns
 */
export async function predictSeasonEnd(): Promise<{
  conservative: Date;
  average: Date;
  optimistic: Date;
}> {
  const forecast = await fetchWeatherForecast();
  
  // Analyze forecast for warm weather patterns
  const avgTemp = forecast.reduce((sum, day) => sum + day.temperature, 0) / forecast.length;
  
  // If average temperature is above 5°C (41°F), season might end earlier
  // If there's significant snow in forecast, season might extend
  const { conservative, average, optimistic } = estimateSeasonEndDates();
  
  // Could adjust dates based on forecast analysis
  // For now, return standard estimates
  return { conservative, average, optimistic };
}

/**
 * Mock weather data for development/testing
 */
function getMockWeatherData(days: number): WeatherData[] {
  const data: WeatherData[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Mock realistic Minnesota winter weather
    const temp = -5 + Math.random() * 15;
    const conditions = ['Clear', 'Cloudy', 'Snow', 'Partly Cloudy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const snowProbability = condition === 'Snow' ? 0.7 + Math.random() * 0.3 : Math.random() * 0.3;
    
    data.push({
      date,
      temperature: Math.round(temp * 10) / 10,
      condition,
      snowProbability: Math.round(snowProbability * 100) / 100,
    });
  }
  
  return data;
}

/**
 * Determine if conditions favor season extension or early closure
 */
export function analyzeSeasonTrend(forecast: WeatherData[]): 'extending' | 'shortening' | 'neutral' {
  const avgTemp = forecast.reduce((sum, day) => sum + day.temperature, 0) / forecast.length;
  const snowDays = forecast.filter(day => day.condition === 'Snow').length;
  
  if (avgTemp > 5 && snowDays < 2) {
    return 'shortening'; // Warm weather, little snow
  } else if (avgTemp < 0 && snowDays > 3) {
    return 'extending'; // Cold weather, frequent snow
  }
  
  return 'neutral';
}
