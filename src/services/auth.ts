import type { RegisterPayload } from "../types";
import apiClient from "./api";

export const register = async (body: RegisterPayload) => {
  const response = await apiClient.post("/auth/register", body);
  return response.data;
};

export const checkUserExisits = async (body: any) => {
  const response = await apiClient.post("/auth/check-if-user-exists", body);
  return response.data;
};

export const resendOTP = async (body: any) => {
  const response = await apiClient.post("/auth/resend", body);
  return response.data;
};

export const verifyOTP = async (body: any) => {
  const response = await apiClient.post("/auth/verify-otp", body);
  return response.data;
};

export const validatePin = async (body: any) => {
  const response = await apiClient.post("/auth/validate-pin", body);
  return response.data;
};