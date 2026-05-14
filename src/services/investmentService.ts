import apiClient from "./api";

// TypeScript interfaces for investment operations
export interface InvestmentProfitEntry {
  amount: number;
  createdAt: string; // ISO date string
  currency?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const investmentServices = {
  optIntoInvestment: async (tenancyId: string, data: any) => {
    const response = await apiClient.put(`/investment/${tenancyId}`, data);
    return response.data;
  },

  getInvestmentDetails: async (tenancyId: string) => {
    const response = await apiClient.get(`/investment/${tenancyId}`);
    return response.data;
  },

  getMontlyReturns: async (tenancyId: string) => {
    const response = await apiClient.get(`/investment/returns/${tenancyId}`);
    return response.data;
  },

  /**
   * Get investment profit history for a specific security deposit
   * GET /investment-profit/security-deposit/:id
   */
  getSecurityDepositProfitHistory: async (
    securityDepositId: string
  ): Promise<ApiResponse<InvestmentProfitEntry[]>> => {
    try {
      console.log('Fetching profit history for deposit ID:', securityDepositId)
      const response = await apiClient.get(
        `/investment-profit/security-deposit/${securityDepositId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching investment profit history:", error);
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },
};

export default investmentServices;
