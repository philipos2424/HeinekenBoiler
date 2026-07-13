import { useEffect, useState } from 'react';

function StatTile({ label, value, sub }) {
  return (
    <div className="ad-tile">
      <p className="ad-tile-label">{label}</p>
      <p className="ad-tile-value">{value.toLocaleString()}</p>
      {sub && <p className="ad-tile-sub">{sub}</p>}
    </div>
  );
}

function TrendChart({ trend }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...trend.map((t) => t.count));
  const width = 640;
  const height = 160;
  const barGap = 4;
  const barWidth = (width - barGap * (trend.length - 1)) / trend.length;

  return (
    <div className="ad-chart">
      <p className="ad-tile-label">RSVPs — Last 14 Days</p>
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="ad-chart-svg" role="img" aria-label="RSVPs received per day over the last 14 days">
        <line x1="0" y1={height} x2={width} y2={height} stroke="#e5e5e5" strokeWidth="1" />
        {trend.map((t, i) => {
          const barHeight = (t.count / max) * (height - 8);
          const x = i * (barWidth + barGap);
          const y = height - barHeight;
          return (
            <g key={t.date}>
              <rect
                x={x}
                y={barHeight > 0 ? y : height - 2}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={Math.min(3, barWidth / 2)}
                fill={hover === i ? '#0f3d26' : '#00843d'}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              />
              <rect x={x} y={0} width={barWidth} height={height} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover((h) => (h === i ? null : h))} />
              {(i === 0 || i === trend.length - 1 || hover === i) && (
                <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" fontSize="9" fill="#999999">
                  {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="ad-chart-tooltip">
          {trend[hover].count} on {new Date(trend[hover].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/analytics', { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="ad-empty">Couldn't load analytics. Please refresh to try again.</p>;
  if (!data) return <p className="ad-empty">Loading analytics…</p>;

  const { totals } = data;
  const checkedInPct = totals.accepted > 0 ? Math.round((totals.checkedIn / totals.accepted) * 100) : 0;

  return (
    <div>
      <div className="ad-tiles">
        <StatTile label="Total Responses" value={totals.total} sub={`${totals.noResponse} unresponded`} />
        <StatTile label="Accepted" value={totals.accepted} />
        <StatTile label="Declined" value={totals.declined} />
        <StatTile label="Checked In" value={totals.checkedIn} sub={`${checkedInPct}% of accepted`} />
      </div>
      <div className="ad-chart-wrap">
        <TrendChart trend={data.trend} />
      </div>
    </div>
  );
}
