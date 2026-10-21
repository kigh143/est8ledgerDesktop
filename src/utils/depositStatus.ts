import type { SecurityDepositRecord } from "../types";

// Where a security deposit sits in the approval flow (mirrors the mobile app).
//
// Landlord-held (collectedVia LANDLORD):
//   PENDING (landlord confirms receipt) -> MGT_APPROVED (est8Ledger final approval) -> COMPLETED
// Pass-through (collectedVia EST8LEDGER, and every deposit made before this flow existed):
//   PENDING (est8Ledger approves) -> COMPLETED
// Either reviewer can move a deposit to REJECTED; the tenant then resubmits.
export type DepositStage = "AWAITING_LANDLORD" | "AWAITING_EST8LEDGER" | "COMPLETED" | "REJECTED";

export const isLandlordHeld = (deposit?: SecurityDepositRecord | null) => deposit?.collectedVia === "LANDLORD";

export const getDepositStage = (deposit: SecurityDepositRecord): DepositStage => {
  const status = String(deposit?.paymentStatus || "PENDING").toUpperCase();
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "REJECTED" || status === "FAILED") return "REJECTED";
  if (status === "MGT_APPROVED") return "AWAITING_EST8LEDGER";
  return isLandlordHeld(deposit) ? "AWAITING_LANDLORD" : "AWAITING_EST8LEDGER";
};

/** The account the tenant says they paid into, whichever side holds it. */
export const getPaidIntoAccount = (deposit: SecurityDepositRecord) => {
  if (deposit?.securityDepositAccount) {
    return { name: deposit.securityDepositAccount.accountName, number: deposit.securityDepositAccount.accountNumber };
  }
  if (deposit?.account) {
    return { name: deposit.account.accountName, number: deposit.account.accountNo ?? "" };
  }
  return null;
};

// Refund of a landlord-held deposit after termination:
// HELD -> RELEASED (landlord says it's paid back) -> RECEIVED (tenant confirmed) or DISPUTED (landlord re-releases).
export type ReleaseState = "HELD" | "RELEASED" | "RECEIVED" | "DISPUTED";

export const getReleaseState = (deposit: SecurityDepositRecord): ReleaseState => {
  const status = String(deposit?.releaseStatus || "").toUpperCase();
  return status === "RELEASED" || status === "RECEIVED" || status === "DISPUTED" ? status : "HELD";
};

/** Either side has started ending the tenancy — the point from which the landlord may release the deposit. */
export const isTerminationAgreed = (tenancy?: Record<string, unknown> | null) =>
  !!(tenancy?.terminatedAt || tenancy?.terminationApprovedByTenantAt || tenancy?.tenantRequestedAt);

export const canReleaseDeposit = (deposit: SecurityDepositRecord, tenancy?: Record<string, unknown> | null) => {
  const release = getReleaseState(deposit);
  return (
    isLandlordHeld(deposit) &&
    getDepositStage(deposit) === "COMPLETED" &&
    isTerminationAgreed(tenancy) &&
    (release === "HELD" || release === "DISPUTED")
  );
};
