import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Check, ChevronsUpDown, LayoutGrid, Loader2, Plus } from "lucide-react";
import agreementService from "../services/agreementService";
import { useAppStore } from "../store";
import { useAnchoredPopover } from "../hooks/useAnchoredPopover";
import type { PropertyAgreement } from "../types";

function PropertyAvatar({ name, image, size = "md" }: { name?: string; image?: string | null; size?: "sm" | "md" }) {
  const box = size === "md" ? "h-9 w-9 rounded-[10px] text-sm" : "h-7 w-7 rounded-lg text-xs";
  return image ? (
    <img src={image} alt="" className={`${box} shrink-0 object-cover`} />
  ) : (
    <span className={`${box} flex shrink-0 items-center justify-center bg-[#3f0ee3] font-semibold text-white`}>
      {name?.[0]?.toUpperCase() ?? "P"}
    </span>
  );
}

/** Sidebar header in the dashboard: the current property, and a menu to jump to another. */
export default function PropertySwitcher({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const activeProperty = useAppStore((s) => s.activeProperty);
  const setActiveProperty = useAppStore((s) => s.setActiveProperty);
  const navigate = useNavigate();
  const router = useRouter();
  const { open, style, toggle: togglePopover, close, triggerRef, panelRef } = useAnchoredPopover<HTMLButtonElement>("below");
  const [properties, setProperties] = useState<PropertyAgreement[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = () => {
    setLoadFailed(false);
    agreementService
      .getPropertyAgreements()
      .then((res) => setProperties((res?.data ?? res ?? []) as PropertyAgreement[]))
      .catch(() => setLoadFailed(true));
  };

  const toggle = () => {
    if (!open && properties === null) load();
    togglePopover();
  };

  const finish = () => {
    close();
    onNavigate();
  };

  const switchTo = async (property: PropertyAgreement) => {
    finish();
    if (property.id === activeProperty?.id) return;
    setActiveProperty(property);
    // Detail pages belong to the old property, so land on its overview.
    await navigate({ to: "/dashboard/home" });
    router.invalidate();
  };

  const leave = (to: "/properties" | "/properties/add") => {
    finish();
    setActiveProperty(null);
    navigate({ to });
  };

  if (!activeProperty) return null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${activeProperty.propertyName}, switch property`}
        className={`group mb-4 flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left hover:bg-black/[0.04] ${
          open ? "bg-black/[0.04]" : ""
        } ${collapsed ? "md:justify-center" : ""}`}
      >
        <PropertyAvatar name={activeProperty.propertyName} image={activeProperty.propertyImage} />
        <span className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
          <span className="block truncate text-[13.5px] font-semibold text-slate-900">
            {activeProperty.propertyName}
          </span>
          {activeProperty.propertyAddress && (
            <span className="block truncate text-xs text-slate-500">{activeProperty.propertyAddress}</span>
          )}
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
            className="z-[60] overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-black/[0.08] backdrop-blur-xl animate-fade-up"
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-semibold text-slate-400">Properties</p>
            <div className="max-h-72 overflow-y-auto">
              {properties === null && !loadFailed && (
                <div className="flex items-center gap-2 px-2.5 py-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" /> Loading…
                </div>
              )}
              {loadFailed && (
                <button
                  onClick={load}
                  className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
                >
                  Couldn't load properties. <span className="font-medium text-[#3f0ee3]">Try again</span>
                </button>
              )}
              {properties?.map((property) => {
                const current = property.id === activeProperty.id;
                return (
                  <button
                    key={property.id}
                    role="menuitemradio"
                    aria-checked={current}
                    onClick={() => switchTo(property)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-slate-100"
                  >
                    <PropertyAvatar name={property.propertyName} image={property.propertyImage} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-slate-900">
                        {property.propertyName}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {property.tenancies?.length ?? 0} of {property.numberOfUnits ?? 0} units let
                      </span>
                    </span>
                    {current && <Check size={15} strokeWidth={2.5} className="shrink-0 text-[#3f0ee3]" />}
                  </button>
                );
              })}
            </div>
            <div className="my-1.5 h-px bg-black/[0.06]" />
            <button
              role="menuitem"
              onClick={() => leave("/properties")}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-slate-700 hover:bg-slate-100"
            >
              <LayoutGrid size={16} strokeWidth={1.75} className="text-slate-500" />
              All properties
            </button>
            <button
              role="menuitem"
              onClick={() => leave("/properties/add")}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-slate-700 hover:bg-slate-100"
            >
              <Plus size={16} strokeWidth={1.75} className="text-slate-500" />
              Add property
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
