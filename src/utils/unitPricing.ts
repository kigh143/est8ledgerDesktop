import type { UnitPriceGroup } from "../types";

/** One editable row; inputs stay strings so half-typed values aren't lost */
export interface UnitPriceRow {
  key: string;
  count: string;
  monthlyRent: string;
  label: string;
}

let nextKey = 0;
export const newUnitPriceRow = (over: Partial<UnitPriceRow> = {}): UnitPriceRow => ({
  key: `row-${nextKey++}`,
  count: "",
  monthlyRent: "",
  label: "",
  ...over,
});

/** "400,000" and "400000" both read as 400000; anything else is NaN */
export const parseAmount = (value: string): number => {
  const cleaned = value.replace(/[,\s]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
};

export const rowsFromUnitPricing = (groups?: UnitPriceGroup[] | null): UnitPriceRow[] =>
  (groups ?? []).map((g) =>
    newUnitPriceRow({ count: String(g.count), monthlyRent: String(g.monthlyRent), label: g.label ?? "" }),
  );

const isComplete = (r: UnitPriceRow) => {
  const count = Number(r.count);
  const rent = parseAmount(r.monthlyRent);
  return Number.isInteger(count) && count > 0 && Number.isFinite(rent) && rent >= 0;
};

/** Rows left fully blank are ignored; a row with only some fields filled is an error */
export const isBlankRow = (r: UnitPriceRow) => !r.count.trim() && !r.monthlyRent.trim() && !r.label.trim();

export const unitPricingFromRows = (rows: UnitPriceRow[]): UnitPriceGroup[] =>
  rows.filter(isComplete).map((r) => ({
    count: Number(r.count),
    monthlyRent: parseAmount(r.monthlyRent),
    ...(r.label.trim() ? { label: r.label.trim() } : {}),
  }));

export interface UnitPricingSummary {
  pricedUnits: number;
  monthlyRent: number;
  annualRent: number;
  incompleteRows: number;
}

export const summariseRows = (rows: UnitPriceRow[]): UnitPricingSummary => {
  const groups = unitPricingFromRows(rows);
  const monthlyRent = groups.reduce((s, g) => s + g.count * g.monthlyRent, 0);
  return {
    pricedUnits: groups.reduce((s, g) => s + g.count, 0),
    monthlyRent,
    annualRent: monthlyRent * 12,
    incompleteRows: rows.filter((r) => !isBlankRow(r) && !isComplete(r)).length,
  };
};

/** null when the rows can be saved, otherwise what to fix */
export const unitPricingError = (rows: UnitPriceRow[], totalUnits: number): string | null => {
  const { pricedUnits, incompleteRows } = summariseRows(rows);
  if (incompleteRows > 0) return "Each unit price row needs a number of units and a monthly rent.";
  if (totalUnits > 0 && pricedUnits > totalUnits)
    return `You've priced ${pricedUnits} units but the property has ${totalUnits}.`;
  return null;
};
