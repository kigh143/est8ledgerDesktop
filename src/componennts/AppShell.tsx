import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import Sidebar, { type NavSection } from "./Sidebar";

const SIDEBAR_COLLAPSED_KEY = "el_sidebar_collapsed";

type AppShellProps = {
  sections: NavSection[];
  /** Rendered under the logo; receives the rail state and a callback that closes the mobile drawer. */
  sidebarHeader?: (collapsed: boolean, closeSidebar: () => void) => ReactNode;
  /** Compact title shown in the translucent toolbar. */
  toolbarTitle?: ReactNode;
  toolbarActions?: ReactNode;
  children: ReactNode;
};

/** Sidebar + translucent toolbar + scrolling canvas shared by every signed-in screen. */
export default function AppShell({
  sections,
  sidebarHeader,
  toolbarTitle,
  toolbarActions,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // Storage unavailable (private mode); the preference just won't persist.
    }
  }, [collapsed]);

  // ⌘\ (Ctrl+\ elsewhere) toggles the rail, as in Apple's apps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "\\" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        sections={sections}
        header={sidebarHeader?.(collapsed, closeSidebar)}
      />

      <main
        className="relative flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
      >
        {/* Toolbar: transparent at rest, frosted with a hairline once content scrolls under it. */}
        <header
          className={`sticky top-0 z-30 flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-10 transition-[background-color,box-shadow] duration-200 ${
            scrolled ? "glass shadow-[0_1px_0_rgb(0_0_0/0.06)]" : "bg-slate-50"
          }`}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="md:hidden -ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-black/5"
          >
            <Menu size={20} />
          </button>
          <div
            className={`min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900 transition-opacity duration-200 ${
              scrolled ? "opacity-100" : "opacity-100 md:opacity-0"
            }`}
          >
            {toolbarTitle}
          </div>
          {toolbarActions && <div className="flex shrink-0 items-center gap-1.5">{toolbarActions}</div>}
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-2 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
