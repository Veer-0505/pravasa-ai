/**
 * Real Live Weather Service for Karnataka Tourism Destinations
 * Powered by Open-Meteo Verified Meteorological Service (ECMWF & DWD Open Data).
 * Returns real temperature, apparent temperature, humidity, wind, rainfall, and WMO condition text.
 * Caches responses for 15 minutes to avoid redundant network overhead.
 */

const weatherCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const WMO_WEATHER_CODES = {
  0: { label: 'Clear Sky', icon: '☀️', daytime: 'Sunny and clear' },
  1: { label: 'Mainly Clear', icon: '🌤️', daytime: 'Pleasant with light scattered cloud' },
  2: { label: 'Partly Cloudy', icon: '⛅', daytime: 'Partly cloudy skies' },
  3: { label: 'Overcast', icon: '☁️', daytime: 'Cloudy overcast sky' },
  45: { label: 'Foggy / Mist', icon: '🌫️', daytime: 'Morning fog across valley' },
  48: { label: 'Depositing Rime Fog', icon: '🌫️', daytime: 'Dense cool fog' },
  51: { label: 'Light Drizzle', icon: '🌦️', daytime: 'Intermittent light drizzle' },
  53: { label: 'Moderate Drizzle', icon: '🌦️', daytime: 'Continuous drizzle' },
  55: { label: 'Heavy Drizzle', icon: '🌧️', daytime: 'Dense drizzle' },
  61: { label: 'Slight Rain', icon: '🌧️', daytime: 'Light rainfall' },
  63: { label: 'Moderate Rain', icon: '🌧️', daytime: 'Steady seasonal monsoon rain' },
  65: { label: 'Heavy Rain', icon: '🌧️', daytime: 'Heavy downpour' },
  71: { label: 'Light Snow / Hail', icon: '🌨️', daytime: 'Hail' },
  80: { label: 'Slight Showers', icon: '🌦️', daytime: 'Passing rain showers' },
  81: { label: 'Moderate Showers', icon: '🌧️', daytime: 'Scattered afternoon showers' },
  82: { label: 'Violent Showers', icon: '⛈️', daytime: 'Intense rain torrents' },
  95: { label: 'Thunderstorm', icon: '⛈️', daytime: 'Thunderstorm with lightning' },
  96: { label: 'Thunderstorm with Slight Hail', icon: '⛈️', daytime: 'Thunderstorm and hail' },
  99: { label: 'Heavy Thunderstorm', icon: '⛈️', daytime: 'Severe thunderstorm' }
};

async function getLiveWeather(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return {
      available: false,
      message: 'Weather data unavailable: Destination coordinates are missing or invalid.'
    };
  }

  // Key precision to 3 decimals (~110m) for caching
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FKolkata`;
    const res = await fetch(url, { headers: { 'User-Agent': 'PravasaKarnatakaAI/1.0 (tourism@karnatakatourism.gov.in)' } });

    if (!res.ok) {
      throw new Error(`Weather service returned HTTP ${res.status}`);
    }

    const json = await res.json();
    const cur = json.current;

    if (!cur) {
      throw new Error('Current weather payload not found');
    }

    const codeInfo = WMO_WEATHER_CODES[cur.weather_code] || { label: 'Fair Weather', icon: '🌤️', daytime: 'Normal conditions' };

    // Format 7-day daily forecast with real sunrise & sunset for ASI monument timings
    const daily = json.daily;
    const dailyForecast = [];
    if (daily && daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const dCode = daily.weather_code?.[i] ?? 0;
        const dInfo = WMO_WEATHER_CODES[dCode] || { label: 'Clear Sky', icon: '☀️', daytime: 'Clear skies' };
        dailyForecast.push({
          date: daily.time[i],
          maxTempC: Math.round(daily.temperature_2m_max?.[i] ?? 0),
          minTempC: Math.round(daily.temperature_2m_min?.[i] ?? 0),
          precipitationProbPercent: daily.precipitation_probability_max?.[i] ?? 0,
          sunrise: daily.sunrise?.[i]?.split('T')?.[1] || '06:00',
          sunset: daily.sunset?.[i]?.split('T')?.[1] || '18:15',
          condition: dInfo.label,
          icon: dInfo.icon
        });
      }
    }

    const data = {
      available: true,
      coordinates: { lat, lng },
      temperatureC: Math.round(cur.temperature_2m * 10) / 10,
      apparentTemperatureC: Math.round(cur.apparent_temperature * 10) / 10,
      humidityPercent: cur.relative_humidity_2m,
      precipitationMm: cur.precipitation,
      windSpeedKmh: Math.round(cur.wind_speed_10m * 10) / 10,
      weatherCode: cur.weather_code,
      condition: codeInfo.label,
      conditionDescription: codeInfo.daytime,
      icon: codeInfo.icon,
      sunrise: dailyForecast[0]?.sunrise || '06:00',
      sunset: dailyForecast[0]?.sunset || '18:15',
      dailyForecast,
      lastUpdated: cur.time,
      timezone: 'Asia/Kolkata',
      source: 'Open-Meteo Verified Global Meteorological Observations (ECMWF/DWD)'
    };

    weatherCache.set(cacheKey, { timestamp: now, data });
    return data;
  } catch (err) {
    console.warn(`[Weather Service Warning] Could not fetch live weather for (${lat}, ${lng}):`, err.message);
    return {
      available: false,
      coordinates: { lat, lng },
      message: 'Live weather service currently unavailable. Check back shortly.'
    };
  }
}

module.exports = {
  getLiveWeather
};

