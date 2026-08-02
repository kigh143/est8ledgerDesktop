import apiClient from "./api";

// TypeScript interfaces for rent payment operations
export interface RentPaymentData {
  monthPaidFor: number;
  yearPaidFor: number;
  amount: number;
  currency: string;
  tenancyId: string | number;
  propertyAgreementId: string | number;
  paymentReference: string;
  rentPaymentAccountId: number;
}

export interface RentPaymentRecord {
  id: string;
  monthPaidFor: number;
  yearPaidFor: number;
  amount: number;
  currency: string;
  tenancyId: string;
  propertyAgreementId: string;
  paymentReference: string;
  status: "PENDING" | "CONFIRMED" | "DISPUTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface DueRentMonth {
  month: number;
  year: number;
  monthName: string;
  dueDate: string;
  daysLate: number;
  rentDue: number;
  lateFee: number;
  total: number;
}

export interface DueRentDetails {
  tenancyId: number;
  tenant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  propertyName: string;
  unitName: string;
  rentAmount: number;
  late_paymeny_percentage: number;
  days_of_late_payment: number;
  unpaidMonths: DueRentMonth[];
  totalRentDue: number;
  totalLateFees: number;
  overallTotal: number;
}

export interface PaymentStatusUpdate {
  paymentStatus: "PENDING" | "CONFIRMED" | "DISPUTED" | "CANCELLED";
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface RentPaymentAccount {
  id: string;
  accountNumber: string;
  accountType: string;
  accountName: string;
  instructions?: string;
  propertyAgreementId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentPaymentAccountData {
  accountNumber: string;
  accountType: string;
  accountName: string;
  propertyAgreementId: string | number;
  instructions?: string;
}

export const rentPaymentsService = {
  /**
   * Fetch all rent payment records for a specific tenancy
   * GET /rent-payments/tenancy/:tenancyId
   */
  getTenancyRentPayments: async (
    tenancyId: string,
  ): Promise<RentPaymentRecord[]> => {
    try {
      const response = await apiClient.get(
        `/rent-payments/tenancy/${tenancyId}`,
      );
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching tenancy rent payments:", error);
      throw error;
    }
  },

  /**
   * Fetch the late / due-rent details for a specific tenancy
   * GET /rent-payments/due-rent/:tenancyId
   */
  getDueRent: async (tenancyId: string): Promise<DueRentDetails> => {
    try {
      const response = await apiClient.get(
        `/rent-payments/due-rent/${tenancyId}`,
      );
      return (response.data?.data ?? response.data) as DueRentDetails;
    } catch (error: any) {
      console.error("Error fetching due rent details:", error);
      throw error;
    }
  },

  /**
   * Fetch all rent payment records for a given property agreement
   * GET /rent-payments/property/:propertyAgreementId
   */
  getPropertyRentPayments: async (
    propertyAgreementId: string,
  ): Promise<RentPaymentRecord[]> => {
    try {
      const response = await apiClient.get(
        `/rent-payments/property/${propertyAgreementId}`,
      );
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching property rent payments:", error);
      throw error;
    }
  },

  /**
   * Create a new rent payment record
   * POST /rent-payments
   */
  createRentPayment: async (
    paymentData: RentPaymentData,
  ): Promise<ApiResponse<RentPaymentRecord>> => {
    try {
      const response = await apiClient.post("/rent-payments", paymentData);
      return response.data;
    } catch (error: any) {
      console.error("Error creating rent payment:", error);
      throw error;
    }
  },

  /**
   * Update the status of an existing rent payment record
   * PATCH /rent-payments/:id/status
   */
  updatePaymentStatus: async (
    paymentId: string,
    statusData: PaymentStatusUpdate,
  ): Promise<ApiResponse<RentPaymentRecord>> => {
    console.log("Updating payment status:", paymentId, statusData);
    try {
      const response = await apiClient.patch(
        `/rent-payments/${paymentId}/status`,
        statusData,
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  /**
   * Delete a specific rent payment record
   * DELETE /rent-payments/:id
   */
  deleteRentPayment: async (paymentId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(`/rent-payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error deleting rent payment:", error);
      throw error;
    }
  },

  /**
   * Get a specific rent payment record by ID
   * GET /rent-payments/:id
   */
  getRentPayment: async (
    paymentId: string,
  ): Promise<ApiResponse<RentPaymentRecord>> => {
    try {
      const response = await apiClient.get(`/rent-payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching rent payment:", error);
      throw error;
    }
  },

  /**
   * Fetch all rent payment accounts for a specific property agreement
   * GET /rent-payment-accounts/property/:propertyAgreementId
   */
  getRentPaymentAccounts: async (
    propertyAgreementId: string,
  ): Promise<RentPaymentAccount[]> => {
    console.log("Fetching rent payment accounts for:", propertyAgreementId);
    try {
      const response = await apiClient.get(
        `/rent-payment-accounts/property/${propertyAgreementId}`,
      );
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching rent payment accounts:", error);
      throw error;
    }
  },

  /**
   * Create a new rent payment account
   * POST /rent-payment-accounts
   */
  createRentPaymentAccount: async (
    accountData: RentPaymentAccountData,
  ): Promise<ApiResponse<RentPaymentAccount>> => {
    try {
      const response = await apiClient.post(
        "/rent-payment-accounts",
        accountData,
      );
      return response.data;
    } catch (error: any) {
      console.error("Error creating rent payment account:", error);
      throw error;
    }
  },

  /**
   * Delete a rent payment account
   * DELETE /rent-payment-accounts/:id
   */
  deleteRentPaymentAccount: async (accountId: string | number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(`/rent-payment-accounts/${accountId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error deleting rent payment account:", error);
      throw error;
    }
  },
};

export default rentPaymentsService;
