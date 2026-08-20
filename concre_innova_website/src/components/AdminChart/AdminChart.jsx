import "./AdminChart.css";
import { useCallback, useId, useMemo, useState } from "react";

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

function normalizeItems(data) {
  return (Array.isArray(data) ? data : [])
    .filter(Boolean)
    .map((item) => ({ ...item, value: Number(item.value) || 0 }));
}

/**
 * Redondea el maximo del eje a una escala legible (1, 2 o 5 por decada) para
 * que las marcas del eje no queden en cifras arbitrarias.
 */
function buildAxisMax(maxValue) {
  if (maxValue <= 0) {
    return 1;
  }

  const magnitud = 10 ** Math.floor(Math.log10(maxValue));
  const normalizado = maxValue / magnitud;
  const paso = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;

  return paso * magnitud;
}

function useChartTooltip() {
  const [tooltip, setTooltip] = useState(null);

  const show = useCallback((punto) => setTooltip(punto), []);
  const hide = useCallback(() => setTooltip(null), []);

  return { tooltip, show, hide };
}

function ChartTooltip({ tooltip }) {
  if (!tooltip) {
    return null;
  }

  return (
    <div
      className="admin-chart-tooltip"
      style={{ left: `${tooltip.left}%`, top: `${tooltip.top}%` }}
      role="presentation"
    >
      <strong>{tooltip.value}</strong>
      <span>{tooltip.label}</span>
    </div>
  );
}

/** Tabla equivalente, oculta visualmente, para tecnologia de asistencia. */
function ChartDataTable({ id, caption, items, valueFormatter }) {
  return (
    <table className="admin-chart-table" id={id}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Concepto</th>
          <th scope="col">Valor</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={`${item.label}-${index}`}>
            <th scope="row">{item.label}</th>
            <td>{formatValue(item.value, valueFormatter)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function BarChart({
  data,
  valueFormatter,
  emptyMessage = "Sin datos para mostrar.",
  ariaLabel = "Gráfico de barras",
  showAverage = true,
}) {
  const items = useMemo(() => normalizeItems(data), [data]);
  const tableId = useId();
  const { tooltip, show, hide } = useChartTooltip();
  const [activeIndex, setActiveIndex] = useState(null);

  const geometria = useMemo(() => {
    if (items.length === 0) {
      return null;
    }

    const width = 760;
    const height = 280;
    const paddingLeft = 62;
    const paddingRight = 18;
    const paddingTop = 26;
    const paddingBottom = 42;
    const innerWidth = width - paddingLeft - paddingRight;
    const innerHeight = height - paddingTop - paddingBottom;

    const axisMax = buildAxisMax(Math.max(...items.map((item) => item.value), 0));
    const banda = innerWidth / items.length;
    const anchoBarra = Math.min(banda * 0.62, 64);
    const promedio =
      items.reduce((total, item) => total + item.value, 0) / items.length;

    const barras = items.map((item, index) => {
      const alto = Math.max((item.value / axisMax) * innerHeight, 2);

      return {
        ...item,
        index,
        x: paddingLeft + banda * index + (banda - anchoBarra) / 2,
        y: paddingTop + innerHeight - alto,
        centroX: paddingLeft + banda * index + banda / 2,
        alto,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      };
    });

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      innerWidth,
      innerHeight,
      axisMax,
      anchoBarra,
      promedio,
      barras,
      baseline: paddingTop + innerHeight,
    };
  }, [items]);

  if (!geometria) {
    return <p className="admin-chart-empty">{emptyMessage}</p>;
  }

  const {
    width,
    height,
    paddingLeft,
    paddingRight,
    axisMax,
    innerHeight,
    anchoBarra,
    promedio,
    barras,
    baseline,
  } = geometria;

  const marcas = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    valor: axisMax * ratio,
    y: baseline - innerHeight * ratio,
  }));

  const promedioY = baseline - (promedio / axisMax) * innerHeight;

  const activarBarra = (barra) => {
    setActiveIndex(barra.index);
    show({
      left: (barra.centroX / width) * 100,
      top: (barra.y / height) * 100,
      label: barra.label,
      value: formatValue(barra.value, valueFormatter),
    });
  };

  const limpiar = () => {
    setActiveIndex(null);
    hide();
  };

  return (
    <div className="admin-chart" onMouseLeave={limpiar}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="admin-chart-svg"
        role="img"
        aria-label={ariaLabel}
        aria-describedby={tableId}
      >
        {marcas.map((marca) => (
          <g key={marca.ratio}>
            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={marca.y}
              y2={marca.y}
              className="admin-chart-grid-line"
            />
            <text x={paddingLeft - 10} y={marca.y + 4} className="admin-chart-axis-label">
              {formatValue(marca.valor, valueFormatter)}
            </text>
          </g>
        ))}

        {barras.map((barra) => (
          <g
            key={`${barra.label}-${barra.index}`}
            className={`admin-chart-bar ${
              activeIndex !== null && activeIndex !== barra.index ? "is-dimmed" : ""
            }`.trim()}
            onMouseEnter={() => activarBarra(barra)}
            onFocus={() => activarBarra(barra)}
            onBlur={limpiar}
            tabIndex={0}
            role="presentation"
          >
            <rect
              x={barra.x}
              y={barra.y}
              width={anchoBarra}
              height={barra.alto}
              rx="6"
              fill={barra.color}
            />
            <text x={barra.centroX} y={barra.y - 8} className="admin-chart-bar-top">
              {formatValue(barra.value, valueFormatter)}
            </text>
            <text
              x={barra.centroX}
              y={baseline + 20}
              className="admin-chart-category-label"
            >
              {barra.label}
            </text>
          </g>
        ))}

        {showAverage && items.length > 1 && (
          <g>
            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={promedioY}
              y2={promedioY}
              className="admin-chart-average-line"
            />
            <text
              x={width - paddingRight}
              y={promedioY - 6}
              className="admin-chart-average-label"
              textAnchor="end"
            >
              Promedio {formatValue(promedio, valueFormatter)}
            </text>
          </g>
        )}

        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={baseline}
          y2={baseline}
          className="admin-chart-axis-line"
        />
      </svg>

      <ChartTooltip tooltip={tooltip} />
      <ChartDataTable
        id={tableId}
        caption={ariaLabel}
        items={items}
        valueFormatter={valueFormatter}
      />
    </div>
  );
}

