import "./AdminChart.css";

const SERIES_COLORS = [
  "var(--laurel)",
  "var(--clay)",
  "var(--forest-500)",
  "var(--sage)",
  "var(--terracotta-dark)",
  "var(--forest-800)",
];

function formatValue(value, formatter) {
  if (typeof formatter === "function") {
    return formatter(value);
  }

  return Number(value).toLocaleString("es-CR", { maximumFractionDigits: 2 });
}

export function BarChart({ data, valueFormatter, emptyMessage = "Sin datos para mostrar." }) {
  const items = Array.isArray(data) ? data.filter((item) => item) : [];

  if (items.length === 0) {
    return <p className="admin-chart-empty">{emptyMessage}</p>;
  }

  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="admin-chart-bars">
      {items.map((item, index) => {
        const value = Number(item.value) || 0;
        const heightPercentage = Math.max((value / maxValue) * 100, 2);

        return (
          <div className="admin-chart-bar-column" key={`${item.label}-${index}`}>
            <span className="admin-chart-bar-value">
              {formatValue(value, valueFormatter)}
            </span>
            <div className="admin-chart-bar-track">
              <div
                className="admin-chart-bar-fill"
                style={{
                  height: `${heightPercentage}%`,
                  background: SERIES_COLORS[index % SERIES_COLORS.length],
                }}
                title={`${item.label}: ${formatValue(value, valueFormatter)}`}
              ></div>
            </div>
            <span className="admin-chart-bar-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function LineChart({
  data,
  valueFormatter,
  height = 220,
  emptyMessage = "Sin datos para mostrar.",
}) {
  const items = Array.isArray(data) ? data.filter((item) => item) : [];

  if (items.length === 0) {
    return <p className="admin-chart-empty">{emptyMessage}</p>;
  }

  const width = 720;
  const paddingX = 48;
  const paddingY = 28;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const values = items.map((item) => Number(item.value) || 0);
  const maxValue = Math.max(...values, 1);
  const stepX = items.length > 1 ? innerWidth / (items.length - 1) : 0;

  const points = items.map((item, index) => {
    const value = Number(item.value) || 0;
    const x = paddingX + stepX * index;
    const y = paddingY + innerHeight - (value / maxValue) * innerHeight;
    return { x, y, value, label: item.label };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath =
    `${linePath} L ${points[points.length - 1].x} ${paddingY + innerHeight}` +
    ` L ${points[0].x} ${paddingY + innerHeight} Z`;

  return (
    <div className="admin-chart-line-wrapper">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="admin-chart-line"
        role="img"
        aria-label="Grafico de linea"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingY + innerHeight * ratio;
          return (
            <line
              key={ratio}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              className="admin-chart-grid-line"
            />
          );
        })}

        <path d={areaPath} className="admin-chart-line-area" />
        <path d={linePath} className="admin-chart-line-path" />

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" className="admin-chart-line-dot" />
            <title>{`${point.label}: ${formatValue(point.value, valueFormatter)}`}</title>
          </g>
        ))}
      </svg>

      <div className="admin-chart-line-labels">
        {points.map((point, index) => (
          <span key={`${point.label}-label-${index}`}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function buildSmoothPath(points) {
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;

    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export function AreaChart({
  data,
  valueFormatter,
  height = 260,
  emptyMessage = "Sin datos para mostrar.",
}) {
  const items = Array.isArray(data) ? data.filter((item) => item) : [];

  if (items.length === 0) {
    return <p className="admin-chart-empty">{emptyMessage}</p>;
  }

  const width = 760;
  const paddingLeft = 78;
  const paddingRight = 34;
  const paddingTop = 34;
  const paddingBottom = 46;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const values = items.map((item) => Number(item.value) || 0);
  const rawMax = Math.max(...values, 0);
  const maxValue = rawMax > 0 ? rawMax * 1.15 : 1;

  const points = items.map((item, index) => {
    const value = Number(item.value) || 0;
    const x =
      items.length === 1
        ? paddingLeft + innerWidth / 2
        : paddingLeft + (innerWidth / (items.length - 1)) * index;
    const y = paddingTop + innerHeight - (value / maxValue) * innerHeight;

    return { x, y, value, label: item.label };
  });

  const baseline = paddingTop + innerHeight;
  const linePath = buildSmoothPath(points);

  const areaPath =
    items.length === 1
      ? `M ${points[0].x - innerWidth / 4} ${points[0].y}` +
        ` L ${points[0].x + innerWidth / 4} ${points[0].y}` +
        ` L ${points[0].x + innerWidth / 4} ${baseline}` +
        ` L ${points[0].x - innerWidth / 4} ${baseline} Z`
      : `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  const ticks = [0, 0.5, 1].map((ratio) => ({
    ratio,
    value: maxValue * ratio,
    y: paddingTop + innerHeight - innerHeight * ratio,
  }));

  return (
    <div className="admin-chart-area-wrapper">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="admin-chart-area-svg"
        role="img"
        aria-label="Grafico de tendencia"
      >
        <defs>
          <linearGradient id="adminChartAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--laurel)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--laurel)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick.ratio}>
            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={tick.y}
              y2={tick.y}
              className="admin-chart-grid-line"
            />
            <text x={paddingLeft - 12} y={tick.y + 4} className="admin-chart-axis-label">
              {formatValue(tick.value, valueFormatter)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#adminChartAreaFill)" />

        {items.length === 1 ? (
          <line
            x1={points[0].x - innerWidth / 4}
            x2={points[0].x + innerWidth / 4}
            y1={points[0].y}
            y2={points[0].y}
            className="admin-chart-area-line"
          />
        ) : (
          <path d={linePath} className="admin-chart-area-line" fill="none" />
        )}

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="6" className="admin-chart-area-dot" />
            <text x={point.x} y={point.y - 16} className="admin-chart-area-value">
              {formatValue(point.value, valueFormatter)}
            </text>
            <text x={point.x} y={baseline + 26} className="admin-chart-area-month">
              {point.label}
            </text>
            <title>{`${point.label}: ${formatValue(point.value, valueFormatter)}`}</title>
          </g>
        ))}

        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={baseline}
          y2={baseline}
          className="admin-chart-axis-line"
        />
      </svg>
    </div>
  );
}

export function DonutChart({ percentage, label, caption }) {
  const safePercentage = Math.min(Math.max(Number(percentage) || 0, 0), 100);
  const radius = 70;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  const filled = (safePercentage / 100) * circumference;

  return (
    <div className="admin-chart-donut">
      <svg viewBox="0 0 180 180" role="img" aria-label={label || "Grafico circular"}>
        <circle cx="90" cy="90" r={radius} className="admin-chart-donut-track" strokeWidth={strokeWidth} />
        <circle
          cx="90"
          cy="90"
          r={radius}
          className="admin-chart-donut-value"
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform="rotate(-90 90 90)"
        />
        <text x="90" y="86" className="admin-chart-donut-number">
          {safePercentage.toFixed(0)}%
        </text>
        {label && (
          <text x="90" y="108" className="admin-chart-donut-label">
            {label}
          </text>
        )}
      </svg>

      {caption && <p className="admin-chart-donut-caption">{caption}</p>}
    </div>
  );
}

export function HorizontalBars({
  data,
  valueFormatter,
  emptyMessage = "Sin datos para mostrar.",
}) {
  const items = Array.isArray(data) ? data.filter((item) => item) : [];

  if (items.length === 0) {
    return <p className="admin-chart-empty">{emptyMessage}</p>;
  }

  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="admin-chart-hbars">
      {items.map((item, index) => {
        const value = Number(item.value) || 0;
        const widthPercentage = Math.max((value / maxValue) * 100, 2);

        return (
          <div className="admin-chart-hbar-row" key={`${item.label}-${index}`}>
            <span className="admin-chart-hbar-label" title={item.label}>
              {item.label}
            </span>
            <div className="admin-chart-hbar-track">
              <div
                className="admin-chart-hbar-fill"
                style={{
                  width: `${widthPercentage}%`,
                  background: SERIES_COLORS[index % SERIES_COLORS.length],
                }}
              ></div>
            </div>
            <strong className="admin-chart-hbar-value">
              {formatValue(value, valueFormatter)}
            </strong>
          </div>
        );
      })}
    </div>
  );
}
