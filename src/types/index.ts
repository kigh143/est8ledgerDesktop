export type User = {
  id: number;
  name: string;
  role: string;
  email: string;
  isActive: boolean;
  userType: string;
};

type FlexibleValue = string | boolean | number | Record<string, any>;

export type TActiveProperty = Record<string, FlexibleValue>;

export type RootRouteContext = {
  user: User | null;
  token: string | null;
  activeProperty: TActiveProperty | null;
  loggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  setActiveProperty: (property: TActiveProperty) => void;
  setToken: (token: string) => void;
};

export type RegisterPayload = {};
