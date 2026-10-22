import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, CreditCard, LifeBuoy, LogOut, Settings, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useAppStore } from "../store";
import { useAnchoredPopover } from "../hooks/useAnchoredPopover";

const SUPPORT_EMAIL = "support@est8ledger.com";

function MenuRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] hover:bg-slate-100 ${
        danger ? "text-[#d70015]" : "text-slate-700"
      }`}
    >
      <span className={danger ? "text-[#d70015]" : "text-slate-500"}>{icon}</span>
      {label}
    </button>
  );
}

/** Signed-in user at the foot of the sidebar; opens account shortcuts and sign out. */
export default function AccountMenu({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const { open, style, toggle: togglePopover, close, triggerRef, panelRef } = useAnchoredPopover<HTMLButtonElement>("above", 240);

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Account";
  const icon = { size: 16, strokeWidth: 1.75 } as const;

  const go = (to: "/properties/settings" | "/properties/subscription" | "/properties/wallet") => {
    close();
    onNavigate();
    navigate({ to });
  };

  const signOut = () => {
    close();
    logout();
    navigate({ to: "/login" });
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={togglePopover}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${name}, account menu`}
        className={`group flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left hover:bg-black/[0.04] ${
          open ? "bg-black/[0.04]" : ""
        } ${collapsed ? "md:justify-center" : ""}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[13px] font-semibold text-white">
          {(user?.firstName?.[0] || "U").toUpperCase()}
        </span>
        <span className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
          <span className="block truncate text-[13px] font-semibold text-slate-900 capitalize">{name}</span>
          <span className="block truncate text-xs text-slate-500">{user?.email}</span>
        </span>
        <ChevronsUpDown
          size={15}
          className={`shrink-0 text-slate-400 group-hover:text-slate-600 ${collapsed ? "md:hidden" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={style}
            role="menu"
            className="z-[60] rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-black/[0.08] backdrop-blur-xl animate-fade-up"
          >
            <div className="px-2.5 pb-2 pt-1.5">
              <p className="truncate text-[13.5px] font-semibold text-slate-900 capitalize">{name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="mb-1.5 h-px bg-black/[0.06]" />
            <MenuRow icon={<Settings {...icon} />} label="Settings" onClick={() => go("/properties/settings")} />
            <MenuRow
              icon={<CreditCard {...icon} />}
              label="Subscription"
              onClick={() => go("/properties/subscription")}
            />
            <MenuRow icon={<Wallet {...icon} />} label="Wallet" onClick={() => go("/properties/wallet")} />
            <MenuRow
              icon={<LifeBuoy {...icon} />}
              label="Help & support"
              onClick={() => {
                close();
                window.location.href = `mailto:${SUPPORT_EMAIL}`;
              }}
            />
            <div className="my-1.5 h-px bg-black/[0.06]" />
            <MenuRow icon={<LogOut {...icon} />} label="Sign out" onClick={signOut} danger />
          </div>,
          document.body,
        )}
    </>
  );
}
