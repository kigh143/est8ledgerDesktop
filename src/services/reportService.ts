import apiClient from "./api";
import { saveBlob } from "../utils/download";

export type ReportGranularity = "month" | "quarter" | "year";

export type ReportQuery = {
  period: ReportGranularity;
  year: number;
  /** Month 1–12 or quarter 1–4; ignored for a year */
  index: number;
  /** Leave out for all properties combined */
  propertyId?: number;
};

export type AgingBucket = "d0_30" | "d31_60" | "d61_90" | "d90_plus";

export type RentRollRow = {
  propertyName: string;
  tenancyId: number;
  tenantName: string;
  unit: string;
  monthlyRent: number;
  expected: number;
  collected: number;
  balance: number;
  arrears: number;
  monthsUnpaid: number;
  daysOverdue: number;
};

export type Movement = { propertyName: string; tenantName: string; unit: string; date: string };

export type Headline = {
  income: number;
  expenses: number;
  netOperatingIncome: number;
  collectionRate: number | null;
  occupancyRate: number | null;
  arrears: number;
};

export type ReportBody = {
  income: {
    rentCollected: number;
    lateFeesCharged: number;
    expensesByCategory: { category: string; amount: number }[];
    totalExpenses: number;
    pendingExpenses: number;
    netOperatingIncome: number;
    margin: number | null;
  };
  rent: {
    expected: number;
    collected: number;
    collectionRate: number | null;
    arrears: number;
    aging: Record<AgingBucket, number>;
    tenantsInArrears: number;
    rows: RentRollRow[];
  };
  occupancy: {
    units: number;
    occupied: number;
    vacant: number;
    occupancyRate: number | null;
    averageOccupancyRate: number | null;
    moveIns: Movement[];
    moveOuts: Movement[];
    notices: Movement[];
  };
  repairs: {
    opened: number;
    completed: number;
    openAtEnd: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    managementCost: number;
    tenantChargeable: number;
    averageDaysToComplete: number | null;
    items: { propertyName: string; title: string; unit: string | null; status: string; priority: string; amount: number; openedAt: string }[];
  };
  deposits: {
    heldAtEnd: number;
    tenanciesWithDeposit: number;
    collected: number;
    settled: number;
    settledCount: number;
    deductions: number;
  };
  trend: { label: string; year: number; month: number; expected: number; collected: number; expenses: number }[];
  previous: Headline & { label: string };
};

export type CurrencyGroup = ReportBody & {
  currency: string;
  propertyCount: number;
  comparison: ({ propertyId: number; name: string } & Headline)[];
};

export type PropertyReport = ReportBody & {
  property: { id: number; name: string; address: string; city: string; currency: string };
};

export type PortfolioReport = {
  period: { granularity: ReportGranularity; year: number; index: number; label: string; start: string; end: string; previousLabel: string };
  generatedAt: string;
  asOf: string;
  scope: { propertyId: number | null; name: string };
  owner: { name: string; email: string | null };
  groups: CurrencyGroup[];
  properties: PropertyReport[];
  availableProperties: { id: number; name: string; currency: string }[];
};

const params = (q: ReportQuery) => ({
  period: q.period,
  year: q.year,
  ...(q.period === "year" ? {} : { index: q.index }),
  ...(q.propertyId ? { propertyId: q.propertyId } : {}),
});

// A year across many properties takes a few seconds to add up.
const LONG = { timeout: 60_000 };

export const reportService = {
  get: async (query: ReportQuery): Promise<PortfolioReport> => {
    const response = await apiClient.get("/reports", { params: params(query), ...LONG });
    return response.data;
  },

  /** Downloads the PDF and hands it to the browser as a file. */
  downloadPdf: async (query: ReportQuery) => {
    const response = await apiClient.get("/reports/pdf", { params: params(query), responseType: "blob", ...LONG });
    const disposition: string = response.headers["content-disposition"] ?? "";
    const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "est8ledger-report.pdf";
    saveBlob(response.data as Blob, filename);
  },
};

export default reportService;
