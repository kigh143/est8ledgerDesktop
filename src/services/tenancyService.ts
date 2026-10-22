import apiClient from "./api";

export const tenancyService = {
  getUserTenancies: async () => {
    const response = await apiClient.get("/tenancies/user");
    return response.data;
  },

  getTenancy: async (tenancyId: string) => {
    const response = await apiClient.get(`/tenancies/${tenancyId}`);
    return response.data;
  },

  signTenancy: async (tenancyId: string) => {
    const response = await apiClient.put(`/tenancies/${tenancyId}`, {
      tenantSignedAt: new Date(),
    });
    return response.data;
  },

  createTenancy: async (tenancyData: any) => {
    const response = await apiClient.post("/tenancies", tenancyData);
    return response.data;
  },

  paySecurityDeposit: async (tenancyId: string, paymentData: any) => {
    const response = await apiClient.post(
      `/tenancies/${tenancyId}/pay-deposit`,
      paymentData,
    );
    return response.data;
  },
  getPropertyTenancies: async (propertyId: string) => {
    const response = await apiClient.get(`/tenancies/property/${propertyId}`);
    return response.data;
  },
  terminateTenancy: async (tenancyId: string) => {
    const response = await apiClient.put(`/tenancies/${tenancyId}/terminate`);
    return response.data;
  },
  searchForUser: async (searchData: any) => {
    const response = await apiClient.post("/tenancies/search", searchData);
    return response.data;
  },
  createTenantUser: async (userData: any) => {
    const response = await apiClient.post("/tenancies/create-user", userData);
    return response.data;
  },

  mgtRequestTenancyTermiantion: async (tenancyId: string) => {
    const response = await apiClient.post(
      `/tenancies/${tenancyId}/mgt-request-termination`,
    );
    return response.data;
  },

  tenantRequestTermination: async (tenancyId: string) => {
    const response = await apiClient.post(
      `/tenancies/${tenancyId}/tenant-request-termination`,
    );
    return response.data;
  },

  inviteLandlord: async (invitationData: any) => {
    const response = await apiClient.post(
      "/tenancies/invite-landlord",
      invitationData,
    );
    return response.data;
  },

  updateTenancy: async (tenancyData: any) => {
    const response = await apiClient.put(
      `/tenancies/${tenancyData.id}`,
      tenancyData,
    );
    return response.data;
  },

  mgtApproveTenancyTermination: async (tenancyId: string) => {
    const response = await apiClient.post(
      `/tenancies/${tenancyId}/mgt-approve-termination`,
    );
    return response.data;
  },

    tenantApproveTenancyTermination: async (tenancyId: string) => {
    const response = await apiClient.post(
      `/tenancies/${tenancyId}/mgt-approve-termination`,
    );
    return response.data;
  },
};

export default tenancyService;
