import apiClient from "./api";


export const configurationService = {
  getCountries: async () => {
    const response = await apiClient.get(`/countries`);
    return response.data;
  },

  getClauses: async () => {
    const response = await apiClient.get(`/config/clauses`);
    return response.data;
  },

  getCashInMethods: async (id: any) => {
    const response = await apiClient.get(`/countries/${id}/cash-in-methods`);
    return response.data;
  },

  getCashOutMethods: async (id: any) => {
    const response = await apiClient.get(`/countries/${id}/cash-out-methods`);
    return response.data;
  },

  getInspectionFields: async () => {
    const response = await apiClient.get(`/inspection-fields`);
    return response.data;
  },

  getCountryById: async (id: number) => {
    const response = await apiClient.get(`/countries/${id}`);
    return response.data;
  },
};

export default configurationService;