/**
 * CitySearch.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Search bar with OWM geocoding suggestions + favorite star button.
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

async function fetchSuggestions(query) {
  if (!query || query.length < 2) return [];
  const res = await fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=10&appid=${OWM_KEY}`
  );
  if (!res.ok) return [];
  const data = await res.json();

  const q = normalize(query.trim());

  // Filter: only results whose name matches the query (diacritic-insensitive)
  const matched = data.filter(item => normalize(item.name).startsWith(q));

  // Deduplicate by normalized name + country, keeping first (highest-relevance) result.
  // OWM lists the same city under multiple voivodeships — we want only one entry.
  const seen = new Set();
  return matched.filter(item => {
    const key = `${normalize(item.name)}|${item.country}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

// Display name shown in the dropdown — prefer Polish local name
function displayName(item) {
  return item.local_names?.pl ?? item.name;
}

// Canonical name stored and shown in the weather panel.
// Prefer local_names.pl (e.g. "Kraków") over item.name (e.g. "Krakow"),
// but only when they refer to the same city (normalize to the same string).
function canonicalName(item) {
  const pl = item.local_names?.pl;
  if (pl && normalize(pl) === normalize(item.name)) return pl;
  return item.name;
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

  // Debounced suggestion fetch
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

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(item) {
    onCitySelect({ name: canonicalName(item), lat: item.lat, lon: item.lon });
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
            // Show voivodeship only when multiple results share the same display name
            const name = displayName(item);
            const hasDupe = suggestions.filter(s => displayName(s) === name).length > 1;
            return (
              <li key={i}>
                <button className="cs-suggestion" onClick={() => handleSelect(item)}>
                  <span className="cs-sug-name">{name}</span>
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
