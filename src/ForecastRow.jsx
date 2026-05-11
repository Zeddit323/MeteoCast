export default function ForecastRow({ day, Icon }) {
  const DayIcon   = Icon[day.iconKey] || Icon.partlyCloudy;
  const NightIcon = Icon[day.night]   || Icon.clearNight;

  return (
    <div className="fr-row">
      <span className="fr-label">{day.label}</span>

      <div className="fr-rain-cell">
        {day.rain ? (
          <>
            <span className="fr-rain-dot" />
            <span className="fr-rain">{day.rain}</span>
          </>
        ) : null}
      </div>

      <DayIcon   className="fr-icon" />
      <NightIcon className="fr-icon" />

      <span className="fr-hi">{day.hi}°</span>
      <span className="fr-lo">{day.lo}°</span>
    </div>
  );
}