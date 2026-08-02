
import {
  House,
  HousePlus,
  Settings,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAppStore } from "../store";
import { Link,  useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type LayoutProps = {
  children: any,
  pageTitle: string,
  subTitle: string
  action?: any
}

const SIDEBAR_COLLAPSED_KEY = "el_sidebar_collapsed";

function Sidebar({ isOpen, onClose, collapsed, onToggleCollapsed }: { isOpen: boolean; onClose: () => void; collapsed: boolean; onToggleCollapsed: () => void }) {
  const menu = [
    {
      icon: <House size={20} />,
      label: "My Properties",
      route: '/properties'
    },
    {
      icon: <HousePlus size={20} />,
      label: "Add Property",
      route: '/properties/add'
    },
    {
      icon: <CreditCard size={20} />,
      label: "Subscription",
      route: '/properties/subscription'
    }, {
      icon: <Settings size={20} />,
      label: "Settings",
      route: '/properties/settings'
    }
  ];

  const user = useAppStore(state => state.user);
  const location = useLocation();
  const isActive = (route: string) => location.pathname === route;

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
        {menu.map((item) => {
          const active = isActive(item.route);
          return (
            <Link
              to={item.route}
              key={item.label}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              className={`flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium transition-all border-l-2 md:rounded-lg group ${
                collapsed ? 'md:justify-center md:px-0' : 'justify-between'
              } ${
                active
                  ? 'border-[#7fe502] text-white bg-gradient-to-r from-[#552ae7]/30 to-transparent'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`flex items-center gap-3 ${collapsed ? 'md:gap-0' : ''}`}>
                <span className={`transition-colors ${active ? 'text-[#7fe502]' : 'text-slate-500 group-hover:text-slate-200'}`}>{item.icon}</span>
                <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
              </div>
              <ChevronRight size={18} className={`transition-opacity ${collapsed ? 'md:hidden' : ''} ${active ? 'opacity-100 text-[#7fe502]' : 'opacity-0 group-hover:opacity-100 text-slate-500'}`} />
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={`relative border-t border-white/10 pt-4 space-y-3 ${collapsed ? 'md:flex md:justify-center' : ''}`}>
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-[#552ae7] to-[#7fe502] items-center justify-center text-white font-semibold text-sm shrink-0 ${collapsed ? 'md:flex hidden' : 'hidden'}`}>
          {(user?.firstName?.[0] ?? 'U').toUpperCase()}
        </div>
        <div className={`hidden md:block ${collapsed ? 'md:hidden' : ''}`}>
          <h3 className="font-semibold text-slate-100 truncate text-sm">{user?.firstName ?? 'User'}</h3>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>
      </div>
    </aside>
  );
}

export default function PropertiesLayout({ children, pageTitle, subTitle }: LayoutProps) {
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
                    {pageTitle}
                  </h1>
                  <p className="mt-2 truncate text-sm text-slate-500 font-medium">
                    {subTitle}
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