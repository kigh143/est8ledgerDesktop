
import {
  House,
  HousePlus,
  Settings,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  LogOut
} from "lucide-react";
import { useAppStore } from "../store";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState } from "react";

type LayoutProps = {
  children: any,
  pageTitle: string,
  subTitle: string
  action?: any
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-slate-50 px-4 py-6 sm:px-6 md:relative md:py-8 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-sm`}>
      {/* Close Button (Mobile) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:hidden text-slate-600 hover:text-slate-900 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Logo Section */}
      <div className="mb-8 mt-8 md:mt-0">
        <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#552ae7] to-[#7fe502] flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">E8</span>
          </div>
          <img src="/long_logo.png" alt="est8Ledger" className="h-6" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
        {menu.map((item) => {
          const active = isActive(item.route);
          return (
            <Link
              to={item.route}
              key={item.label}
              onClick={onClose}
              className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all border-l-2 md:rounded-lg group ${
                active
                  ? 'border-[#552ae7] text-[#552ae7] bg-[#552ae7]/5'
                  : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-colors ${active ? 'text-[#552ae7]' : 'text-slate-600 group-hover:text-slate-800'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              <ChevronRight size={18} className={`transition-opacity ${active ? 'opacity-100 text-[#552ae7]' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`} />
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="my-3 h-px bg-slate-200" />

      {/* User Section */}
      <div className="border-t border-slate-200 pt-4 space-y-3">
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Account</p>
          <h3 className="mt-2 font-semibold text-slate-900 truncate text-sm">{user?.firstName ?? 'User'}</h3>
          <p className="text-xs text-slate-600 truncate">{user?.email}</p>
        </div>
      </div>
    </aside>
  );
}

export default function PropertiesLayout({ children, pageTitle, subTitle, action = null }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

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