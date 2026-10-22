import type { AgingBucket, ReportQuery } from "../services/reportService";

// Validated chart colours (CVD-safe pair; ordinal one-hue ramp for arrears age). Same as the PDF.
export const SERIES = { collected: "#2a78d6", expenses: "#eb6834" } as const;
export const AGING_COLORS: Record<AgingBucket, string> = { d0_30: "#86b6ef", d31_60: "#3987e5", d61_90: "#256abf", d90_plus: "#184f95" };
export const AGING_LABELS: Record<AgingBucket, string> = {
  d0_30: "0–30 days",
  d31_60: "31–60 days",
  d61_90: "61–90 days",
  d90_plus: "Over 90 days",
};

export const formatMoney = (currency: string, n: number) => `${currency} ${Math.round(n).toLocaleString("en-US")}`;

/** The period a search lands on by default: this month. */
export function defaultReportQuery(now = new Date()): ReportQuery {
  return { period: "month", year: now.getFullYear(), index: now.getMonth() + 1 };
}

export function parseReportSearch(search: Record<string, unknown>): ReportQuery {
  const fallback = defaultReportQuery();
  const period = (["month", "quarter", "year"] as const).find((p) => p === search.period) ?? fallback.period;
  const year = Number(search.year) || fallback.year;
  const max = period === "quarter" ? 4 : 12;
  const rawIndex = Number(search.index);
  const index = rawIndex >= 1 && rawIndex <= max ? Math.floor(rawIndex) : period === "quarter" ? Math.ceil(fallback.index / 3) : fallback.index;
  const propertyId = Number(search.propertyId) || undefined;
  return { period, year, index: period === "year" ? 1 : index, ...(propertyId ? { propertyId } : {}) };
}

