import apiClient from "./api";
import type { RepairRequest, RepairStatus } from "../types";

export const repairService = {
  getPropertyRepairs: async (propertyId: string) => {
    const response = await apiClient.get(`/repairs/property/${propertyId}`);
    return response.data;
  },

  getRepair: async (repairId: string) => {
    const response = await apiClient.get(`/repairs/${repairId}`);
    return response.data;
  },

  createRepair: async (repairData: Omit<RepairRequest, "id" | "createdAt" | "updatedAt">) => {
    const response = await apiClient.post("/repairs", repairData);
    return response.data;
  },

  updateRepairStatus: async (repairId: string, status: RepairStatus) => {
    const response = await apiClient.put(`/repairs/${repairId}`, { status });
    return response.data;
  },

  updateRepair: async (repairId: string, repairData: Partial<RepairRequest>) => {
    const response = await apiClient.put(`/repairs/${repairId}`, repairData);
    return response.data;
  },

  deleteRepair: async (repairId: string) => {
    const response = await apiClient.delete(`/repairs/${repairId}`);
    return response.data;
  },

  assignRepair: async (repairId: string, assignedToId: number) => {
    const response = await apiClient.put(`/repairs/${repairId}/assign`, { assignedToId });
    return response.data;
  },

  updateCost: async (repairId: string, actualCost: number) => {
    const response = await apiClient.put(`/repairs/${repairId}/cost`, { actualCost });
    return response.data;
  },

  completeRepair: async (repairId: string) => {
    const response = await apiClient.put(`/repairs/${repairId}`, {
      status: "COMPLETED",
      completionDate: new Date().toISOString(),
    });
    return response.data;
  },

  getManagementRepairs: async (propertyAgreementId: string) => {
    const response = await apiClient.get(`/repair-requests/management?propertyAgreementId=${propertyAgreementId}`);
    return response.data;
  },

  reviewRepairRequest: async (repairRequestId: string, data: { status: string; notes: string }) => {
    const response = await apiClient.put(`/repair-requests/${repairRequestId}/review`, data);
    return response.data;
  },

  assignContractor: async (repairRequestId: string, data: { contractorId: number; estimatedAmount: number }) => {
    const response = await apiClient.put(`/repair-requests/${repairRequestId}/assign`, data);
    return response.data;
  },

  applyForRepair: async (repairRequestId: string, data: { quotedAmount: number; comment: string }) => {
    const response = await apiClient.post(`/repair-requests/${repairRequestId}/apply`, data);
    return response.data;
  },

  getRepairRequestDetail: async (repairRequestId: string) => {
    const response = await apiClient.get(`/repair-requests/${repairRequestId}/review`);
    return response.data;
  },
};

export default repairService;
