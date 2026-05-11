import ForecastRow from "./ForecastRow";
import StatCard    from "./StatCard";

export default function MobileLayout({
  city, temp, condition, tempRange,
  humidity, uv, uvLabel, feelsLike, pressure,
  forecast, Icon, currentIconKey = "sunny",
}) {
  const CurrentIcon = Icon[currentIconKey] ?? Icon.sunny;
  return (
    <div className="m-root">
      {/* ── Hero ── */}
      <div className="m-hero">
        <p className="m-city">{city}</p>
        <div className="m-temp-row">
          <span className="m-temp">{temp}°</span>
          <CurrentIcon className="m-sun-icon" />
        </div>
        <p className="m-condition">{condition}</p>
        <p className="m-range">{tempRange}</p>
      </div>

      {/* ── Prognoza ── */}
      <div className="m-forecast-panel">
        {forecast.map((day, i) => (
          <ForecastRow key={i} day={day} Icon={Icon} />
        ))}
      </div>

      {/* ── Statystyki 2×2 ── */}
      <div className="m-stats">
        <StatCard label="Wilgotność"  value={humidity}        icon={<Icon.humidity className="stat-droplet" />} />
        <StatCard label="UV"          value={uv}              sub={uvLabel} />
        <StatCard label="Odczuwalna"  value={`${feelsLike}°`} />
        <StatCard label="Ciśnienie"   value={pressure}        sub="hPa" />
      </div>
    </div>
  );
}