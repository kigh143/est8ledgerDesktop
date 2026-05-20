
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
import { Link, useNavigate } from "@tanstack/react-router";
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
        {menu.map((item) => (
          <Link
            to={item.route}
            key={item.label}
            onClick={onClose}
            className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/50 hover:text-white hover:pl-5 active:bg-slate-700 md:rounded-xl group"
            activeProps={{ className: "bg-gradient-to-r from-[#3f0ee3]/20 to-[#3f0ee3]/10 text-[#7fe502] border-l-2 border-[#3f0ee3] hover:bg-gradient-to-r hover:from-[#3f0ee3]/30 hover:to-[#3f0ee3]/20" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[#3f0ee3] group-hover:text-[#7fe502] transition-colors">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-3 h-px bg-gradient-to-r from-slate-700/0 via-slate-700/50 to-slate-700/0" />

      {/* User Section */}
      <div className="border-t border-slate-700/50 pt-4 space-y-3">
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Account</p>
          <h3 className="mt-2 font-semibold text-white truncate text-sm">{user?.firstName ?? 'User'}</h3>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
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
                  <h1 className="truncate text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent sm:text-3xl">
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