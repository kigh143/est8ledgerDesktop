import { Plus, Trash2 } from "lucide-react";
import { Badge } from "../dashboard/ui";
import { newUnitPriceRow, summariseRows, unitPricingError, type UnitPriceRow } from "../../utils/unitPricing";

interface UnitPricingEditorProps {
  rows: UnitPriceRow[];
  onChange: (rows: UnitPriceRow[]) => void;
  totalUnits: number;
  currency: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

/** Groups of identical units and what each lets for, e.g. 3 × 400,000 and 2 × 500,000. */
export default function UnitPricingEditor({ rows, onChange, totalUnits, currency }: UnitPricingEditorProps) {
  const summary = summariseRows(rows);
  const error = unitPricingError(rows, totalUnits);
  const remaining = totalUnits - summary.pricedUnits;

  const update = (key: string, patch: Partial<UnitPriceRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => onChange(rows.filter((r) => r.key !== key));
  const add = () =>
    onChange([...rows, newUnitPriceRow({ count: remaining > 0 ? String(remaining) : "" })]);

  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[6rem_1fr_1fr_2.5rem] gap-2 px-1 text-xs font-medium text-slate-500">
            <span>Units</span>
            <span>Rent per unit / month ({currency})</span>
            <span>Label (optional)</span>
            <span />
          </div>
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-[5rem_1fr_2.5rem] sm:grid-cols-[6rem_1fr_1fr_2.5rem] gap-2 items-center"
            >
              <input
                type="number"
                min="1"
                inputMode="numeric"
                aria-label="Number of units"
                placeholder="3"
                value={row.count}
                onChange={(e) => update(row.key, { count: e.target.value })}
                className="field tabular-nums"
              />
              <input
                type="text"
                inputMode="decimal"
                aria-label="Monthly rent per unit"
                placeholder="400,000"
                value={row.monthlyRent}
                onChange={(e) => update(row.key, { monthlyRent: e.target.value })}
                className="field tabular-nums"
              />
              <input
                type="text"
                maxLength={60}
                aria-label="Label"
                placeholder="e.g. 1-bed"
                value={row.label}
                onChange={(e) => update(row.key, { label: e.target.value })}
                className="field col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto"
              />
              <button
                type="button"
                onClick={() => remove(row.key)}
                aria-label="Remove row"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-[#ff3b30]/10 hover:text-[#d70015] transition-colors row-start-1 col-start-3 sm:col-start-auto"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={add} className="btn btn-tinted">
        <Plus size={16} />
        {rows.length ? "Add another price" : "Add unit prices"}
      </button>

      {summary.pricedUnits > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          {totalUnits > 0 && (
            <Badge tone={remaining === 0 ? "emerald" : remaining > 0 ? "amber" : "red"}>
              Priced {summary.pricedUnits} of {totalUnits}
            </Badge>
          )}
          <span className="text-slate-600">
            Fully let:{" "}
            <span className="font-semibold text-slate-900 tabular-nums">
              {currency} {fmt(summary.monthlyRent)}
            </span>{" "}
            / month ·{" "}
            <span className="font-semibold text-slate-900 tabular-nums">
              {currency} {fmt(summary.annualRent)}
            </span>{" "}
            / year
          </span>
        </div>
      )}

      {error ? (
        <p className="text-sm text-[#d70015]">{error}</p>
      ) : (
        remaining > 0 &&
        summary.pricedUnits > 0 && (
          <p className="text-sm text-slate-500">
            {remaining} unit{remaining === 1 ? " has" : "s have"} no price yet and won't count in the
            full-occupancy tax estimate.
          </p>
        )
      )}
    </div>
  );
}
