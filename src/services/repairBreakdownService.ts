import apiClient from "./api";

export interface RepairBreakdownItem {
  name: string;
  price: number;
  description: string;
}

export interface CreateRepairBreakdownData {
  moveOutInspectionId: string | number;
  tenancyId: string | number;
  amount: number;
  items: RepairBreakdownItem[];
}

export interface RepairBreakdown {
  id: string;
  moveOutInspectionId: string;
  tenancyId: string;
  amount: number;
  items: RepairBreakdownItem[];
  status: "PENDING" | "APPROVED" | "DISPUTED";
  createdAt: string;
}

export const repairBreakdownService = {
  /**
   * Create a repair pricing breakdown for a move-out inspection
   * POST /repair-breakdown
   */
  createBreakdown: async (data: CreateRepairBreakdownData): Promise<RepairBreakdown> => {
    const response = await apiClient.post("/repair-breakdown", data);
    return response.data;
  },

  /**
   * Approve a repair pricing breakdown
   * POST /repair-breakdown/:id/approve
   */
  approveBreakdown: async (id: string | number): Promise<RepairBreakdown> => {
    const response = await apiClient.post(`/repair-breakdown/${id}/approve`);
    return response.data;
  },

  /**
   * Dispute a repair pricing breakdown
   * POST /repair-breakdown/:id/dispute
   */
  disputeBreakdown: async (id: string | number, disputeReason: string): Promise<RepairBreakdown> => {
    const response = await apiClient.post(`/repair-breakdown/${id}/dispute`, { disputeReason });
    return response.data;
  },
};

export default repairBreakdownService;
