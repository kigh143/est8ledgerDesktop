import apiClient from "./api";
import type { Expense } from "../types";

export const expenseService = {
  getPropertyExpenses: async (propertyId: string) => {
    const response = await apiClient.get(`/expenses/property/${propertyId}`);
    return response.data;
  },

  getExpense: async (expenseId: string) => {
    const response = await apiClient.get(`/expenses/${expenseId}`);
    return response.data;
  },

  createExpense: async (expenseData: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    const response = await apiClient.post("/expenses", expenseData);
    return response.data;
  },

  updateExpense: async (expenseId: string, expenseData: Partial<Expense>) => {
    const response = await apiClient.put(`/expenses/${expenseId}`, expenseData);
    return response.data;
  },

  deleteExpense: async (expenseId: string) => {
    const response = await apiClient.delete(`/expenses/${expenseId}`);
    return response.data;
  },

  approveExpense: async (expenseId: string) => {
    const response = await apiClient.put(`/expenses/${expenseId}/approve`, {});
    return response.data;
  },

  rejectExpense: async (expenseId: string, reason?: string) => {
    const response = await apiClient.put(`/expenses/${expenseId}/reject`, { reason });
    return response.data;
  },

  markAsPaid: async (expenseId: string) => {
    const response = await apiClient.put(`/expenses/${expenseId}/mark-paid`, {});
    return response.data;
  },

  uploadReceipt: async (expenseId: string, file: File) => {
    const formData = new FormData();
    formData.append("receipt", file);
    const response = await apiClient.post(`/expenses/${expenseId}/upload-receipt`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  createExpenseWithPayload: async (payload: {
    amount: number;
    status: string;
    category: string;
    description: string;
    notes: string;
    propertyAgreementId: number;
    isPaid: boolean;
  }) => {
    const response = await apiClient.post("/expenses", payload);
    return response.data;
  },

  getExpensesByStatus: async (propertyAgreementId: string, status: string) => {
    const response = await apiClient.get(`/expenses/property/${propertyAgreementId}/status/${status}`);
    return response.data;
  },

  getExpensesByCategory: async (propertyAgreementId: string, category: string) => {
    const response = await apiClient.get(`/expenses/property/${propertyAgreementId}/category/${category}`);
    return response.data;
  },

  getExpenseSummary: async (propertyAgreementId: string) => {
    const response = await apiClient.get(`/expenses/property/${propertyAgreementId}/summary`);
    return response.data;
  },
};

export default expenseService;
