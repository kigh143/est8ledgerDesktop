import { create } from "zustand";
import type { RootRouteContext, TActiveProperty, User } from "../types";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAppStore = create<RootRouteContext>()(
  persist(
    (set) => ({
      user: null,
      activeProperty: null,
      loggedIn: false,
      login: (user: User) => {
        set({ user });
      },
      setLoggedIn: () => {
        set({ loggedIn: true });
      },
      logout: () => {
        set({ user: null, activeProperty: null, loggedIn: false });
      },
      setActiveProperty: (activeProperty: TActiveProperty) => {
        set({ activeProperty });
      },
    }),
    {
      name: "est-storage", // Unique key in localStorage
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
