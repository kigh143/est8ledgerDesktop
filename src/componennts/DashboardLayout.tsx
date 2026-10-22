import type { ReactNode } from "react";
import {
  Bell,
  CalendarCheck,
  ChartColumn,
  ClipboardCheck,
  FileSignature,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  Percent,
  Receipt,
  UsersRound,
  Vault,
  Wrench,
} from "lucide-react";
import { useAppStore } from "../store";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import AppShell from "./AppShell";
import NotificationBell from "./NotificationBell";
import PropertySwitcher from "./PropertySwitcher";
import type { NavSection } from "./Sidebar";

const icon = { size: 18, strokeWidth: 1.75 } as const;

const buildSections = (unread: number): NavSection[] => [
  {
    id: "overview",
    items: [
      { icon: <LayoutDashboard {...icon} />, label: "Overview", route: "/dashboard/home" },
      { icon: <Bell {...icon} />, label: "Notifications", route: "/dashboard/notifications", badge: unread },
    ],
  },
  {
    id: "tenancies",
    title: "Tenancies",
    items: [
      { icon: <UsersRound {...icon} />, label: "Tenants", route: "/dashboard/tenants" },
      { icon: <FileSignature {...icon} />, label: "Agreements", route: "/dashboard/agreement" },
      { icon: <ClipboardCheck {...icon} />, label: "Inspections", route: "/dashboard/inspections" },
    ],
  },
  {
    id: "money",
    title: "Money",
    items: [
      { icon: <CalendarCheck {...icon} />, label: "Rent Tracking", route: "/dashboard/renttracking" },
      { icon: <Vault {...icon} />, label: "Security Deposits", route: "/dashboard/securitydeposits" },
      { icon: <Landmark {...icon} />, label: "Deposit Collection", route: "/dashboard/deposit-collection" },
      { icon: <Receipt {...icon} />, label: "Expenses", route: "/dashboard/expenses" },
      { icon: <ChartColumn {...icon} />, label: "Reports", route: "/dashboard/reports" },
      { icon: <Percent {...icon} />, label: "Tax", route: "/dashboard/tax" },
      { icon: <Lightbulb {...icon} />, label: "Pricing Insight", route: "/dashboard/pricing" },
    ],
  },
  {
    id: "property",
    title: "Property",
    items: [
      { icon: <Wrench {...icon} />, label: "Repairs", route: "/dashboard/repairs" },
      { icon: <Megaphone {...icon} />, label: "Advertise", route: "/dashboard/advertise" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const activeProperty = useAppStore((state) => state.activeProperty);
  const unread = useUnreadNotifications(activeProperty?.id);

  return (
    <AppShell
      sections={buildSections(unread)}
      sidebarHeader={(collapsed, closeSidebar) => (
        <PropertySwitcher collapsed={collapsed} onNavigate={closeSidebar} />
      )}
      toolbarTitle={activeProperty?.propertyName}
      toolbarActions={<NotificationBell unread={unread} />}
    >
      {children}
    </AppShell>
  );
}
