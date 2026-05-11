export default function ForecastCol({ day, Icon }) {
  const DayIcon   = Icon[day.iconKey] || Icon.partlyCloudy;
  const NightIcon = Icon[day.night]   || Icon.clearNight;

  return (
    <div className="fc-col">
      <span className="fc-label">{day.label}</span>

      <div className="fc-rain-row">
        {day.rain ? (
          <>
            <span className="fr-rain-dot" />
            <span className="fr-rain">{day.rain}</span>
          </>
        ) : null}
      </div>

      <div className="fc-icons">
        <DayIcon   className="fr-icon" />
        <NightIcon className="fr-icon" />
      </div>

      <div className="fc-temps">
        <span className="fr-hi">{day.hi}°</span>
        <span className="fr-lo">{day.lo}°</span>
      </div>
    </div>
  );
}