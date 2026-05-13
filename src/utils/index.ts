export const phoneNumberWithCountryCode = (
  phone: string,
  countryCode: string,
) => {
  const isPhoneStartingWithCountryCode = phone.startsWith(countryCode);
 return isPhoneStartingWithCountryCode
    ? phone
    : countryCode + phone;
};


export const getNetworkError = (error:any) => {
      let errorMessage = "Verification failed. Please try again.";
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || "Sorry something went wrong";
      } else if (error.response?.status === 401) {
        errorMessage = "Sorry something went wrong";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return errorMessage;
}