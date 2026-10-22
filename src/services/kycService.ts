import apiClient from './api'

const kycService = {
  syncKycData: async () => {
    const response = await apiClient.get(`/sync-with-kyc`);
    return response.data;
  },
};

export default kycService