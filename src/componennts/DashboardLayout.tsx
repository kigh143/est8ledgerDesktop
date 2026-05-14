
import {
  LayoutDashboard,
  UsersRound,
  InspectionPanel,
  Vault,
  FolderOpenDot,
  NotebookText,
  Megaphone,
  ToolCase,
  HandCoins,
  Bell,
  ArrowLeft
} from "lucide-react";
import { useAppStore } from "../store";
import { Link, useNavigate } from "@tanstack/react-router";

type LayoutProps = {
  children: any,
}

function Sidebar() {
  const menu = [
    {
      icon: <LayoutDashboard size={18} />,
      label: "OverView",
      route: '/dashboard/home'
    },
    {
      icon: <UsersRound size={18} />,
      label: "Tenants",
      route: '/dashboard/tenants'
    },
    {
      icon: <ToolCase size={18} />,
      label: "Repair Reports",
      route: '/dashboard/repairs'
    },
    {
      icon: <HandCoins size={18} />,
      label: "property Expenses",
      route: '/dashboard/expenses'
    },
    {
      icon: <InspectionPanel size={18} />,
      label: "Inspections",
      route: '/dashboard/inspections'
    },
    {
      icon: <Vault size={18} />,
      label: "Security Deposits",
      route: '/dashboard/securitydeposits'
    },
    {
      icon: <FolderOpenDot size={18} />,
      label: "Rent Tracking",
      route: '/dashboard/renttracking'
    },
    {
      icon: <NotebookText size={18} />,
      label: "Tenacy Agreement",
      route: '/dashboard/agreement'
    },
    {
      icon: <Megaphone size={18} />,
      label: "Advertise For Tenants",
      route: '/dashboard/advertise'
    }

  ];

  const state = useAppStore();
  const navigate = useNavigate()

  const handleGoBack = () => {
    state.setActiveProperty(null);
    navigate({ to: '/properties' });
  }


  return (
    <aside className="flex w-full flex-col border-b border-gray-200 bg-white md:w-72 md:border-b-0 md:border-r">
      {/* Logo */}
      <div className="mb-2  gap-2 px-6 py-8" >
        <h1 className="text-lg font-semibold ">est8Ledger</h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 p-5 ">
        <button
          onClick={handleGoBack}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition`}
        >
          <div className="flex items-center gap-3">
            <ArrowLeft size={18} />
            <span>Back to Properties</span>
          </div>
        </button>
        {menu.map((item) => (
          <Link
            key={item.label}
            to={item.route}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="mt-auto hidden border-t border-gray-200 pt-5 md:block p-5">
        <h3 className="font-semibold text-gray-900">{state.user?.firstName || "Full Name"}</h3>
        <p className="text-sm text-gray-500">{state.user?.email}</p>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children}: LayoutProps) {

  const state = useAppStore();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className=" flex h-screen  flex-col overflow-hidden  border border-gray-200 bg-white shadow-xl md:flex-row">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-5 md:py-4 md:px-10">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-amber-100 pb-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {state.activeProperty?.propertyName}
              </h1>

              <p className="mt-1 text-gray-500">
                {state.activeProperty?.propertyAddress}
              </p>
            </div>

            <button className="rounded-full bg-gray-100 px-6 py-3 text-sm font-medium transition flex flex-row items-center hover:bg-gray-200">
              <Bell size={18} />  <span className="ml-2">Notifications</span>
            </button>
          </div>

          {/* Today */}
          {children}
        </main>
      </div>
    </div>
  );
}