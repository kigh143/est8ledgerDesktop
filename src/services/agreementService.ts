import apiClient from './api';

export const agreementService = {
  createPropertyAgreement: async (data: any) => {
    const response = await apiClient.post(`/agreements/create`, data);
    return response.data;
  },

  editPropertyAgreement: async ({ data, id }: any) => {
    const response = await apiClient.put(`/agreements/${id}`, data);
    return response.data;
  },

  getPropertyAgreements: async () => {
    const response = await apiClient.get(`/agreements?page=1&limit=10`);
    return response.data;
  },

  getPropertyAgreement: async (id: string) => {
    const response = await apiClient.get(`/agreements/${id}`);
    return response.data;
  },

  deletePropertyAgreement: async (id: string) => {
    const response = await apiClient.delete(`/agreements/${id}`);
    return response.data;
  },

  createPropertyClause: async (data: any) => {
    const response = await apiClient.post(`/agreements/property-clause`, data);
    return response.data;
  },

  deletePropertyClause: async (obj: any) => {
    const response = await apiClient.delete(
      `/agreements/property-clause/${obj.propertyAgreementId}/${obj.clauseId}`
    );
    return response.data;
  },
};


export default agreementService;