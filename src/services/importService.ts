import apiClient from "./api";
import type { ImportPayload, SheetKey } from "../utils/importTemplate";

export type ImportIssue = { row: number; column?: string; message: string };

export type ImportReport = {
  ok: boolean;
  sheets: Record<SheetKey, { total: number; valid: number; errors: ImportIssue[]; warnings: ImportIssue[] }>;
  summary: {
    properties: number;
    tenants: number;
    newTenantAccounts: number;
    existingTenantAccounts: number;
    rentPayments: number;
    expenses: number;
    repairs: number;
  };
};

export type ExtractedField<T> = { value: T; evidence: string };

export type AgreementExtraction = {
  pageCount: number;
  sectionCount: number;
  terms: Partial<{
    propertyName: ExtractedField<string>;
    propertyAddress: ExtractedField<string>;
    currency: ExtractedField<string>;
    monthlyRent: ExtractedField<number>;
    terminationNoticeDays: ExtractedField<number>;
    securityDepositMonths: ExtractedField<number>;
    initialAdvanceMonths: ExtractedField<number>;
    rentIncreaseNoticeDays: ExtractedField<number>;
  }>;
  matchedClauses: {
    clauseId: number;
    title: string;
    score: number;
    confidence: "high" | "medium";
    sectionHeading: string;
    excerpt: string;
  }[];
  otherClauses: { clauseId: number; title: string; description: string | null }[];
  customClauseSuggestions: { title: string; description: string }[];
};

// Large workbooks take a while to check and write; the default 10s client timeout is too short.
const LONG = { timeout: 120_000 };

export const importService = {
  validate: async (payload: ImportPayload): Promise<ImportReport> => {
    const response = await apiClient.post("/imports/validate", payload, LONG);
    return response.data;
  },

  commit: async (payload: ImportPayload): Promise<ImportReport> => {
    const response = await apiClient.post("/imports/commit", payload, LONG);
    return response.data;
  },

  extractAgreement: async (file: File): Promise<AgreementExtraction> => {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.post("/imports/agreement-pdf", form, LONG);
    return response.data;
  },
};

export default importService;
