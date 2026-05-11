import ForecastCol from "./ForecastCol";
import StatCard    from "./StatCard";

export default function DesktopLayout({
  city, temp, condition, tempRange,
  humidity, uv, uvLabel, feelsLike, pressure,
  forecast, Icon, currentIconKey = "sunny",
}) {
  const CurrentIcon = Icon[currentIconKey] ?? Icon.sunny;
  return (
    <div className="d-root">
      {/* ── Górny pasek: miasto | warunki | temperatura ── */}
      <div className="d-topbar">
        <p className="d-city">{city}</p>
        <div className="d-cond-block">
          <p className="d-condition">{condition}</p>
          <p className="d-range">{tempRange}</p>
        </div>
        <div className="d-temp-block">
          <span className="d-temp">{temp}°</span>
          <CurrentIcon className="d-sun-icon" />
        </div>
      </div>

      {/* ── Prognoza ── */}
      <div className="d-forecast-panel">
        {forecast.map((day, i) => (
          <ForecastCol key={i} day={day} Icon={Icon} />
        ))}
      </div>

      {/* ── Statystyki 1×4 ── */}
      <div className="d-stats">
        <StatCard label="Wilgotność"  value={humidity}        icon={<Icon.humidity className="stat-droplet" />} />
        <StatCard label="UV"          value={uv}              sub={uvLabel} />
        <StatCard label="Odczuwalna"  value={`${feelsLike}°`} />
        <StatCard label="Ciśnienie"   value={pressure}        sub="hPa" />
      </div>
    </div>
  );
}