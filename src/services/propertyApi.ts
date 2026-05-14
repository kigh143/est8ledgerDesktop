import apiClient from './api';

interface CreateListingData {
  propertyAgreementId: string;
  monthlyRent: string;
  currency?: string;
  description: string;
  images: string[];
}

const propertyListingService = {
  createListing: async (formData: FormData) => {
    const response = await apiClient.post('/property-listings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getListings: async () => {
    const response = await apiClient.get('/property-listings');
    return response.data;
  },

  getListingById: async (id: string) => {
    const response = await apiClient.get(`/property-listings/${id}`);
    return response.data;
  },

  updateListing: async (id: string, data: Partial<CreateListingData>) => {
    const response = await apiClient.put(`/property-listings/${id}`, data);
    return response.data;
  },

  deleteListing: async (id: string) => {
    const response = await apiClient.delete(`/property-listings/${id}`);
    return response.data;
  },

  toggleListingStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    const response = await apiClient.patch(`/property-listings/${id}/toggle-status`, { status });
    return response.data;
  }
};

export default propertyListingService;