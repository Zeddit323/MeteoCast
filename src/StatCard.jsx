// ─── StatCard ──────────────────────────────────────────────────────────────────
// Shared between mobile (2×2 grid) and desktop (1×4 row).
//
// Props:
//   label  {string}       – Card title (e.g. "Humidity")
//   value  {string|number}– Primary value
//   sub    {string}       – Optional unit / sub-label below the value
//   icon   {ReactNode}    – Optional icon rendered left of the value

export default function StatCard({ label, value, sub, icon }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <div className="stat-value-row">
        {icon && icon}
        <span className="stat-value">{value}</span>
      </div>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}
