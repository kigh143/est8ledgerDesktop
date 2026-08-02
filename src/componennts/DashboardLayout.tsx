
import {
  LayoutDashboard,
  UsersRound,
  InspectionPanel,
  Vault,
  FolderOpenDot,
  NotebookText,
  ToolCase,
  HandCoins,
  ArrowLeft,
  Menu,
  X,
  ChevronDown,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAppStore } from "../store";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type LayoutProps = {
  children: any,
}

const SIDEBAR_COLLAPSED_KEY = "el_sidebar_collapsed";

function Sidebar({ isOpen, onClose, collapsed, onToggleCollapsed }: { isOpen: boolean; onClose: () => void; collapsed: boolean; onToggleCollapsed: () => void }) {
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
    // {
    //   id: "marketing",
    //   title: "Marketing",
    //   icon: <Megaphone size={18} />,
    //   items: [
    //     {
    //       icon: <Megaphone size={20} />,
    //       label: "Advertise",
    //       route: '/dashboard/advertise'
    //     }
    //   ]
    // }
  ];

  const state = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (route: string) => location.pathname === route;

  const handleGoBack = () => {
    state.setActiveProperty(null);
    navigate({ to: '/properties' });
  }

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex ${collapsed ? 'md:w-20' : 'w-72'} w-72 flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-[#1a1233] px-4 py-6 sm:px-6 md:relative md:py-8 transition-[transform,width] duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-xl`}>
      {/* Decorative brand glow */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full bg-[#552ae7]/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -right-16 w-56 h-56 rounded-full bg-[#7fe502]/10 blur-3xl" />

      {/* Close Button (Mobile) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Collapse Toggle (Desktop) */}
      <button
        onClick={onToggleCollapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden md:flex absolute top-8 -right-3 z-10 items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shadow-md"
      >
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      {/* Logo Section */}
      <div className={`relative mb-8 mt-8 md:mt-0 ${collapsed ? 'md:flex md:justify-center' : ''}`}>
        <div className={`flex items-center gap-2 bg-white rounded-xl shadow-lg shadow-black/20 ${collapsed ? 'md:p-2' : 'p-3'}`}>
          <div className={`w-8 h-8 rounded-lg bg-linear-to-br from-[#552ae7] to-[#7fe502] items-center justify-center shadow-md shrink-0 ${collapsed ? 'md:flex hidden' : 'hidden'}`}>
            <span className="text-white font-bold text-sm">E8</span>
          </div>
          <img src="/long_logo.png" alt="est8Ledger" className={`h-6 ${collapsed ? 'md:hidden' : ''}`} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 space-y-1 overflow-y-auto pr-2">
        <button
          onClick={() => {
            handleGoBack();
            onClose();
          }}
          title={collapsed ? "Back to Properties" : undefined}
          className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white md:rounded-lg group ${collapsed ? 'md:justify-center md:px-0 md:gap-0' : ''}`}
        >
          <ArrowLeft size={20} className="text-slate-500 group-hover:text-slate-200" />
          <span className={collapsed ? 'md:hidden' : ''}>Back to Properties</span>
        </button>
        <div className="my-3 h-px bg-white/10" />

        {sections.map((section) => {
          const isFirstItemActive = section.items.length === 1 && isActive(section.items[0].route);
          return (
            <div key={section.id}>
              {section.items.length === 1 && !section.icon ? (
                <Link
                  to={section.items[0].route}
                  onClick={onClose}
                  title={collapsed ? section.items[0].label : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all border-l-2 md:rounded-lg group ${
                    collapsed ? 'md:justify-center md:px-0 md:gap-0' : ''
                  } ${
                    isFirstItemActive
                      ? 'border-[#7fe502] text-white bg-gradient-to-r from-[#552ae7]/30 to-transparent'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isFirstItemActive ? 'text-[#7fe502]' : 'text-slate-500 group-hover:text-slate-200'}>{section.items[0].icon}</span>
                  <span className={collapsed ? 'md:hidden' : ''}>{section.items[0].label}</span>
                </Link>
              ) : (
                <>
                  {/* Expandable header + sublist: always used on mobile; used on desktop only when expanded */}
                  <div className={collapsed ? 'md:hidden' : ''}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-white/5 hover:text-white md:rounded-lg group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 group-hover:text-slate-200">{section.icon}</span>
                        <span>{section.title}</span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 text-slate-500 group-hover:text-slate-200 ${
                          expandedSection === section.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedSection === section.id && (
                      <div className="space-y-1 py-2 pl-4">
                        {section.items.map((item) => {
                          const itemActive = isActive(item.route);
                          return (
                            <Link
                              key={item.label}
                              to={item.route}
                              onClick={onClose}
                              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all border-l-2 md:rounded-lg group ${
                                itemActive
                                  ? 'border-[#7fe502] text-white bg-gradient-to-r from-[#552ae7]/30 to-transparent'
                                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <span className={itemActive ? 'text-[#7fe502]' : 'text-slate-500 group-hover:text-slate-200'}>{item.icon}</span>
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Collapsed rail: flatten section into individual icon links, no grouping/expand */}
                  <div className={collapsed ? 'hidden md:block space-y-1' : 'hidden'}>
                    {section.items.map((item) => {
                      const itemActive = isActive(item.route);
                      return (
                        <Link
                          key={item.label}
                          to={item.route}
                          onClick={onClose}
                          title={item.label}
                          className={`flex items-center justify-center rounded-lg px-0 py-3 text-sm font-medium transition-all border-l-2 group ${
                            itemActive
                              ? 'border-[#7fe502] text-white bg-gradient-to-r from-[#552ae7]/30 to-transparent'
                              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className={itemActive ? 'text-[#7fe502]' : 'text-slate-500 group-hover:text-slate-200'}>{item.icon}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={`relative border-t border-white/10 pt-4 space-y-3 ${collapsed ? 'md:flex md:justify-center' : ''}`}>
        <div className={`hidden md:flex items-center gap-3 ${collapsed ? 'md:gap-0' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#552ae7] to-[#7fe502] flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {(state.user?.firstName?.[0] || "U").toUpperCase()}
          </div>
          <div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
            <h3 className="font-semibold text-slate-100 truncate text-sm">{state.user?.firstName || "User"}</h3>
            <p className="text-xs text-slate-500 truncate">{state.user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children}: LayoutProps) {

  const state = useAppStore();
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