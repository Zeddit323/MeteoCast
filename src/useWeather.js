/**
 * useWeather.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches from OpenWeatherMap and maps data to the WeatherWidget shape.
 * Tries One Call 3.0 first; falls back to free 2.5 endpoints automatically.
 *
 * Requires in .env:
 *   VITE_OPENWEATHER_API_KEY=your_key_here
 */

import { useState, useEffect } from "react";

function owmIconToKey(iconCode) {
  const map = {
    "01d": "sunny",
    "02d": "partlyCloudy",
    "03d": "cloudy",
    "04d": "cloudy",
    "09d": "drizzle",
    "10d": "rain",
    "11d": "thunderstorm",
    "13d": "snow",
    "50d": "fog",
    "01n": "clearNight",
    "02n": "partlyCloudyNight",
    "03n": "cloudy",
    "04n": "cloudy",
    "09n": "drizzleNight",
    "10n": "rainNight",
    "11n": "thunderstorm",
    "13n": "snow",
    "50n": "fog",
  };
  return map[iconCode] ?? "partlyCloudy";
}

const DAY_LABELS_PL = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];

function formatForecast(daily) {
  return daily.slice(0, 8).map((day, i) => {
    const date = new Date(day.dt * 1000);
    let label;
    if (i === 0) label = "Dziś";
    else if (i === 1) label = "Jutro";
    else label = DAY_LABELS_PL[date.getDay()];

    return {
      label,
      rain:    day.pop != null ? `${Math.round(day.pop * 100)}%` : null,
      iconKey: owmIconToKey(day.weather[0].icon),
      night:   owmIconToKey(day.weather[0].icon.replace("d", "n")),
      hi:      Math.round(day.temp.max),
      lo:      Math.round(day.temp.min),
    };
  });
}

function uvIndexLabel(uv) {
  if (uv <= 2)  return "Niski";
  if (uv <= 5)  return "Umiarkowany";
  if (uv <= 7)  return "Wysoki";
  if (uv <= 10) return "Bardzo wysoki";
  return "Ekstremalny";
}

