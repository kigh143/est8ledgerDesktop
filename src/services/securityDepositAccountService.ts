import apiClient from "./api";
import type {
  DepositAccountPayload,
  PropertyDepositSetup,
  SecurityDepositAccount,
} from "../types";

export const securityDepositAccountService = {
  /** GET /security-deposit-accounts/property/{propertyAgreementId} */
  getPropertySetup: async (propertyAgreementId: string | number): Promise<PropertyDepositSetup> => {
    const response = await apiClient.get(`/security-deposit-accounts/property/${propertyAgreementId}`);
    return response.data;
  },

  /** PUT /security-deposit-accounts/property/{propertyAgreementId}/collection-mode */
  setCollectionMode: async (propertyAgreementId: string | number, collectViaEst8ledger: boolean) => {
    const response = await apiClient.put(
      `/security-deposit-accounts/property/${propertyAgreementId}/collection-mode`,
      { collectViaEst8ledger }
    );
    return response.data;
  },

  /** POST /security-deposit-accounts */
  create: async (propertyAgreementId: string | number, data: DepositAccountPayload): Promise<SecurityDepositAccount> => {
    const response = await apiClient.post("/security-deposit-accounts", {
      ...data,
      propertyAgreementId: +propertyAgreementId,
    });
    return response.data;
  },

  /** PUT /security-deposit-accounts/{id} */
  update: async (id: number, data: Partial<DepositAccountPayload>): Promise<SecurityDepositAccount> => {
    const response = await apiClient.put(`/security-deposit-accounts/${id}`, data);
    return response.data;
  },

  /** DELETE /security-deposit-accounts/{id} — accounts that already received deposits are deactivated instead. */
  remove: async (id: number): Promise<{ deactivated: boolean; message: string }> => {
    const response = await apiClient.delete(`/security-deposit-accounts/${id}`);
    return response.data;
  },
};

export default securityDepositAccountService;
