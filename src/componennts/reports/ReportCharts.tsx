import { useState } from "react";
import type { AgingBucket, ReportBody } from "../../services/reportService";
import { AGING_COLORS, AGING_LABELS, formatMoney, SERIES } from "../../utils/reportFormat";

const compact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${+(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
};

/** Rounds the axis top up to a clean 1/2/2.5/5 × 10ⁿ so ticks read as round numbers. */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * exp >= value) ?? 10;
  return step * exp;
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Rent collected vs expenses per month — grouped columns on one axis, hover for exact figures. */
export function TrendChart({ trend, currency }: { trend: ReportBody["trend"]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 220;
  const pad = { top: 12, right: 8, bottom: 26, left: 44 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const max = niceMax(Math.max(...trend.flatMap((t) => [t.collected, t.expenses])));
  const band = plotW / trend.length;
  const bar = Math.min(24, (band - 12) / 2);
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  // A column with a 4px rounded top and a square base.
  const column = (x: number, v: number) => {
    const h = Math.max(0, (v / max) * plotH);
    if (h === 0) return "";
    const r = Math.min(4, h, bar / 2);
    const top = pad.top + plotH - h;
    const base = pad.top + plotH;
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + bar - r} Q${x + bar},${top} ${x + bar},${top + r} V${base} Z`;
  };
  const active = hover === null ? null : trend[hover];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Legend items={[{ label: "Rent collected", color: SERIES.collected }, { label: "Expenses", color: SERIES.expenses }]} />
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Rent collected and expenses by month">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#e5e5ea" strokeWidth={1} />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[10px] tabular-nums">
                {compact(t)}
              </text>
            </g>
          ))}
          {trend.map((t, i) => {
            const x0 = pad.left + i * band + (band - bar * 2 - 2) / 2;
            return (
              <g key={t.label}>
                {hover === i && <rect x={pad.left + i * band} y={pad.top} width={band} height={plotH} fill="#f5f5f7" />}
                <path d={column(x0, t.collected)} fill={SERIES.collected} />
                <path d={column(x0 + bar + 2, t.expenses)} fill={SERIES.expenses} />
                <text x={pad.left + i * band + band / 2} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[10px]">
                  {trend.length > 6 ? t.label.slice(0, 3) : t.label}
                </text>
                {/* The hit target is the whole month band, wider than the bars. */}
                <rect
                  x={pad.left + i * band}
                  y={pad.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
        {active && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-48 -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur"
            style={{ left: `${Math.min(85, Math.max(15, ((pad.left + (hover + 0.5) * band) / W) * 100))}%` }}
          >
            <p className="mb-1.5 font-semibold text-slate-900">{active.label}</p>
            {[
              { label: "Rent collected", value: active.collected, color: SERIES.collected },
              { label: "Expenses", value: active.expenses, color: SERIES.expenses },
            ].map((row) => (
              <p key={row.label} className="flex items-center justify-between gap-2 text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[2px]" style={{ background: row.color }} />
                  {row.label}
                </span>
                <span className="font-medium tabular-nums text-slate-900">{formatMoney(currency, row.value)}</span>
              </p>
            ))}
            <p className="mt-1.5 flex justify-between border-t border-slate-100 pt-1.5 text-slate-500">
              <span>Expected rent</span>
              <span className="tabular-nums">{formatMoney(currency, active.expected)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Expense categories as horizontal bars — one series, so no legend; values sit at the bar tips. */
export function CategoryBars({ items, currency }: { items: { category: string; amount: number }[]; currency: string }) {
  const max = Math.max(1, ...items.map((i) => i.amount));
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.category} className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm" title={formatMoney(currency, i.amount)}>
          <span className="truncate text-slate-600">{i.category.charAt(0) + i.category.slice(1).toLowerCase()}</span>
          <span className="flex items-center gap-2">
            <span className="h-3 rounded-r-[4px]" style={{ width: `${Math.max(2, (i.amount / max) * 75)}%`, background: SERIES.expenses }} />
            <span className="shrink-0 tabular-nums text-xs text-slate-700">{formatMoney(currency, i.amount)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Arrears split by age as one stacked bar, light (recent) to dark (oldest). */
export function AgingBar({ aging, total, currency }: { aging: Record<AgingBucket, number>; total: number; currency: string }) {
  const buckets = Object.keys(AGING_LABELS) as AgingBucket[];
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px] bg-slate-100">
        {buckets.map((b) =>
          aging[b] > 0 ? (
            <span
              key={b}
              title={`${AGING_LABELS[b]}: ${formatMoney(currency, aging[b])}`}
              style={{ width: `${(aging[b] / total) * 100}%`, background: AGING_COLORS[b] }}
            />
          ) : null,
        )}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {buckets.map((b) => (
          <div key={b}>
            <dt className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: AGING_COLORS[b] }} />
              {AGING_LABELS[b]}
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">{formatMoney(currency, aging[b])}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
