import "./weather.css";
import { buildIconMap }     from "./icons";
import { DEFAULT_FORECAST } from "./data";
import MobileLayout         from "./MobileLayout";
import DesktopLayout        from "./DesktopLayout";

/**
 * WeatherWidget
 * ─────────────────────────────────────────────────────────────────────────────
 * Props:
 *   city           {string}  – Nazwa miasta
 *   temp           {number}  – Aktualna temperatura °C
 *   condition      {string}  – Opis warunków (np. "Słonecznie")
 *   tempRange      {string}  – Zakres dobowy (np. "5° – 11°")
 *   humidity       {string}  – Wilgotność (np. "6%")
 *   uv             {number}  – Indeks UV
 *   uvLabel        {string}  – Opis UV (np. "Niski")
 *   feelsLike      {number}  – Temperatura odczuwalna °C
 *   pressure       {number}  – Ciśnienie hPa
 *   forecast       {Array}   – Tablica dni prognozy (patrz data.js)
 *   currentIconKey {string}  – Klucz ikony aktualnych warunków (patrz icons.jsx)
 *   icons          {Object}  – Opcjonalne nadpisanie ikon
 */
export default function WeatherWidget({
  city           = "Katowice",
  temp           = 11,
  condition      = "Słonecznie",
  tempRange      = "Od 5° do 11°",
  humidity       = "6%",
  uv             = 2,
  uvLabel        = "Niski",
  feelsLike      = 15,
  pressure       = 1016,
  forecast       = DEFAULT_FORECAST,
  currentIconKey = "sunny",
  icons          = {},
}) {
  const Icon = buildIconMap(icons);

  const sharedProps = {
    city, temp, condition, tempRange,
    humidity, uv, uvLabel, feelsLike, pressure,
    forecast, Icon, currentIconKey,
  };

  return (
    <div className="ww-root">
      {/* Mobile (< 640px) */}
      <div className="ww-mobile ww-card">
        <MobileLayout {...sharedProps} />
      </div>

      {/* Desktop (≥ 640px) */}
      <div className="ww-desktop ww-card">
        <DesktopLayout {...sharedProps} />
      </div>
    </div>
  );
}