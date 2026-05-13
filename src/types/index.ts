export type User = Record<string, FlexibleValue>;

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
  activeProperty: TActiveProperty | null;
  loggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  setActiveProperty: (property: TActiveProperty) => void;
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

export type Clause = {
  id: number;
  title: string;
  body: string;
  description: string;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CashMethod = {
  id?: number;
  countryId?: number;
  name?: string;
};
