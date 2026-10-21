import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type SlideOverProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
};

/** Right-side sheet used for all dialogs/forms across the app (replaces centered modals). */
export default function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClass = "max-w-md",
}: SlideOverProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-y-0 right-0 sm:inset-y-2 sm:right-2 w-full ${widthClass} flex flex-col overflow-hidden bg-white sm:rounded-[22px] shadow-2xl ring-1 ring-black/5 transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          visible ? "translate-x-0" : "translate-x-[105%]"
        }`}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 shrink-0">
            <div className="min-w-0">
              {title && <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900 truncate">{title}</h2>}
              {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 shrink-0"
            >
              <X size={16} strokeWidth={2.25} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-black/[0.06] bg-white/80 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
