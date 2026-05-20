
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
  ArrowLeft,
  Menu,
  X,
  ChevronDown,
  Building2
} from "lucide-react";
import { useAppStore } from "../store";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

type LayoutProps = {
  children: any,
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [expandedSection, setExpandedSection] = useState<string | null>("tenancies");

  const sections = [
    {
      id: "overview",
      title: "Overview",
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
    {
      id: "marketing",
      title: "Marketing",
      icon: <Megaphone size={18} />,
      items: [
        {
          icon: <Megaphone size={20} />,
          label: "Advertise",
          route: '/dashboard/advertise'
        }
      ]
    }
  ];

  const state = useAppStore();
  const navigate = useNavigate()

  const handleGoBack = () => {
    state.setActiveProperty(null);
    navigate({ to: '/properties' });
  }

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-700/50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-4 py-6 sm:px-6 md:relative md:py-8 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-2xl`}>
      {/* Close Button (Mobile) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Logo Section */}
      <div className="mb-8 mt-8 md:mt-0">
        <div className="flex items-center gap-2 bg-gradient-to-r from-[#3f0ee3]/10 to-[#7fe502]/5 rounded-xl p-3 border border-[#3f0ee3]/20">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3f0ee3] to-[#7fe502] flex items-center justify-center shadow-lg shadow-[#3f0ee3]/50">
            <span className="text-white font-bold text-sm">E8</span>
          </div>
          <img src="/long_logo.png" alt="est8Ledger" className="h-6" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
        <button
          onClick={() => {
            handleGoBack();
            onClose();
          }}
          className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/50 hover:text-white hover:pl-5 active:bg-slate-700 md:rounded-xl"
        >
          <ArrowLeft size={20} />
          <span>Back to Properties</span>
        </button>
        <div className="my-3 h-px bg-gradient-to-r from-slate-700/0 via-slate-700/50 to-slate-700/0" />

        {sections.map((section) => (
          <div key={section.id}>
            {section.items.length === 1 && !section.icon ? (
              <Link
                to={section.items[0].route}
                onClick={onClose}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/50 hover:text-white hover:pl-5 active:bg-slate-700 md:rounded-xl"
                activeProps={{ className: "bg-gradient-to-r from-[#3f0ee3]/20 to-[#3f0ee3]/10 text-[#7fe502] border-l-2 border-[#3f0ee3] hover:bg-gradient-to-r hover:from-[#3f0ee3]/30 hover:to-[#3f0ee3]/20" }}
              >
                {section.items[0].icon}
                <span>{section.items[0].label}</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-700/50 hover:text-white hover:pl-5 active:bg-slate-700 md:rounded-xl group"
                >
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-300 text-slate-400 group-hover:text-slate-200 ${
                      expandedSection === section.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedSection === section.id && (
                  <div className="space-y-1 py-2 pl-4">
                    {section.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.route}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-slate-700/50 hover:text-white hover:pl-5 active:bg-slate-700 md:rounded-lg"
                        activeProps={{ className: "bg-[#3f0ee3]/15 text-[#7fe502] border-l-2 border-[#3f0ee3] hover:bg-[#3f0ee3]/25" }}
                      >
                        <div className="text-[#3f0ee3]">{item.icon}</div>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-700/50 pt-4 space-y-3">
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Account</p>
          <h3 className="mt-2 font-semibold text-white truncate text-sm">{state.user?.firstName || "User"}</h3>
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