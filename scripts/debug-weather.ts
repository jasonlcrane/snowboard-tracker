import axios from 'axios';

const HYLAND_LAT = 44.8597;
const HYLAND_LON = -93.3478;

async function test() {
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
    console.log(JSON.stringify(response.data.daily, null, 2));
}

test();
