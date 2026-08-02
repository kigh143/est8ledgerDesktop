import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

export type NavItem = {
  icon: ReactNode;
  label: string;
  route: string;
};

export type NavSection = {
  id: string;
  /** Omit to render items with no group label. */
  title?: string;
  items: NavItem[];
};

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  sections: NavSection[];
  backAction?: { label: string; onClick: () => void };
  userFirstName?: string | null;
  userEmail?: string | null;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fe502] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

const navLinkClasses = (active: boolean, collapsed: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer ${focusRing} ${
    collapsed ? "md:justify-center md:px-2" : ""
  } ${
    active
      ? "bg-[#3f0ee3] text-white"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

export default function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapsed,
  sections,
  backAction,
  userFirstName,
  userEmail,
}: SidebarProps) {
  const location = useLocation();
  const isActive = (route: string) => location.pathname === route;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex ${
        collapsed ? "md:w-19" : "w-72"
      } w-72 flex-col overflow-hidden border-r border-white/6 bg-linear-to-b from-slate-900 to-slate-950 px-3 py-6 sm:px-4 md:relative md:py-7 transition-[transform,width] duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } shadow-2xl shadow-black/40`}
    >
      {/* Close Button (Mobile) */}
      <button
        onClick={onClose}
        aria-label="Close sidebar"
        className={`absolute top-3 right-3 md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer ${focusRing}`}
      >
        <X size={20} />
      </button>

      {/* Logo + Collapse Toggle */}
      <div
        className={`mb-8 mt-8 flex items-center md:mt-0 ${
          collapsed ? "md:flex-col md:gap-3" : "justify-between"
        }`}
      >
        <div
          className={`inline-flex items-center rounded-lg border border-black/5 bg-white ${
            collapsed ? "md:p-2" : "px-3 py-2"
          }`}
        >
          <div
            className={`h-6 w-6 rounded-md bg-[#3f0ee3] items-center justify-center shrink-0 ${
              collapsed ? "md:flex hidden" : "hidden"
            }`}
          >
            <span className="text-white font-bold text-[10px]">E8</span>
          </div>
          <img
            src="/long_logo.png"
            alt="est8Ledger"
            className={`h-5 w-auto ${collapsed ? "md:hidden" : ""}`}
          />
        </div>

        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer md:flex ${focusRing}`}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 space-y-6 overflow-y-auto overflow-x-hidden pb-2 pr-1 -mr-1">
        {backAction && (
          <div>
            <button
              onClick={() => {
                backAction.onClick();
                onClose();
              }}
              title={collapsed ? backAction.label : undefined}
              aria-label={backAction.label}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-white/5 hover:text-white cursor-pointer ${focusRing} ${
                collapsed ? "md:justify-center md:px-2" : ""
              }`}
            >
              <ArrowLeft size={18} className="shrink-0" />
              <span className={collapsed ? "md:hidden" : ""}>{backAction.label}</span>
            </button>
            <div className="mt-6 h-px bg-white/6" />
          </div>
        )}

        {sections.map((section) => (
          <div key={section.id}>
            {section.title && (
              <p
                className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600 ${
                  collapsed ? "md:hidden" : ""
                }`}
              >
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.route);
                return (
                  <Link
                    key={item.label}
                    to={item.route}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={navLinkClasses(active, collapsed)}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="relative mt-4 border-t border-white/6 pt-4">
        <div
          className={`flex items-center gap-3 rounded-lg ${
            collapsed ? "md:justify-center" : "px-1"
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3f0ee3] text-sm font-semibold text-white">
            {(userFirstName?.[0] || "U").toUpperCase()}
          </div>
          <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <h3 className="truncate text-sm font-medium text-slate-200">
              {userFirstName || "User"}
            </h3>
            <p className="truncate text-xs text-slate-500">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
