import apiClient from "./api";
import type { CreateTaxConfigPayload, TaxConfig } from "../types";

export const taxConfigService = {
  /** GET /tax-config — tax configs belonging to the signed-in landlord. */
  getMyTaxConfigs: async (): Promise<TaxConfig[]> => {
    const response = await apiClient.get("/tax-config");
    return response.data?.data ?? response.data;
  },

  /** POST /tax-config */
  createTaxConfig: async (data: CreateTaxConfigPayload): Promise<TaxConfig> => {
    const response = await apiClient.post("/tax-config", data);
    return response.data?.data ?? response.data;
  },

  /** PUT /tax-config/{id}/active — activating one deactivates any other. */
  setTaxConfigActive: async (id: number | string, isActive: boolean): Promise<TaxConfig> => {
    const response = await apiClient.put(`/tax-config/${id}/active`, { isActive });
    return response.data?.data ?? response.data;
  },
};

export default taxConfigService;
