import type { ReactNode } from "react";
import { ChartColumn, House, HousePlus, Settings, CreditCard, Wallet, ReceiptText, FileUp } from "lucide-react";
import AppShell from "./AppShell";
import type { NavSection } from "./Sidebar";

type LayoutProps = {
  children: ReactNode;
  pageTitle: string;
  subTitle?: string;
  action?: ReactNode;
};

const icon = { size: 18, strokeWidth: 1.75 } as const;

const sections: NavSection[] = [
  {
    id: "main",
    items: [
      { icon: <House {...icon} />, label: "My Properties", route: "/properties" },
      { icon: <HousePlus {...icon} />, label: "Add Property", route: "/properties/add" },
      { icon: <ChartColumn {...icon} />, label: "Reports", route: "/properties/reports" },
      { icon: <FileUp {...icon} />, label: "Import Data", route: "/properties/import" },
      { icon: <Wallet {...icon} />, label: "Wallet", route: "/properties/wallet" },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { icon: <CreditCard {...icon} />, label: "Subscription", route: "/properties/subscription" },
      { icon: <ReceiptText {...icon} />, label: "Tax Compliance", route: "/properties/tax-compliance" },
      { icon: <Settings {...icon} />, label: "Settings", route: "/properties/settings" },
    ],
  },
];

export default function PropertiesLayout({ children, pageTitle, subTitle, action }: LayoutProps) {
  return (
    <AppShell sections={sections} toolbarTitle={pageTitle}>
      {/* Large title, Apple-style; the toolbar picks it up once scrolled. */}
      <div className="mb-8 mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
        <div className="min-w-0">
          <h1 className="text-[32px] font-bold leading-tight tracking-[-0.028em] text-slate-900 sm:text-[34px]">
            {pageTitle}
          </h1>
          {subTitle && <p className="mt-1 text-[15px] text-slate-500">{subTitle}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </AppShell>
  );
}