export function useWeather({ lat, lon, city }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setError("Brak klucza API. Dodaj VITE_OPENWEATHER_API_KEY do pliku .env");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchWeather() {
      setLoading(true);
      setError(null);
      try {
        // Coordinates always provided — no geocoding needed.
        const resolvedLat  = lat;
        const resolvedLon  = lon;
        const resolvedCity = city;

        // ── Try One Call 3.0 ──────────────────────────────────────────────────
        const oneCallRes = await fetch(
          `https://api.openweathermap.org/data/3.0/onecall` +
          `?lat=${resolvedLat}&lon=${resolvedLon}&exclude=minutely,alerts&units=metric&lang=pl&appid=${apiKey}`
        );

        if (oneCallRes.status === 401 || oneCallRes.status === 403) {
          // ── Fallback to free 2.5 tier ──────────────────────────────────────
          const mapped = await fetchFallback(resolvedLat, resolvedLon, resolvedCity, apiKey);
          if (!cancelled) { setData(mapped); setLoading(false); }
          return;
        }

        if (!oneCallRes.ok) throw new Error(`Weather API error: ${oneCallRes.status}`);
        const json = await oneCallRes.json();
        if (cancelled) return;

        const current    = json.current;
        const daily      = json.daily ?? [];
        const todayDaily = daily[0] ?? {};

        setData({
          city:           resolvedCity ?? "—",
          temp:           Math.round(current.temp),
          condition:      current.weather[0]?.description ?? "—",
          tempRange:      `Od ${Math.round(todayDaily.temp?.min ?? current.temp)}° do ${Math.round(todayDaily.temp?.max ?? current.temp)}°`,
          humidity:       `${current.humidity}%`,
          uv:             Math.round(current.uvi ?? 0),
          uvLabel:        uvIndexLabel(current.uvi ?? 0),
          feelsLike:      Math.round(current.feels_like),
          pressure:       current.pressure,
          forecast:       formatForecast(daily),
          currentIconKey: owmIconToKey(current.weather[0]?.icon ?? "01d"),
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, city, apiKey]);

  return { data, loading, error };
}

// ── Free-tier fallback (2.5) — includes separate UV fetch ────────────────────
async function fetchFallback(lat, lon, city, apiKey) {
  const base = "https://api.openweathermap.org/data/2.5";

  // Fetch current weather, 5-day forecast, and Open-Meteo UV Index in parallel
  // Open-Meteo is 100% free, requires no key, and provides accurate real-time UV
  const [curRes, foreRes, uvRes] = await Promise.all([
    fetch(`${base}/weather?lat=${lat}&lon=${lon}&units=metric&lang=pl&appid=${apiKey}`),
    fetch(`${base}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pl&appid=${apiKey}`),
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index`)
  ]);

  if (!curRes.ok)  throw new Error(`Weather error: ${curRes.status}`);
  if (!foreRes.ok) throw new Error(`Forecast error: ${foreRes.status}`);

  const cur  = await curRes.json();
  const fore = await foreRes.json();

  // Safely extract the current UV index from the Open-Meteo response
  let uvValue = 0;
  if (uvRes.ok) {
    try {
      const uvJson = await uvRes.json();
      uvValue = uvJson.current?.uv_index ?? 0;
    } catch (_) { /* ignore and fallback to 0 if API goes down */ }
  }

  // ── Build daily summary from 3-hourly slots (prefer noon) ─────────────────
  const byDay = {};
  const hiLo  = {};

  for (const item of fore.list) {
    const d    = new Date(item.dt * 1000);
    const key  = d.toISOString().slice(0, 10);
    
    // NOTE: Changed to .getHours() to calculate the slot closest to local 
    // noon rather than UTC noon, protecting accuracy across different time zones.
    const hour = d.getHours();

    if (!byDay[key] || Math.abs(hour - 12) < Math.abs(new Date(byDay[key].dt * 1000).getHours() - 12)) {
      byDay[key] = item;
    }
    if (!hiLo[key]) hiLo[key] = { hi: -999, lo: 999 };
    if (item.main.temp_max > hiLo[key].hi) hiLo[key].hi = item.main.temp_max;
    if (item.main.temp_min < hiLo[key].lo) hiLo[key].lo = item.main.temp_min;
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const days     = Object.keys(byDay).sort().slice(0, 8);

  const forecast = days.map((key, i) => {
    const item = byDay[key];
    const date = new Date(item.dt * 1000);
    let label;
    if (key === todayKey)                   label = "Dziś";
    else if (i === 1 && days[0] === todayKey) label = "Jutro";
    else                                    label = DAY_LABELS_PL[date.getDay()];

    const hl = hiLo[key] ?? { hi: Math.round(item.main.temp), lo: Math.round(item.main.temp) };
    return {
      label,
      rain:    item.pop != null ? `${Math.round(item.pop * 100)}%` : null,
      iconKey: owmIconToKey(item.weather[0].icon),
      night:   owmIconToKey(item.weather[0].icon.replace("d", "n")),
      hi:      Math.round(hl.hi),
      lo:      Math.round(hl.lo),
    };
  });

  const todayHiLo = hiLo[todayKey] ?? { hi: cur.main.temp_max, lo: cur.main.temp_min };

  return {
    city:           city ?? cur.name,
    temp:           Math.round(cur.main.temp),
    condition:      cur.weather[0]?.description ?? "—",
    tempRange:      `Od ${Math.round(todayHiLo.lo)}° do ${Math.round(todayHiLo.hi)}°`,
    humidity:       `${cur.main.humidity}%`,
    uv:             Math.round(uvValue), // Now maps the real fetched value
    uvLabel:        uvIndexLabel(uvValue),
    feelsLike:      Math.round(cur.main.feels_like),
    pressure:       cur.main.pressure,
    forecast,
    currentIconKey: owmIconToKey(cur.weather[0]?.icon ?? "01d"),
  };
}
