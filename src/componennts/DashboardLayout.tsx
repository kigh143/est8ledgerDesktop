
import {
  Bell,
  Search,
  LayoutDashboard,
} from "lucide-react";

type LayoutProps = {
    children:any,
    pageTitle:string,
    subTitle:string
}

function Sidebar() {
  const menu = [
    {
      icon: <Bell size={18} />,
      label: "Properties",
      active: true,
      badge: 6,
    },
    {
      icon: <LayoutDashboard size={18} />,
      label: "Add Property",
    }
  ];

  return (
    <aside className="flex w-full flex-col border-b border-gray-200 bg-white p-5 md:w-72 md:border-b-0 md:border-r">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
          E
        </div>

        <h1 className="text-lg font-semibold">est8Ledger</h1>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {menu.map((item) => (
          <button
            key={item.label}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition ${
              item.active
                ? "bg-gray-100 font-semibold text-black"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>

            {item.badge && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="mt-auto hidden border-t border-gray-200 pt-5 md:block">
        <h3 className="font-semibold text-gray-900">Kevin Dukkon</h3>
        <p className="text-sm text-gray-500">kevin@fintory.com</p>
      </div>
    </aside>
  );
}

export default function DashboardLayout({children, pageTitle,subTitle}:LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className=" flex h-screen  flex-col overflow-hidden  border border-gray-200 bg-white shadow-xl md:flex-row">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-5 md:p-10">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {pageTitle}
              </h1>

              <p className="mt-1 text-gray-500">
                {subTitle}
              </p>
            </div>

            <button className="rounded-full bg-gray-100 px-6 py-3 text-sm font-medium transition hover:bg-gray-200">
              Mark all as completed
            </button>
          </div>

          {/* Today */}
          {children}
        </main>
      </div>
    </div>
  );
}