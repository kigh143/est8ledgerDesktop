import { Link, useLocation } from "@tanstack/react-router";
import { useState, type FocusEvent, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import AccountMenu from "./AccountMenu";

export type NavItem = {
  icon: ReactNode;
  label: string;
  route: string;
  /** Count shown at the trailing edge (e.g. unread notifications). */
  badge?: number;
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
  /** Rendered under the logo, e.g. the property switcher. */
  header?: ReactNode;
};

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const COLLAPSE_SHORTCUT = isMac ? "⌘\\" : "Ctrl+\\";

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapsed, sections, header }: SidebarProps) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null);

  // Nested pages (e.g. a tenant's profile) keep their section highlighted.
  const isActive = (route: string) =>
    pathname === route || (route !== "/properties" && pathname.startsWith(route + "/"));

  // Collapsed rail: show labels in a floating tooltip (the nav clips anything positioned inside it).
  const showTooltip = (label: string, target: HTMLElement) => {
    if (!collapsed || window.innerWidth < 768) return;
    const rect = target.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2 });
  };
  const tooltipHandlers = (label: string) => ({
    onMouseEnter: (e: MouseEvent<HTMLElement>) => showTooltip(label, e.currentTarget),
    onMouseLeave: () => setTooltip(null),
    onFocus: (e: FocusEvent<HTMLElement>) => showTooltip(label, e.currentTarget),
    onBlur: () => setTooltip(null),
  });

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-black/[0.06] bg-[#fbfbfd] px-3 pb-3 pt-4 transition-[translate,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:relative ${
        collapsed ? "md:w-[68px]" : "md:w-64"
      } ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}`}
    >
      {/* Logo + collapse toggle */}
      <div className={`mb-4 flex h-8 items-center px-1.5 ${collapsed ? "md:justify-center" : "justify-between"}`}>
        <img src="/long_logo.png" alt="est8Ledger" className={`h-[18px] w-auto ${collapsed ? "md:hidden" : ""}`} />
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          {...tooltipHandlers(`Expand sidebar  ${COLLAPSE_SHORTCUT}`)}
          title={collapsed ? undefined : `Collapse sidebar (${COLLAPSE_SHORTCUT})`}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-black/[0.05] hover:text-slate-700 md:flex"
        >
          {collapsed ? <PanelLeftOpen size={17} strokeWidth={1.75} /> : <PanelLeftClose size={17} strokeWidth={1.75} />}
        </button>
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-slate-600 md:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {header}

      {/* Navigation */}
      <nav
        aria-label="Main"
        className="-mx-1 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-1 pb-2"
        onScroll={() => setTooltip(null)}
      >
        {sections.map((section) => (
          <div key={section.id}>
            {section.title &&
              (collapsed ? (
                <div className="mx-2.5 mb-2 hidden h-px bg-black/[0.06] md:block" aria-hidden="true" />
              ) : null)}
            {section.title && (
              <p className={`mb-1 px-2.5 text-[11.5px] font-semibold text-slate-400 ${collapsed ? "md:hidden" : ""}`}>
                {section.title}
              </p>
            )}
            <div className="space-y-px">
              {section.items.map((item) => {
                const active = isActive(item.route);
                const badge = item.badge && item.badge > 0 ? (item.badge > 99 ? "99+" : String(item.badge)) : null;
                return (
                  <Link
                    key={item.route}
                    to={item.route}
                    onClick={() => {
                      setTooltip(null);
                      onClose();
                    }}
                    aria-current={active ? "page" : undefined}
                    {...tooltipHandlers(badge ? `${item.label} · ${badge}` : item.label)}
                    className={`group relative flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[13.5px] transition-colors duration-150 ${
                      collapsed ? "md:justify-center md:px-0" : ""
                    } ${
                      active
                        ? "bg-white font-semibold text-slate-900 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_0.5px_rgb(0_0_0/0.06)]"
                        : "font-medium text-slate-600 hover:bg-black/[0.04] hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`shrink-0 ${active ? "text-[#3f0ee3]" : "text-slate-400 group-hover:text-slate-600"}`}
                    >
                      {item.icon}
                    </span>
                    <span className={`min-w-0 flex-1 truncate ${collapsed ? "md:hidden" : ""}`}>{item.label}</span>
                    {badge && (
                      <>
                        <span
                          className={`min-w-[20px] rounded-full bg-[#ff3b30] px-1.5 text-center text-[11px] font-semibold leading-5 text-white tabular-nums ${
                            collapsed ? "md:hidden" : ""
                          }`}
                        >
                          {badge}
                        </span>
                        {collapsed && (
                          <span className="absolute right-2.5 top-1.5 hidden h-2 w-2 rounded-full bg-[#ff3b30] ring-2 ring-[#fbfbfd] md:block" />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-black/[0.06] pt-2">
        <AccountMenu collapsed={collapsed} onNavigate={onClose} />
      </div>

      {tooltip &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: tooltip.top }}
            className="pointer-events-none fixed left-[76px] z-[70] -translate-y-1/2 whitespace-pre rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
          >
            {tooltip.label}
          </div>,
          document.body,
        )}
    </aside>
  );
}
