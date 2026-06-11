import "./weather.css";
import { useState }         from "react";
import { buildIconMap }     from "./icons";
import { DEFAULT_FORECAST } from "./data";
import MobileLayout         from "./MobileLayout";
import DesktopLayout        from "./DesktopLayout";
import { useWeather }       from "./useWeather";
import { useAuth }          from "./AuthContext";
import CitySearch           from "./CitySearch";
import SidePanel            from "./SidePanel";

function Overlay({ children }) {
  return (
    <div style={{
      width: "100%", minHeight: "100dvh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #38d3c8 0%, #4cc9b0 100%)",
    }}>
      <p style={{ color: "#fff", fontFamily: "DM Sans, sans-serif", fontSize: 16, textAlign: "center", padding: "0 24px" }}>
        {children}
      </p>
    </div>
  );
}

export default function WeatherWidget({ icons = {} }) {
  const STORAGE_KEY = "meteocast_last_city";
  function loadSaved() {
      try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch (_) {}
          return null;
      }
  function saveLast(name, lat, lon) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, lat, lon })); } catch (_) {}
  }
  // Always store coordinates — never rely on geocoding a name.
  // Default is Katowice city centre; updated whenever a city is selected.
  const saved = loadSaved();
  const [city, setCity]     = useState(saved?.name ?? "Katowice");
  const [coords, setCoords] = useState({ lat: saved?.lat ?? 50.2598, lon: saved?.lon ?? 19.0216 });
  const [panelOpen, setPanelOpen] = useState(false);

  const { data, loading, error } = useWeather({ lat: coords.lat, lon: coords.lon, city });

  const Icon = buildIconMap(icons);

  function handleCitySelect({ name, lat, lon }) {
      const flat = parseFloat(lat);
      const flon = parseFloat(lon);
      setCity(name);
      setCoords({ lat: flat, lon: flon });
      saveLast(name, flat, flon);
  }

  // Search bar rendered above both layouts
  const searchBar = (
    <div className="ww-topbar">
      <button
        className="ww-hamburger"
        onClick={() => setPanelOpen(true)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>
      <CitySearch
        onCitySelect={handleCitySelect}
        currentCity={data?.city ?? city}
        currentLat={data ? parseFloat(coords.lat ?? 0) : null}
        currentLon={data ? parseFloat(coords.lon ?? 0) : null}
      />
    </div>
  );

  if (loading) return <Overlay>Pobieranie pogody dla {city}…</Overlay>;

  if (error) return (
    <Overlay>
      ⚠️ {error}
      <br /><br />
      <small style={{ opacity: 0.75 }}>
        Sprawdź klucz API w pliku <code>.env</code>
        <br />(VITE_OPENWEATHER_API_KEY=twój_klucz)
      </small>
    </Overlay>
  );

  const sharedProps = {
    city:           data?.city           ?? city,
    temp:           data?.temp           ?? "—",
    condition:      data?.condition      ?? "—",
    tempRange:      data?.tempRange      ?? "—",
    humidity:       data?.humidity       ?? "—",
    uv:             data?.uv             ?? "—",
    uvLabel:        data?.uvLabel        ?? "—",
    feelsLike:      data?.feelsLike      ?? "—",
    pressure:       data?.pressure       ?? "—",
    forecast:       data?.forecast       ?? DEFAULT_FORECAST,
    currentIconKey: data?.currentIconKey ?? "sunny",
    Icon,
  };

  return (
    <div className="ww-root">
      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCitySelect={handleCitySelect}
        forceOpen={() => setPanelOpen(true)}
      />

      {/* Mobile */}
      <div className="ww-mobile ww-card">
        {searchBar}
        <MobileLayout {...sharedProps} />
      </div>

      {/* Desktop */}
      <div className="ww-desktop ww-card">
        {searchBar}
        <DesktopLayout {...sharedProps} />
      </div>
    </div>
  );
}
