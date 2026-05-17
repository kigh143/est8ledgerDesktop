import apiClient from "./api";

export const notificationService = {
  getPropertyNotifications: async (propertyId: string) => {
    const response = await apiClient.get(`/notifications/property/${propertyId}`);
    return response.data;
  },

  getUserNotifications: async (userId: string) => {
    const response = await apiClient.get(`/notifications/user/${userId}`);
    return response.data;
  },

  markAsReadNotification: async (notificationId: string) => {
    const response = await apiClient.put(
      `/notifications/${notificationId}/mark-read`
    );
    return response.data;
  },
};

export default notificationService;
