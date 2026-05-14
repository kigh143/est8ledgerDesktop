
import {
  House,
  HousePlus,
  Settings,
  CreditCard,
  MessageCircleQuestionMark
} from "lucide-react";
import { useAppStore } from "../store";
import { Link } from "@tanstack/react-router";

type LayoutProps = {
  children: any,
  pageTitle: string,
  subTitle: string
  action?: any
}

function Sidebar() {
  const menu = [
    {
      icon: <House size={18} />,
      label: "Properties",
      route: '/properties'
    },
    {
      icon: <HousePlus size={18} />,
      label: "Add Property",
      route: '/properties/add'
    },
    {
      icon: <Settings size={18} />,
      label: "Settings",
      route: '/properties/settings'
    },
    {
      icon: <CreditCard size={18} />,
      label: "Subscriptions",
      route: '/properties/subscription'
    },
    {
      icon: <MessageCircleQuestionMark size={18} />,
      label: "Help & Support",
      route: '/properties/help'
    }
  ];

  const user = useAppStore(state => state.user);


  return (
    <aside className="flex w-full flex-col border-b border-gray-200 bg-white p-5 md:w-72 md:border-b-0 md:border-r">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <h1 className="text-lg font-semibold">est8Ledger</h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {menu.map((item) => (
          <Link
            to={item.route}
            key={item.label}
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
      <div className="mt-auto hidden border-t border-gray-200 pt-5 md:block">
        <h3 className="font-semibold text-gray-900">{user?.firstName ?? 'Name'}</h3>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>
    </aside>
  );
}

export default function PropertiesLayout({ children, pageTitle, subTitle, action = null }: LayoutProps) {
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

            {
              action && <button className="rounded-full bg-gray-100 px-6 py-3 text-sm font-medium transition hover:bg-gray-200">
                Mark all as completed
              </button>
            }

          </div>

          {/* Today */}
          {children}
        </main>
      </div>
    </div>
  );
}