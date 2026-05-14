
import {
  LayoutDashboard,
  UsersRound,
  InspectionPanel,
  Vault,
  FolderOpenDot,
  NotebookText,
  Megaphone,
  ToolCase,
  HandCoins,
  Bell,
  ArrowLeft,
  Menu,
  X
} from "lucide-react";
import { useAppStore } from "../store";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

type LayoutProps = {
  children: any,
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const menu = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "OverView",
      route: '/dashboard/home'
    },
    {
      icon: <UsersRound size={20} />,
      label: "Tenants",
      route: '/dashboard/tenants'
    },
    {
      icon: <ToolCase size={20} />,
      label: "Repair Reports",
      route: '/dashboard/repairs'
    },
    {
      icon: <HandCoins size={20} />,
      label: "property Expenses",
      route: '/dashboard/expenses'
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
      icon: <FolderOpenDot size={20} />,
      label: "Rent Tracking",
      route: '/dashboard/renttracking'
    },
    {
      icon: <NotebookText size={20} />,
      label: "Tenacy Agreement",
      route: '/dashboard/agreement'
    },
    {
      icon: <Megaphone size={20} />,
      label: "Advertise For Tenants",
      route: '/dashboard/advertise'
    }

  ];

  const state = useAppStore();
  const navigate = useNavigate()

  const handleGoBack = () => {
    state.setActiveProperty(null);
    navigate({ to: '/properties' });
  }


  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6 sm:px-6 md:relative md:py-8 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Close Button (Mobile) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Logo */}
      <div className="mb-10 mt-8 md:mt-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3f0ee3] to-[#3f0ee3]/80 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">E8</span>
          </div>
          <h1 className="text-xl font-bold text-white">est8Ledger</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        <button
          onClick={() => {
            handleGoBack();
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/50 hover:text-white active:bg-slate-700 md:rounded-xl"
        >
          <ArrowLeft size={20} />
          <span>Back to Properties</span>
        </button>
        <div className="my-2 h-px bg-slate-700" />
        {menu.map((item) => (
          <Link
            key={item.label}
            to={item.route}
            onClick={onClose}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/50 hover:text-white active:bg-slate-700 md:rounded-xl"
            activeProps={{ className: "bg-[#3f0ee3]/20 text-[#7fe502] border-l-2 border-[#3f0ee3]" }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-700 pt-4 space-y-3">
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
          <h3 className="mt-2 font-semibold text-white truncate">{state.user?.firstName || "Full Name"}</h3>
          <p className="text-xs text-slate-400 truncate">{state.user?.email}</p>
        </div>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children}: LayoutProps) {

  const state = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                  <h1 className="truncate text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent sm:text-3xl">
                    {state.activeProperty?.propertyName}
                  </h1>
                  <p className="mt-2 truncate text-sm text-slate-500 font-medium">
                    {state.activeProperty?.propertyAddress}
                  </p>
                </div>
              </div>

              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#3f0ee3] to-[#3f0ee3]/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#3f0ee3]/40 transition-all hover:shadow-[#3f0ee3]/60 hover:from-[#3f0ee3] hover:to-[#3f0ee3] active:scale-95 md:rounded-xl md:px-6 md:py-3 md:text-base">
                <Bell size={20} />
                <span>Notifications</span>
              </button>
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