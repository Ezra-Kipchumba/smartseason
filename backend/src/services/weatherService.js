const axios = require('axios');
const https = require('https');

async function getWeather(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('Missing OPENWEATHER_API_KEY');
  }

  const agent = new https.Agent({
    family: 4,              // 👈 FORCE IPv4 (critical fix)
    keepAlive: true,
  });

  try {
    console.log("🌍 Fetching weather...");

    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: 'metric',
        },
        httpsAgent: agent,
        timeout: 10000,     // 👈 increase timeout
      }
    );

    return {
      temp: response.data.main.temp,
      humidity: response.data.main.humidity,
      condition: response.data.weather[0].main,
    };

  } catch (err) {
    console.error('🔥 AXIOS ERROR DETAILS:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
      response: err.response?.data,
    });

    throw new Error('Weather fetch failed');
  }
}

module.exports = { getWeather };