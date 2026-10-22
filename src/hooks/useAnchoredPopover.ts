import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

type Placement = "below" | "above";

/**
 * Open/close state for a popover anchored to a trigger. The panel is positioned
 * with `fixed` coordinates so it escapes the sidebar's overflow clipping, and it
 * closes on outside click, Escape, resize and scroll.
 */
export function useAnchoredPopover<T extends HTMLElement>(placement: Placement, width = 264) {
  const triggerRef = useRef<T>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const close = useCallback(() => setStyle(null), []);

  const toggle = useCallback(() => {
    setStyle((current) => {
      if (current || !triggerRef.current) return null;
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      return placement === "below"
        ? { position: "fixed", top: rect.bottom + 6, left, width }
        : { position: "fixed", bottom: window.innerHeight - rect.top + 6, left, width };
    });
  }, [placement, width]);

  const open = style !== null;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  return { open, style: style ?? undefined, toggle, close, triggerRef, panelRef };
}
