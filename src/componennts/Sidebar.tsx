import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronLeft, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

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
  /** Property the dashboard is scoped to, shown as an identity card under the logo. */
  property?: { name: string; address?: string | null; image?: string | null };
  userFirstName?: string | null;
  userEmail?: string | null;
};

const navLinkClasses = (active: boolean, collapsed: boolean) =>
  `group flex items-center gap-3 rounded-lg px-2.5 py-[7px] text-[13.5px] transition-colors duration-150 ${
    collapsed ? "md:justify-center md:px-0 md:h-10" : ""
  } ${
    active
      ? "bg-[#3f0ee3]/[0.08] text-[#3f0ee3] font-semibold"
      : "text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-900"
  }`;

export default function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapsed,
  sections,
  backAction,
  property,
  userFirstName,
  userEmail,
}: SidebarProps) {
  const location = useLocation();
  // Nested pages (e.g. a tenant's profile) keep their section highlighted.
  const isActive = (route: string) =>
    location.pathname === route ||
    (route !== "/properties" && location.pathname.startsWith(route + "/"));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex ${
        collapsed ? "md:w-[72px]" : "md:w-64"
      } w-72 flex-col overflow-hidden border-r border-black/[0.06] bg-white px-3 pt-4 pb-3 md:relative md:bg-white/80 transition-[translate,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Logo + collapse toggle */}
      <div
        className={`mb-5 flex h-9 items-center ${
          collapsed ? "md:flex-col md:h-auto md:gap-3" : "justify-between"
        } px-1.5`}
      >
        <img
          src="/long_logo.png"
          alt="est8Ledger"
          className={`h-[18px] w-auto ${collapsed ? "md:hidden" : ""}`}
        />
        <span
          className={`h-8 w-8 rounded-[9px] bg-[#3f0ee3] items-center justify-center shrink-0 ${
            collapsed ? "md:flex hidden" : "hidden"
          }`}
        >
          <span className="text-white font-semibold text-[11px] tracking-tight">E8</span>
        </span>

        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:flex"
        >
          {collapsed ? <PanelLeftOpen size={17} strokeWidth={1.75} /> : <PanelLeftClose size={17} strokeWidth={1.75} />}
        </button>
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
        >
          <X size={16} />
        </button>
      </div>

      {/* Back to the property list */}
      {backAction && (
        <button
          onClick={() => {
            backAction.onClick();
            onClose();
          }}
          title={collapsed ? backAction.label : undefined}
          aria-label={backAction.label}
          className={`mb-2 flex items-center gap-1 rounded-lg px-1.5 py-1 text-[13px] font-medium text-[#3f0ee3] hover:bg-[#3f0ee3]/[0.06] self-start ${
            collapsed ? "md:self-center" : ""
          }`}
        >
          <ChevronLeft size={16} strokeWidth={2.25} className="shrink-0" />
          <span className={collapsed ? "md:hidden" : ""}>{backAction.label}</span>
        </button>
      )}

      {/* Property identity */}
      {property && (
        <div
          className={`mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-2 ring-1 ring-black/[0.04] ${
            collapsed ? "md:justify-center md:bg-transparent md:ring-0 md:p-0" : ""
          }`}
        >
          {property.image ? (
            <img
              src={property.image}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3f0ee3]/10 text-sm font-semibold text-[#3f0ee3]">
              {property.name?.[0]?.toUpperCase() ?? "P"}
            </span>
          )}
          <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <p className="truncate text-[13.5px] font-semibold text-slate-900">{property.name}</p>
            {property.address && (
              <p className="truncate text-xs text-slate-500">{property.address}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden -mx-1 px-1 pb-2">
        {sections.map((section) => (
          <div key={section.id}>
            {section.title && (
              <p
                className={`mb-1 px-2.5 text-[11.5px] font-semibold text-slate-400 ${
                  collapsed ? "md:hidden" : ""
                }`}
              >
                {section.title}
              </p>
            )}
            <div className="space-y-px">
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
                    <span
                      className={`shrink-0 ${
                        active ? "text-[#3f0ee3]" : "text-slate-500 group-hover:text-slate-700"
                      }`}
                    >
                      {item.icon}
                    </span>
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

      {/* Signed-in user */}
      <div className="mt-3 border-t border-black/[0.06] pt-3">
        <Link
          to="/properties/settings"
          onClick={onClose}
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-3 rounded-lg p-1.5 hover:bg-slate-100 ${
            collapsed ? "md:justify-center" : ""
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3f0ee3] to-[#6b46f5] text-[13px] font-semibold text-white">
            {(userFirstName?.[0] || "U").toUpperCase()}
          </span>
          <span className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <span className="block truncate text-[13px] font-semibold text-slate-900">
              {userFirstName || "Account"}
            </span>
            <span className="block truncate text-xs text-slate-500">{userEmail}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
