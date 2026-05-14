import apiClient from "./api";

export const inspectionService = {
  createInspection: async (data: any) => {
    const response = await apiClient.post("/inspections", data);
    return response.data;
  },

  saveInspectionSection: async (formData: FormData) => {
    const response = await apiClient.post("/inspection-sections", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getInspection: async (id: string) => {
    const response = await apiClient.get(`/inspections/${id}`);
    return response.data;
  },

  getTenancyInspection: async (id: string) => {
    const response = await apiClient.get(`/inspections/tenancy/${id}`);
    return response.data;
  },

  getPropertyInspections: async (id: any) => {
    const response = await apiClient.get(`/inspections/property/${id}`);
    return response.data;
  },

  getInspections: async (propertyAgreementId?: string) => {
    const url = propertyAgreementId
      ? `/inspections?propertyAgreementId=${propertyAgreementId}`
      : "/inspections";
    const response = await apiClient.get(url);
    return response.data;
  },

  approveInspection: async (id: string) => {
    const response = await apiClient.put(`/inspections/${id}/approve-tenant`);
    return response.data;
  },

  approveInspectionByManagement: async (id: string) => {
    const response = await apiClient.put(`/inspections/${id}/approve-manager`);
    return response.data;
  },
};

export default inspectionService;
