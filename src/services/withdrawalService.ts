import apiClient from "./api";

export type WithdrawerType = "TENANT" | "MGT";
export type WithdrawalStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface CreateWithdrawalData {
  amount: number;
  withdrawerType: WithdrawerType;
  cashOutMethodUsed: string;
  cashOutMethodId: number;
  accountNumber: string;
  accountName: string;
  mtnNumber?: string;
  payerMessage?: string;
  payeeNote?: string;
}

export interface Withdrawal {
  id: number;
  amount: number;
  withdrawerType: WithdrawerType;
  cashOutMethodUsed: string;
  cashOutMethodId: number;
  accountNumber: string;
  accountName: string;
  mtnNumber?: string;
  payerMessage?: string;
  payeeNote?: string;
  withdrawalStatus: WithdrawalStatus;
  currency: string;
  fee: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
}

export const withdrawalService = {
  /**
   * Request a withdrawal
   * POST /withdrawals
   */
  createWithdrawal: async (data: CreateWithdrawalData): Promise<Withdrawal> => {
    const response = await apiClient.post("/withdrawals", data);
    return response.data;
  },

  /**
   * Get the current user's withdrawal history
   * GET /withdrawals/me
   */
  getMyWithdrawals: async (): Promise<Withdrawal[]> => {
    const response = await apiClient.get("/withdrawals/me");
    return response.data || [];
  },

  /**
   * Cancel a pending withdrawal
   * PUT /withdrawals/:id/cancel
   */
  cancelWithdrawal: async (id: number | string): Promise<Withdrawal> => {
    const response = await apiClient.put(`/withdrawals/${id}/cancel`);
    return response.data;
  },
};

export default withdrawalService;
