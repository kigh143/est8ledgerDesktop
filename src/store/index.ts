import { create } from "zustand";
import type {
  AuthData,
  PropertyAgreement,
  RootRouteContext,
  User,
} from "../types";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAppStore = create<RootRouteContext>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      activeProperty: null,
      loggedIn: false,
      authData: {
        loginWith: "email",
        country: null,
        phoneNumber: null,
        email: null,
      },
      login: (user: User) => {
        set({ user });
      },
      setLoggedIn: () => {
        set({ loggedIn: true });
      },
      logout: () => {
        set({
          user: null,
          activeProperty: null,
          loggedIn: false,
          token: null,
          authData: {
            loginWith: "email",
            country: null,
            phoneNumber: null,
            email: null,
          },
        });
      },
      setActiveProperty: (activeProperty: PropertyAgreement) => {
        set({ activeProperty });
      },
      setToken: (token: string) => {
        set({ token });
      },
      setAuthData: (data: AuthData) => {
        set({ authData: data });
      },
    }),
    {
      name: "est-storage", // Unique key in localStorage
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
