export type FlexibleValue = string | boolean | number | Record<string, any>;

export type AuthData = {
  loginWith: "phone" | "email";
  country: Country | null;
  phoneNumber: string | null;
  email: string | null;
};

export type TActiveProperty = Record<string, FlexibleValue>;

export type RootRouteContext = {
  user: User | null;
  token: string | null;
  authData: AuthData;
  activeProperty: PropertyAgreement | null;
  loggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  setActiveProperty: (property: PropertyAgreement) => void;
  setToken: (token: string) => void;
  setAuthData: (data: AuthData) => void;
};

export type RegisterPayload = {};

export type Country = {
  id: number;
  name: string;
  isoCode: string;
  currency: string;
  flag: string;
  dialingCode: string;

  terminationNoticeDays: number;
  maxSecurityDepositMonths: number;
  rentIncreaseNoticeDays: number;
  initialAdvanceMonths: number;

  isActive: boolean;
  securityDepositRequired: boolean;
  evictionProcess: "COURT" | "ADMIN" | "OTHER";
  eSignatureAllowed: boolean;

  lastVerified: string; // ISO date string
  createdAt: string;
  updatedAt: string;

  languages: Language[];
  legalSources: LegalSource[];
  CountryClause: CountryClause[];

  CashInMethod: CashMethod[];
  CashOutMethod: CashMethod[];
};

export type Language = {
  id: number;
  countryId: number;
  language: string;
};

export type LegalSource = {
  id: number;
  countryId: number;
  source: string;
};

export type CountryClause = {
  id: number;
  countryId: number;
  clauseId: number;
  clause: Clause;
};

// export type Clause = {
//   id: number;
//   title: string;
//   body: string;
//   description: string;
//   isOptional: boolean;
//   createdAt: string;
//   updatedAt: string;
// };

export type CashMethod = {
  id?: number;
  countryId?: number;
  name?: string;
};

export type UserRole = "MGT" | "TENANT";

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  countryId: number;
  isKycVerified: boolean;
  createdAt: string;
  updatedAt: string;
  userType: string | null;
  failedLoginAttempts: number;
  isLocked: boolean;
  lockoutUntil: string | null;
  loginStatus: string | null;
}

export interface AuthResponse extends User {
  accessToken: string;
  user: User;
  hasPin: boolean;
}

export type PropertyListingStatus = "ACTIVE" | "INACTIVE";

export interface PropertyAgreement {
  id: number;
  propertyName: string;
  propertyAddress: string;
  currency: string;
}

export interface PropertyListing {
  id: number;
  propertyAgreementId: number;
  listingStatus: PropertyListingStatus;
  description: string;
  views: number;
  monthlyRent: string; // keep string if backend sends it as string
  currency: string | null;
  images: string[];
  paidFor: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  propertyAgreement: PropertyAgreement;
}

export type PropertyType = "Residential" | "Commercial";
export type EvictionProcess = "COURT" | "NOTICE" | "OTHER";
export type WasteHandledBy = "TENANT" | "LANDLORD";
export type InspectionType = "MOVE_IN" | "MOVE_OUT";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export interface PropertyCountry {
  id: number;
  name: string;
  isoCode: string;
}

export interface Owner {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface Clause {
  id: number;
  title: string;
  body: string;
  description: string;
  isOptional: boolean;
}

export interface PropertyClause {
  id: number;
  propertyAgreementId: number;
  clauseId: number;
  isCustom: boolean;
  clause: Clause;
}

export interface Tenant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Manager {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface Tenancy {
  id: number;
  propertyAgreementId: number;
  tenantId: number;
  managerId: number;
  rentAmount: string;
  unitName: string;
  yakaMeter: string;
  waterMeter: string;
  late_payment_fee: string | null;
  late_paymeny_percentage: string | null;
  wasteHandledBy: WasteHandledBy;
  securityDeposit: string;
  securityDepositPaidAt: string | null;
  mgtSignedAt: string | null;
  tenantSignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  terminatedAt: string | null;
  terminationApprovedByTenantAt: string | null;
  tenantRequestedAt: string | null;
  mgtRequestedAt: string | null;
  days_of_late_payment: number | null;
  paymentDueDay: number | null;
  lastPaymentDate: string | null;
  outstandingBalance: string;
  gracePeriodDays: number;
  lateFeeType: string | null;

  tenant: Tenant;
  manager: Manager;
}

export interface Inspection {
  id: number;
  tenancyId: number;
  propertyAgreementId: number;
  tenantApprovedAt: string | null;
  managerApprovedAt: string | null;
  type: InspectionType;
  createdAt: string;
  updatedAt: string;
  tenancy: {
    id: number;
    unitName: string;
  };
}

export interface SecurityDeposit {
  id: number;
  tenancyId: number;
  amount: string;
  currency: string;
  mgtOptedIntoInvestmentAt: string | null;
  tenantOptedIntoInvestmentAt: string | null;
  createdAt: string;
  updatedAt: string;
  propertyAgreementId: number;
  cashInMethodUsed: string | null;
  paymentReference: string;
  mtnNumber: string | null;
  airtelNumber: string | null;
  paymentStatus: PaymentStatus;
  taxcalculated: string | null;
  providerFees: string | null;
  accountId: number;
  investedAt: string | null;
  investmentMadeId: string | null;
  tenantShare: string | null;
  mgtShare: string | null;
  depositFees: string | null;
  xrplTxHash: string | null;
  blockchainStatus: string;
}

export interface PropertyAgreement {
  id: number;
  propertyName: string;
  propertyAddress: string;
  city: string;
  district: string;
  currency: string;
  countryId: number;
  ownerId: number;
  propertyImage: string | null;
  propertyType: PropertyType;
  numberOfUnits: number;

  evictionProcess: EvictionProcess;
  terminationNoticeDays: number;
  maxSecurityDepositMonths: number | null;
  securityDepositMonths: number;
  rentIncreaseNoticeDays: number;
  initialAdvanceMonths: number;

  isActive: boolean;
  securityDepositRequired: boolean;
  isDeleted: boolean;
  trackRentCollection: boolean;

  customClauses: any[];

  createdAt: string;
  updatedAt: string;
  added_by: number | null;

  country: PropertyCountry;
  owner: Owner;

  propertyClauses: PropertyClause[];
  tenancies: Tenancy[];
  inspections: Inspection[];
  securityDeposits: SecurityDeposit[];

  notifications: any[];
  PropertyListing: any[];
}
