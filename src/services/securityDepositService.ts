import apiClient from "./api";

// TypeScript interfaces for security deposit operations
export interface SecurityDepositPaymentData {
  tenancyId: string;
  propertyAgreementId: string;
  amount: number;
  currency: string;
  cashInMethodUsed: string;
  mtnNumber: string;
  airtelNumber: string;
  payerMessage: string;
  payeeNote: string;
  // Optional fields for backward compatibility and additional data
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
  };
  reference?: string;
}

export interface PaymentStatusUpdate {
  status: "pending" | "completed" | "failed" | "refunded";
  reference?: string;
  failureReason?: string;
}

export interface SecurityDepositResponse {
  id: string;
  tenancyId: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyTotalBalance {
  role: "TENANT" | "MGT";
  totalSecurityDeposit: number;
  currency: string;
  count: number;
  walletAddress?: string;
  ugeBalance?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const securityDepositService = {
  /**
   * Create a new security deposit payment
   * POST /security-deposit/deposit
   */
  makeSecurityDepositPayment: async (data: any) => {
    try {
      const response = await apiClient.post("/security-deposit", data);
      return response.data;
    } catch (error: any) {
      console.error("Error making security deposit payment:", error);
      throw error;
    }
  },

  /**
   * Get security deposit data for a specific tenancy
   * GET /security-deposit/tenancy/{tenancyId}
   */
  getTenancyDeposit: async (
    tenancyId: string
  ): Promise<ApiResponse<SecurityDepositResponse[]>> => {
    try {
      const response = await apiClient.get(
        `/security-deposit/${tenancyId}/tenancy`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching tenancy deposit:",
        error.response?.data?.message
      );
      throw error;
    }
  },

  /**
   * Get all security deposits for a property agreement
   * GET /security-deposit/property-agreement/{propertyAgreementId}
   */
  getPropertyDeposits: async (
    propertyAgreementId: string
  ): Promise<ApiResponse<SecurityDepositResponse[]>> => {
    try {
      const response = await apiClient.get(
        `/security-deposit/${propertyAgreementId}/property-agreement`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching property deposits:", error);
      throw error;
    }
  },

  /**
   * Update the payment status of an existing security deposit
   * PATCH /security-deposit/{depositId}/status
   */
  updatePaymentStatus: async (
    depositId: string,
    statusData: PaymentStatusUpdate
  ): Promise<ApiResponse<SecurityDepositResponse>> => {
    try {
      const response = await apiClient.patch(
        `/security-deposit/${depositId}/status`,
        statusData
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  /**
   * Get security deposit details by ID
   * GET /security-deposit/{depositId}
   */
  getDepositById: async (
    depositId: string
  ): Promise<ApiResponse<SecurityDepositResponse>> => {
    try {
      const response = await apiClient.get(`/security-deposit/${depositId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching deposit by ID:", error);
      throw error;
    }
  },

  /**
   * Get all security deposits for the authenticated user
   * GET /security-deposit/user
   */
  getUserDeposits: async (): Promise<
    ApiResponse<SecurityDepositResponse[]>
  > => {
    try {
      const response = await apiClient.get("/security-deposit/user");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching user deposits:", error);
      throw error;
    }
  },

  /**
   * Request security deposit refund
   * POST /security-deposit/{depositId}/refund
   */
  requestRefund: async (
    depositId: string,
    refundData?: { reason?: string }
  ): Promise<ApiResponse<SecurityDepositResponse>> => {
    try {
      const response = await apiClient.post(
        `/security-deposit/${depositId}/refund`,
        refundData || {}
      );
      return response.data;
    } catch (error: any) {
      console.error("Error requesting refund:", error);
      throw error;
    }
  },

  /**
   * Verify payment status with payment provider
   * POST /security-deposit/{depositId}/verify
   */
  verifyPayment: async (
    depositId: string
  ): Promise<ApiResponse<SecurityDepositResponse>> => {
    try {
      const response = await apiClient.post(
        `/security-deposit/${depositId}/verify`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  },

  tenantOptIntoInvestment: async (
    securityDepositId: string
  ): Promise<ApiResponse<SecurityDepositResponse>> => {

    console.log("Opting into investment:", securityDepositId);
    try {
      const response = await apiClient.post(
        `/security-deposit/${securityDepositId}/tenant-opt-in-investment`
      );
      return response.data;

    } catch (error: any) {
            console.log("Tenant opted into investment:", error.response?.data?.message);
      throw error;
    }
  },

  managementOptIntoInvestment: async (
    securityDepositId: string
  ): Promise<ApiResponse<SecurityDepositResponse>> => {
    try {
      const response = await apiClient.post(
        `/security-deposit/${securityDepositId}/mgt-opt-in-investment`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error opting into investment:", error);
      throw error;
    }
  },

  /**
   * Get the current user's total security deposit / wallet balance
   * GET /security-deposit/my-total
   */
  getMyTotal: async (): Promise<MyTotalBalance> => {
    try {
      const response = await apiClient.get("/security-deposit/my-total", {
        headers: { "Cache-Control": "no-cache" },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching balance:", error.response?.data?.message);
      throw error;
    }
  },
};

export default securityDepositService;
