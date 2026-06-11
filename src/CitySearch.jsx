/**
 * CitySearch.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Search bar with Open-Meteo geocoding suggestions + favorite star button.
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

async function fetchSuggestions(query) {
  if (!query || query.length < 2) return [];

  const q = normalize(query);

  try {
    // Fetch with language=pl (returns Polish city names, e.g. "Londyn" for London).
    // Also fetch with language=en simultaneously so foreign-language queries
    // (e.g. typing "London") still find the right city even if the Polish name
    // doesn't match the query string.
    const [respl, resen] = await Promise.all([
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pl`),
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en`),
    ]);

    const [datapl, dataen] = await Promise.all([
      respl.ok ? respl.json() : { results: [] },
      resen.ok ? resen.json() : { results: [] },
    ]);

    const resultspl = datapl.results ?? [];
    const resultsen = dataen.results ?? [];

    // Build a map of id → Polish-name result from the pl fetch
    const plById = new Map(resultspl.map(r => [r.id, r]));

    // Merge: for each EN result, prefer the PL version (for the Polish city name)
    // but only include it if the EN name matches the query (so "London" finds "Londyn")
    const merged = [];
    for (const en of resultsen) {
      if (!normalize(en.name).startsWith(q)) continue;
      const pl = plById.get(en.id);
      merged.push(pl ?? en); // use Polish name if available
    }

    // Also add PL-only results whose Polish name directly matches the query
    // (covers cities the user typed in Polish, e.g. "Kraków")
    const enIds = new Set(resultsen.map(r => r.id));
    for (const pl of resultspl) {
      if (enIds.has(pl.id)) continue; // already handled above
      if (!normalize(pl.name).startsWith(q)) continue;
      merged.push(pl);
    }

    // Deduplicate by normalized name + country, keep first (most relevant)
    const seen = new Set();
    return merged
      .filter(item => {
        const key = `${normalize(item.name)}|${item.country_code?.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(item => ({
        name:    item.name,
        lat:     item.latitude,
        lon:     item.longitude,
        country: item.country_code?.toUpperCase() ?? "",
        state:   item.admin1 ?? "",
      }))
      .slice(0, 5);
  } catch (err) {
    console.error("Geocoding error:", err);
    return [];
  }
}

export default function CitySearch({ onCitySelect, currentCity, currentLat, currentLon }) {
  const { user, isFavorite, getFavoriteId, addFavorite, removeFavorite } = useAuth();

  const [input, setInput]             = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [favLoading, setFavLoading]   = useState(false);
  const debounceRef                   = useRef(null);
  const wrapperRef                    = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!input.trim()) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(input);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [input]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(item) {
    onCitySelect({ name: item.name, lat: item.lat, lon: item.lon });
    setInput("");
    setSuggestions([]);
    setOpen(false);
  }

  function handleKey(e) {
    if (e.key === "Escape") { setOpen(false); setInput(""); }
    if (e.key === "Enter" && suggestions.length > 0) handleSelect(suggestions[0]);
  }

  const starred = user && currentCity ? isFavorite(currentCity) : false;
  const favId   = starred ? getFavoriteId(currentCity) : null;

  async function handleStarToggle() {
    if (!user || !currentCity) return;
    setFavLoading(true);
    try {
      if (starred) await removeFavorite(favId);
      else         await addFavorite(currentCity, currentLat, currentLon);
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <div className="cs-wrapper" ref={wrapperRef}>
      <div className="cs-bar">
        {user && currentCity && (
          <button
            className={`cs-star ${starred ? "cs-star--active" : ""}`}
            onClick={handleStarToggle}
            disabled={favLoading}
            title={starred ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          >
            {starred ? "★" : "☆"}
          </button>
        )}
        <input
          className="cs-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Szukaj miasta…"
          autoComplete="off"
        />
        {loading && <span className="cs-spinner" />}
      </div>

      {open && (
        <ul className="cs-dropdown">
          {suggestions.map((item, i) => {
            // Show state only when multiple results share the same name
            const hasDupe = suggestions.filter(s => s.name === item.name).length > 1;
            return (
              <li key={i}>
                <button className="cs-suggestion" onClick={() => handleSelect(item)}>
                  <span className="cs-sug-name">{item.name}</span>
                  <span className="cs-sug-meta">
                    {[hasDupe && item.state, item.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
