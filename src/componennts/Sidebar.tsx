import { Link, useLocation } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

export type NavItem = {
  icon: ReactNode;
  label: string;
  route: string;
};

export type NavSection = {
  id: string;
  /** Omit to render items as flat top-level links; set to render as a collapsible group. */
  title?: string;
  icon?: ReactNode;
  items: NavItem[];
};

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  sections: NavSection[];
  defaultExpandedSectionId?: string;
  backAction?: { label: string; onClick: () => void };
  userFirstName?: string | null;
  userEmail?: string | null;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fe502] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const leafLinkClasses = (active: boolean, collapsed: boolean) =>
  `flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium transition-all border-l-2 group ${focusRing} ${
    collapsed ? "md:justify-center md:px-0" : "justify-between"
  } ${
    active
      ? "border-[#3f0ee3] text-white bg-[#3f0ee3]/15"
      : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
  }`;

const subLinkClasses = (active: boolean) =>
  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all border-l-2 group ${focusRing} ${
    active
      ? "border-[#3f0ee3] text-white bg-[#3f0ee3]/15"
      : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
  }`;

const railLinkClasses = (active: boolean) =>
  `flex items-center justify-center rounded-lg px-0 py-3 text-sm font-medium transition-all border-l-2 group ${focusRing} ${
    active
      ? "border-[#3f0ee3] text-white bg-[#3f0ee3]/15"
      : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
  }`;

export default function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapsed,
  sections,
  defaultExpandedSectionId,
  backAction,
  userFirstName,
  userEmail,
}: SidebarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    defaultExpandedSectionId ?? null
  );
  const location = useLocation();
  const isActive = (route: string) => location.pathname === route;
  const toggleSection = (id: string) =>
    setExpandedSection((prev) => (prev === id ? null : id));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex ${
        collapsed ? "md:w-20" : "w-72"
      } w-72 flex-col overflow-hidden border-r border-white/10 bg-slate-900 px-4 py-6 sm:px-6 md:relative md:py-8 transition-[transform,width] duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } shadow-xl`}
    >
      {/* Close Button (Mobile) */}
      <button
        onClick={onClose}
        aria-label="Close sidebar"
        className={`absolute top-3 right-3 md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${focusRing}`}
      >
        <X size={22} />
      </button>

      {/* Collapse Toggle (Desktop) */}
      <button
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`hidden md:flex absolute top-8 -right-3 z-10 items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shadow-md ${focusRing}`}
      >
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      {/* Logo Section */}
      <div className={`relative mb-8 mt-8 md:mt-0 ${collapsed ? "md:flex md:justify-center" : ""}`}>
        <div className={`flex items-center gap-2 bg-white rounded-xl shadow-lg shadow-black/20 ${collapsed ? "md:p-2" : "p-3"}`}>
          <div className={`w-8 h-8 rounded-lg bg-[#3f0ee3] items-center justify-center shadow-md shrink-0 ${collapsed ? "md:flex hidden" : "hidden"}`}>
            <span className="text-white font-bold text-sm">E8</span>
          </div>
          <img src="/long_logo.png" alt="est8Ledger" className={`h-6 ${collapsed ? "md:hidden" : ""}`} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 space-y-1 overflow-y-auto pr-2">
        {backAction && (
          <>
            <button
              onClick={() => {
                backAction.onClick();
                onClose();
              }}
              title={collapsed ? backAction.label : undefined}
              aria-label={backAction.label}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white group ${focusRing} ${
                collapsed ? "md:justify-center md:px-0 md:gap-0" : ""
              }`}
            >
              <ArrowLeft size={20} className="text-slate-500 group-hover:text-slate-200" />
              <span className={collapsed ? "md:hidden" : ""}>{backAction.label}</span>
            </button>
            <div className="my-3 h-px bg-white/10" />
          </>
        )}

        {sections.map((section) => {
          const isGrouped = !!section.title;

          if (!isGrouped) {
            return (
              <div key={section.id} className={section.items.length > 1 ? "space-y-1" : undefined}>
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
                      className={leafLinkClasses(active, collapsed)}
                    >
                      <div className={`flex items-center gap-3 ${collapsed ? "md:gap-0" : ""}`}>
                        <span className={active ? "text-white" : "text-slate-500 group-hover:text-slate-200"}>
                          {item.icon}
                        </span>
                        <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
                      </div>
                      <ChevronRight
                        size={18}
                        className={`transition-opacity ${collapsed ? "md:hidden" : ""} ${
                          active ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-100 text-slate-500"
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={section.id}>
              {/* Expandable header + sublist: always used on mobile; used on desktop only when expanded */}
              <div className={collapsed ? "md:hidden" : ""}>
                <button
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={expandedSection === section.id}
                  className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-white/5 hover:text-white group ${focusRing}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 group-hover:text-slate-200">{section.icon}</span>
                    <span>{section.title}</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-300 text-slate-500 group-hover:text-slate-200 ${
                      expandedSection === section.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedSection === section.id && (
                  <div className="space-y-1 py-2 pl-4">
                    {section.items.map((item) => {
                      const active = isActive(item.route);
                      return (
                        <Link
                          key={item.label}
                          to={item.route}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={subLinkClasses(active)}
                        >
                          <span className={active ? "text-white" : "text-slate-500 group-hover:text-slate-200"}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Collapsed rail: flatten section into individual icon links, no grouping/expand */}
              <div className={collapsed ? "hidden md:block space-y-1" : "hidden"}>
                {section.items.map((item) => {
                  const active = isActive(item.route);
                  return (
                    <Link
                      key={item.label}
                      to={item.route}
                      onClick={onClose}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
                      className={railLinkClasses(active)}
                    >
                      <span className={active ? "text-white" : "text-slate-500 group-hover:text-slate-200"}>
                        {item.icon}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={`relative border-t border-white/10 pt-4 ${collapsed ? "md:flex md:justify-center" : ""}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "md:gap-0" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-[#3f0ee3] flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {(userFirstName?.[0] || "U").toUpperCase()}
          </div>
          <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <h3 className="font-semibold text-slate-100 truncate text-sm">{userFirstName || "User"}</h3>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
