
import {
  LayoutDashboard,
  UsersRound,
  InspectionPanel,
  Vault,
  FolderOpenDot,
  NotebookText,
  ToolCase,
  HandCoins,
  Menu,
  Building2,
} from "lucide-react";
import { useAppStore } from "../store";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Sidebar, { type NavSection } from "./Sidebar";

type LayoutProps = {
  children: any,
}

const SIDEBAR_COLLAPSED_KEY = "el_sidebar_collapsed";

const sections: NavSection[] = [
  {
    id: "overview",
    items: [
      {
        icon: <LayoutDashboard size={20} />,
        label: "Dashboard",
        route: '/dashboard/home'
      }
    ]
  },
  {
    id: "tenancies",
    title: "Tenancies",
    icon: <Building2 size={18} />,
    items: [
      {
        icon: <UsersRound size={20} />,
        label: "Tenants",
        route: '/dashboard/tenants'
      },
      {
        icon: <InspectionPanel size={20} />,
        label: "Inspections",
        route: '/dashboard/inspections'
      },
      {
        icon: <Vault size={20} />,
        label: "Security Deposits",
        route: '/dashboard/securitydeposits'
      },
      {
        icon: <NotebookText size={20} />,
        label: "Agreements",
        route: '/dashboard/agreement'
      }
    ]
  },
  {
    id: "operations",
    title: "Property Operations",
    icon: <ToolCase size={18} />,
    items: [
      {
        icon: <ToolCase size={20} />,
        label: "Repairs",
        route: '/dashboard/repairs'
      },
      {
        icon: <HandCoins size={20} />,
        label: "Expenses",
        route: '/dashboard/expenses'
      },
      {
        icon: <FolderOpenDot size={20} />,
        label: "Rent Tracking",
        route: '/dashboard/renttracking'
      }
    ]
  },
];

export default function DashboardLayout({ children}: LayoutProps) {

  const state = useAppStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen flex-col overflow-hidden bg-white md:flex-row">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          sections={sections}
          defaultExpandedSectionId="tenancies"
          backAction={{
            label: "Back to Properties",
            onClick: () => {
              state.setActiveProperty(null);
              navigate({ to: '/properties' });
            },
          }}
          userFirstName={state.user?.firstName}
          userEmail={state.user?.email}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-auto">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 md:px-8 md:py-7 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden text-slate-500 hover:text-slate-700 transition-colors shrink-0 p-2 hover:bg-slate-100 rounded-lg"
                >
                  <Menu size={24} />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent sm:text-2xl">
                    {state.activeProperty?.propertyName}
                  </h1>
                  <p className="mt-2 truncate text-sm text-slate-500 font-medium">
                    {state.activeProperty?.propertyAddress}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-slate-50 to-[#3f0ee3]/5 px-4 py-8 sm:px-6 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}