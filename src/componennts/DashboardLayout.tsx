import type { ReactNode } from "react";
import {
  LayoutDashboard,
  UsersRound,
  ClipboardCheck,
  Vault,
  Landmark,
  FileSignature,
  Wrench,
  Receipt,
  CalendarCheck,
  Megaphone,
  Bell,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../store";
import AppShell from "./AppShell";
import NotificationBell from "./NotificationBell";
import type { NavSection } from "./Sidebar";

const icon = { size: 18, strokeWidth: 1.75 } as const;

const sections: NavSection[] = [
  {
    id: "overview",
    items: [
      { icon: <LayoutDashboard {...icon} />, label: "Overview", route: "/dashboard/home" },
      { icon: <Bell {...icon} />, label: "Notifications", route: "/dashboard/notifications" },
    ],
  },
  {
    id: "tenancies",
    title: "Tenancies",
    items: [
      { icon: <UsersRound {...icon} />, label: "Tenants", route: "/dashboard/tenants" },
      { icon: <FileSignature {...icon} />, label: "Agreements", route: "/dashboard/agreement" },
      { icon: <ClipboardCheck {...icon} />, label: "Inspections", route: "/dashboard/inspections" },
      { icon: <Vault {...icon} />, label: "Security Deposits", route: "/dashboard/securitydeposits" },
      { icon: <Landmark {...icon} />, label: "Deposit Collection", route: "/dashboard/deposit-collection" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      { icon: <CalendarCheck {...icon} />, label: "Rent Tracking", route: "/dashboard/renttracking" },
      { icon: <Wrench {...icon} />, label: "Repairs", route: "/dashboard/repairs" },
      { icon: <Receipt {...icon} />, label: "Expenses", route: "/dashboard/expenses" },
      { icon: <Megaphone {...icon} />, label: "Advertise", route: "/dashboard/advertise" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const activeProperty = useAppStore((state) => state.activeProperty);
  const setActiveProperty = useAppStore((state) => state.setActiveProperty);
  const navigate = useNavigate();

  return (
    <AppShell
      sections={sections}
      backAction={{
        label: "All properties",
        onClick: () => {
          setActiveProperty(null);
          navigate({ to: "/properties" });
        },
      }}
      property={
        activeProperty
          ? {
              name: activeProperty.propertyName,
              address: activeProperty.propertyAddress,
              image: activeProperty.propertyImage,
            }
          : undefined
      }
      toolbarTitle={activeProperty?.propertyName}
      toolbarActions={<NotificationBell propertyId={activeProperty?.id} />}
    >
      {children}
    </AppShell>
  );
}
