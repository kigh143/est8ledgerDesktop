import apiClient from "./api";
import type { TaxpayerType } from "../types";

export type TaxYear = { startYear: number; label: string; start: string; end: string };

export type TaxRule = {
  id: number;
  taxpayerType: TaxpayerType;
  ratePercent: number;
  taxFreeThreshold: number;
  expensesDeductible: boolean;
  maxExpenseDeductionPercent: number | null;
  taxYearStartMonth: number;
  effectiveFrom: string;
  filingNotes: string | null;
  sourceUrl: string | null;
};

export type TaxBreakdown = {
  grossIncome: number;
  taxFreeThreshold: number;
  expensesClaimed: number;
  expenseDeduction: number;
  chargeableIncome: number;
  tax: number;
  netIncome: number;
  effectiveRatePercent: number;
};

export type TaxEstimateGroup = {
  country: { id: number; name: string };
  currency: string;
  taxYear: TaxYear;
  /** null when no rule is set up for this country yet */
  rule: TaxRule | null;
  income: { collectedToDate: number; expectedRemaining: number; projectedAnnual: number; annualRentRoll: number };
  paidExpensesToDate: number;
  taxSoFar: TaxBreakdown | null;
  projectedTax: TaxBreakdown | null;
  monthlySetAside: number | null;
  properties: { id: number; name: string; collectedToDate: number; projectedAnnual: number; paidExpensesToDate: number }[];
};

export type TaxEstimate = {
  /** True until the landlord says whether they're a solo landlord or a business */
  needsTaxpayerType: boolean;
  taxpayerType: TaxpayerType | null;
  generatedAt: string;
  groups: TaxEstimateGroup[];
  disclaimer: string;
};

export type PriceOutcome = {
  monthlyRent: number;
  annualRent: number;
  annualTax: number;
  annualNetIncome: number;
  monthlyNetIncome: number;
  effectiveRatePercent: number;
};

export type MarketComparison = {
  level: "district" | "city" | null;
  area: string | null;
  propertyType: string | null;
  stats: { count: number; min: number; median: number; average: number; max: number } | null;
  enoughData: boolean;
};

export type PricingResult = {
  needsTaxpayerType: boolean;
  taxpayerType: TaxpayerType | null;
  country: { id: number; name: string };
  currency: string;
  taxYear: TaxYear | null;
  rule: TaxRule | null;
  /** The priced rent is treated as on top of this */
  context: { otherAnnualRent: number; otherAnnualExpenses: number; annualExpenses: number };
  atPrice: (PriceOutcome & { comparedToMedianPercent: number | null }) | null;
  forTargetNet: PriceOutcome | null;
  market: MarketComparison;
  disclaimer: string;
};

export type PricingQuery = {
  propertyId: number;
  taxpayerType?: TaxpayerType;
  monthlyRent?: number;
  targetMonthlyNet?: number;
  annualExpenses?: number;
};

const defined = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null));

export const rentalTaxService = {
  /** GET /rental-tax/estimate — the landlord's tax for a tax year, per country and currency. */
  estimate: async (query: { taxpayerType?: TaxpayerType; taxYear?: number }): Promise<TaxEstimate> => {
    const response = await apiClient.get("/rental-tax/estimate", { params: defined(query) });
    return response.data;
  },

  /** GET /rental-tax/pricing — tax at a rent, rent for a take-home target, and market rents nearby. */
  pricing: async (query: PricingQuery): Promise<PricingResult> => {
    const response = await apiClient.get("/rental-tax/pricing", { params: defined(query) });
    return response.data;
  },
};

/** The landlord's last solo/business choice, so we don't ask on every visit. */
const TYPE_KEY = "est8ledger.taxpayerType";

export const rememberedTaxpayerType = (): TaxpayerType | undefined => {
  try {
    const v = localStorage.getItem(TYPE_KEY);
    return v === "INDIVIDUAL" || v === "COMPANY" ? v : undefined;
  } catch {
    return undefined;
  }
};

export const rememberTaxpayerType = (type: TaxpayerType) => {
  try {
    localStorage.setItem(TYPE_KEY, type);
  } catch {
    // Private mode: the choice just isn't remembered
  }
};

export const parseTaxpayerType = (v: unknown): TaxpayerType | undefined =>
  v === "INDIVIDUAL" || v === "COMPANY" ? v : undefined;

export default rentalTaxService;
