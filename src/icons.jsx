// ─── WeatherIcon ──────────────────────────────────────────────────────────────
// Renders a weather icon from the /assets/ folder.
// Falls back to a transparent placeholder if the file fails to load.
//
// Props:
//   name      {string}  – SVG filename without extension (e.g. "sunny", "rain")
//   className {string}  – CSS class forwarded to the <img>
//   style     {object}  – Inline styles forwarded to the <img>
//   alt       {string}  – Alt text (defaults to the icon name)

export function WeatherIcon({ name, className = "", style = {}, alt }) {
  return (
    <img
      src={`/assets/${name}.svg`}
      alt={alt ?? name}
      className={className}
      style={style}
      onError={(e) => {
        e.currentTarget.src =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'/%3E";
      }}
    />
  );
}

// ─── HumidityIcon ─────────────────────────────────────────────────────────────
export function HumidityIcon({ className = "", style = {} }) {
  return (
    <WeatherIcon name="humidity" className={className} style={style} alt="humidity" />
  );
}

// ─── Icon component factory ───────────────────────────────────────────────────
// Returns a React component that renders the given asset file.
//
// Usage:  const SunIcon = assetIcon("sunny");
//         <SunIcon className="fr-icon" />
export function assetIcon(name) {
  const Icon = ({ className = "", style = {} }) => (
    <WeatherIcon name={name} className={className} style={style} />
  );
  Icon.displayName = `Icon_${name}`;
  return Icon;
}

// ─── buildIconMap ─────────────────────────────────────────────────────────────
// Builds the icon map used by all layout components.
// Pass `overrides` to replace individual keys with custom components.
//
// Keys match the `iconKey` / `night` fields in forecast data (see data.js).
// When integrating an API, map its condition codes to these keys via weatherCodes.js.

export function buildIconMap(overrides = {}) {
  const defaults = {
    // ── Day conditions ──
    sunny:                   assetIcon("sunny"),
    partlyCloudy:            assetIcon("partly-cloudy"),
    cloudyClearAtTimes:      assetIcon("cloudy-clear at times"),
    cloudy:                  assetIcon("cloudy"),
    drizzle:                 assetIcon("drizzle"),
    drizzleSun:              assetIcon("drizzle&sun"),
    rain:                    assetIcon("rain"),
    rainSun:                 assetIcon("rain&sun"),
    heavyRain:               assetIcon("heavy-rain"),
    scatteredShowers:        assetIcon("scattared-showers"),
    thunderstorm:            assetIcon("rain&thunderstorm"),
    scatteredThunderstorm:   assetIcon("scattared-thunderstorm"),
    severeThunderstorm:      assetIcon("sever-thunderstorm"),
    snow:                    assetIcon("snow"),
    blizzard:                assetIcon("blizzard"),
    blowingSnow:             assetIcon("blowing-snow"),
    sleet:                   assetIcon("sleet"),
    hail:                    assetIcon("hail"),
    fog:                     assetIcon("fog"),
    wind:                    assetIcon("wind"),

    // ── Night conditions ──
    clearNight:              assetIcon("clear-night"),
    partlyCloudyNight:       assetIcon("partly-cloudy-night"),
    cloudyClearAtTimesNight: assetIcon("cloudy-clear at times-night"),
    drizzleNight:            assetIcon("drizzle-night"),
    rainNight:               assetIcon("rain-night"),
    scatteredShowersNight:   assetIcon("scattared-showers-night"),

    // ── Stat icons ──
    humidity:                HumidityIcon,
  };

  return { ...defaults, ...overrides };
}