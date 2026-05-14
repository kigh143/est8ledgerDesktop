
import {
  House,
  HousePlus,
  Settings,
  CreditCard,
  MessageCircleQuestionMark,
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
      label: "Properties",
      route: '/properties'
    },
    {
      icon: <HousePlus size={20} />,
      label: "Add Property",
      route: '/properties/add'
    },
    {
      icon: <Settings size={20} />,
      label: "Settings",
      route: '/properties/settings'
    },
    {
      icon: <CreditCard size={20} />,
      label: "Subscriptions",
      route: '/properties/subscription'
    },
    {
      icon: <MessageCircleQuestionMark size={20} />,
      label: "Help & Support",
      route: '/properties/help'
    }
  ];

  const user = useAppStore(state => state.user);


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
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3f0ee3] to-[#3f0ee3]/80 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">E8</span>
          </div>
          <h1 className="text-xl font-bold text-white">est8Ledger</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        {menu.map((item) => (
          <Link
            to={item.route}
            key={item.label}
            onClick={onClose}
            className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700/50 hover:text-white active:bg-slate-700 md:rounded-xl group"
            activeProps={{ className: "bg-[#3f0ee3]/20 text-[#7fe502] border-l-2 border-[#3f0ee3]" }}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-700 pt-4 space-y-3">
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
          <h3 className="mt-2 font-semibold text-white truncate">{user?.firstName ?? 'Name'}</h3>
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

              <div className="flex items-center gap-3 md:gap-4">
                {action && (
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7fe502] to-[#7fe502]/90 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-[#7fe502]/40 transition-all hover:shadow-[#7fe502]/60 hover:from-[#7fe502] hover:to-[#7fe502] active:scale-95 md:rounded-xl md:px-6 md:py-3 md:text-base whitespace-nowrap font-bold">
                    Mark all as completed
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 text-slate-700 px-4 py-2.5 text-sm font-semibold hover:bg-slate-200 transition-colors md:rounded-xl md:px-5 md:py-3 md:text-base shrink-0"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
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