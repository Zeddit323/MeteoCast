/**
 * CitySearch.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Search bar with Open-Meteo geocoding suggestions + favorite star button.
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

async function fetchSuggestions(query) {
  if (!query || query.length < 2) return [];

  // language=pl forces the Open-Meteo database to prioritize Polish localized names
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pl`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    if (!data.results) return [];

    // Deduplicate on backend attributes: lowercase name, country code, and state/region
    const seen = new Set();
    return data.results
      .filter(item => {
        const key = `${item.name.toLowerCase()}|${item.country_code?.toLowerCase()}|${item.admin1?.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(item => ({
        name: item.name,
        lat: item.latitude,
        lon: item.longitude,
        country: item.country_code?.toUpperCase() || "",
        state: item.admin1 || "",
      }))
      .slice(0, 5); // Take the top 5 highly relevant entries
  } catch (error) {
    console.error("Geocoding error:", error);
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
            // Append context labels if multiple suggestions have the exact same string name
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