export function LineChart({
  data,
  valueFormatter,
  height = 240,
  emptyMessage = "Sin datos para mostrar.",
  ariaLabel = "Gráfico de línea",
}) {
  const items = useMemo(() => normalizeItems(data), [data]);
  const tableId = useId();
  const { tooltip, show, hide } = useChartTooltip();

  if (items.length === 0) {
    return <p className="admin-chart-empty">{emptyMessage}</p>;
  }

  const width = 760;
  const paddingLeft = 62;
  const paddingRight = 22;
  const paddingTop = 26;
  const paddingBottom = 38;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const axisMax = buildAxisMax(Math.max(...items.map((item) => item.value), 0));
  const stepX = items.length > 1 ? innerWidth / (items.length - 1) : 0;
  const baseline = paddingTop + innerHeight;

  const points = items.map((item, index) => ({
    ...item,
    x: items.length === 1 ? paddingLeft + innerWidth / 2 : paddingLeft + stepX * index,
    y: baseline - (item.value / axisMax) * innerHeight,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  const marcas = [0, 0.5, 1].map((ratio) => ({
    ratio,
    valor: axisMax * ratio,
    y: baseline - innerHeight * ratio,
  }));

  return (
    <div className="admin-chart" onMouseLeave={hide}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="admin-chart-svg"
        role="img"
        aria-label={ariaLabel}
        aria-describedby={tableId}
      >
        {marcas.map((marca) => (
          <g key={marca.ratio}>
            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={marca.y}
              y2={marca.y}
              className="admin-chart-grid-line"
            />
            <text x={paddingLeft - 10} y={marca.y + 4} className="admin-chart-axis-label">
              {formatValue(marca.valor, valueFormatter)}
            </text>
          </g>
        ))}

        <path d={areaPath} className="admin-chart-line-area" />
        <path d={linePath} className="admin-chart-line-path" />

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" className="admin-chart-line-dot" />
            <circle
              cx={point.x}
              cy={point.y}
              r="16"
              className="admin-chart-point-hit"
              onMouseEnter={() =>
                show({
                  left: (point.x / width) * 100,
                  top: (point.y / height) * 100,
                  label: point.label,
                  value: formatValue(point.value, valueFormatter),
                })
              }
            />
            <text x={point.x} y={baseline + 20} className="admin-chart-category-label">
              {point.label}
            </text>
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

      <ChartTooltip tooltip={tooltip} />
      <ChartDataTable
        id={tableId}
        caption={ariaLabel}
        items={items}
        valueFormatter={valueFormatter}
      />
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
  height = 280,
  emptyMessage = "Sin datos para mostrar.",
  ariaLabel = "Gráfico de tendencia",
}) {
  const items = useMemo(() => normalizeItems(data), [data]);
  const tableId = useId();
  const { tooltip, show, hide } = useChartTooltip();

  if (items.length === 0) {
    return <p className="admin-chart-empty">{emptyMessage}</p>;
  }

  const width = 760;
  const paddingLeft = 78;
  const paddingRight = 34;
  const paddingTop = 36;
  const paddingBottom = 46;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const axisMax = buildAxisMax(Math.max(...items.map((item) => item.value), 0));

  const points = items.map((item, index) => ({
    ...item,
    x:
      items.length === 1
        ? paddingLeft + innerWidth / 2
        : paddingLeft + (innerWidth / (items.length - 1)) * index,
    y: paddingTop + innerHeight - (item.value / axisMax) * innerHeight,
  }));

  const baseline = paddingTop + innerHeight;
  const linePath = buildSmoothPath(points);

  const areaPath =
    items.length === 1
      ? `M ${points[0].x - innerWidth / 4} ${points[0].y}` +
        ` L ${points[0].x + innerWidth / 4} ${points[0].y}` +
        ` L ${points[0].x + innerWidth / 4} ${baseline}` +
        ` L ${points[0].x - innerWidth / 4} ${baseline} Z`
      : `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  const marcas = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    valor: axisMax * ratio,
    y: baseline - innerHeight * ratio,
  }));

  return (
    <div className="admin-chart" onMouseLeave={hide}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="admin-chart-svg"
        role="img"
        aria-label={ariaLabel}
        aria-describedby={tableId}
      >
        <defs>
          <linearGradient id="adminChartAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--laurel)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--laurel)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {marcas.map((marca) => (
          <g key={marca.ratio}>
            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={marca.y}
              y2={marca.y}
              className="admin-chart-grid-line"
            />
            <text x={paddingLeft - 12} y={marca.y + 4} className="admin-chart-axis-label">
              {formatValue(marca.valor, valueFormatter)}
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
            <circle
              cx={point.x}
              cy={point.y}
              r="18"
              className="admin-chart-point-hit"
              onMouseEnter={() =>
                show({
                  left: (point.x / width) * 100,
                  top: (point.y / height) * 100,
                  label: point.label,
                  value: formatValue(point.value, valueFormatter),
                })
              }
            />
            <text x={point.x} y={point.y - 16} className="admin-chart-area-value">
              {formatValue(point.value, valueFormatter)}
            </text>
            <text x={point.x} y={baseline + 26} className="admin-chart-area-month">
              {point.label}
            </text>
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

      <ChartTooltip tooltip={tooltip} />
      <ChartDataTable
        id={tableId}
        caption={ariaLabel}
        items={items}
        valueFormatter={valueFormatter}
      />
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
      <svg
        viewBox="0 0 180 180"
        role="img"
        aria-label={`${label || "Indicador"}: ${safePercentage.toFixed(0)} por ciento`}
      >
        <circle
          cx="90"
          cy="90"
          r={radius}
          className="admin-chart-donut-track"
          strokeWidth={strokeWidth}
        />
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
  showShare = true,
  totalLabel = "Total del periodo",
}) {
  const items = useMemo(() => normalizeItems(data), [data]);

  if (items.length === 0) {
    return <p className="admin-chart-empty">{emptyMessage}</p>;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((suma, item) => suma + item.value, 0);

  return (
    <div className="admin-chart-hbars">
      {items.map((item, index) => {
        const widthPercentage = Math.max((item.value / maxValue) * 100, 2);
        const share = total > 0 ? (item.value / total) * 100 : 0;

        return (
          <div className="admin-chart-hbar-row" key={`${item.label}-${index}`}>
            <span className="admin-chart-hbar-rank" aria-hidden="true">
              {index + 1}
            </span>

            <span className="admin-chart-hbar-label" title={item.label}>
              {item.label}
            </span>

            <div
              className="admin-chart-hbar-track"
              role="img"
              aria-label={`${item.label}: ${formatValue(item.value, valueFormatter)}`}
            >
              <div
                className="admin-chart-hbar-fill"
                style={{
                  width: `${widthPercentage}%`,
                  background: SERIES_COLORS[index % SERIES_COLORS.length],
                }}
              />
            </div>

            <span className="admin-chart-hbar-value">
              <strong>{formatValue(item.value, valueFormatter)}</strong>
              {showShare && total > 0 && (
                <span className="admin-chart-hbar-share">{share.toFixed(1)}%</span>
              )}
            </span>
          </div>
        );
      })}

      {showShare && total > 0 && (
        <p className="admin-chart-hbars-total">
          <span>{totalLabel}</span>
          <strong>{formatValue(total, valueFormatter)}</strong>
        </p>
      )}
    </div>
  );
}
