import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type IconType = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

export type Tone =
  | "violet" | "emerald" | "amber" | "red"
  | "blue" | "slate" | "sky" | "orange" | "purple";

const toneChip: Record<Tone, string> = {
  violet: "bg-[#3f0ee3]/[0.08] text-[#3f0ee3]",
  emerald: "bg-[#34c759]/[0.12] text-[#248a3d]",
  amber: "bg-[#ff9500]/[0.12] text-[#b25000]",
  red: "bg-[#ff3b30]/[0.10] text-[#d70015]",
  blue: "bg-[#007aff]/[0.10] text-[#0062cc]",
  slate: "bg-slate-100 text-slate-600",
  sky: "bg-[#32ade6]/[0.12] text-[#0071a4]",
  orange: "bg-[#ff9500]/[0.12] text-[#c93400]",
  purple: "bg-[#af52de]/[0.12] text-[#8944ab]",
};

const toneDot: Record<Tone, string> = {
  violet: "bg-[#3f0ee3]",
  emerald: "bg-[#34c759]",
  amber: "bg-[#ff9500]",
  red: "bg-[#ff3b30]",
  blue: "bg-[#007aff]",
  slate: "bg-slate-400",
  sky: "bg-[#32ade6]",
  orange: "bg-[#ff9500]",
  purple: "bg-[#af52de]",
};

/** Large-title page header used at the top of each dashboard page. */
export function PageHeader({ title, subtitle, actions }: {
  /** Accepted for backwards compatibility; large titles read cleaner without an icon tile. */
  icon?: IconType;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
      <div className="min-w-0">
        <h1 className="truncate text-[32px] font-bold leading-tight tracking-[-0.028em] text-slate-900 sm:text-[34px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[15px] text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** Quiet KPI tile: label, figure, optional hint. The icon is a small tinted glyph, not the focus. */
export function StatCard({ icon: Icon, label, value, hint, tone = "slate", valueClass }: {
  icon: IconType;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  valueClass?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500 truncate">{label}</p>
        <span className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${toneChip[tone]}`}>
          <Icon size={14} strokeWidth={2} />
        </span>
      </div>
      <p className={`mt-3 text-[26px] leading-none font-semibold tabular-nums truncate ${valueClass ?? "text-slate-900"}`}>
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** Centered empty / no-data state. Reads as an invitation to act. */
export function EmptyState({ icon: Icon, title, message, action }: {
  icon: IconType;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={26} strokeWidth={1.5} />
      </span>
      <p className="text-[17px] font-semibold text-slate-900">{title}</p>
      {message && <p className="text-sm text-slate-500 mt-1 max-w-sm leading-relaxed">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Status pill with a leading dot. */
export function Badge({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${toneChip[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneDot[tone]}`} />
      {children}
    </span>
  );
}

/** iOS-style segmented control. */
export function Segmented<T extends string>({ value, onChange, options, ariaLabel }: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  ariaLabel?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex rounded-[10px] bg-slate-200/70 p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
              active ? "bg-white text-slate-900 shadow-[0_1px_3px_rgb(0_0_0/0.1),0_0_0_0.5px_rgb(0_0_0/0.04)]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`tabular-nums text-xs ${active ? "text-slate-500" : "text-slate-400"}`}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Label / value row used in grouped detail lists. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

/** Centered spinner for loading sections. */
export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500" role="status">
      <Loader2 size={22} className="animate-spin text-slate-400" />
      <span className="mt-3 text-sm">{label}…</span>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  input?: { placeholder: string; minLength?: number; error?: string };
  onConfirm: (value: string) => void;
  onClose: () => void;
};

/**
 * Apple-style alert dialog. With `input`, it collects a short reason before confirming
 * (used for rejections and disputes).
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  // Mounting only while open gives every opening a fresh input.
  return props.open ? <ConfirmDialogBody {...props} /> : null;
}

function ConfirmDialogBody({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  busy,
  input,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const tooShort = !!input && value.trim().length < (input.minLength ?? 3);

  const submit = () => {
    setTouched(true);
    if (tooShort || busy) return;
    onConfirm(value.trim());
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => !busy && onClose()} />
      <div className="relative w-full max-w-[380px] rounded-[22px] bg-white/95 p-6 text-center shadow-2xl ring-1 ring-black/5 backdrop-blur-xl animate-fade-up">
        <h2 id="confirm-title" className="text-[17px] font-semibold text-slate-900">{title}</h2>
        {message && <div className="mt-2 text-sm leading-relaxed text-slate-600">{message}</div>}
        {input && (
          <div className="mt-4 text-left">
            <textarea
              autoFocus
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={input.placeholder}
              aria-invalid={touched && tooShort}
              className="field resize-none text-sm"
            />
            {touched && tooShort && (
              <p className="mt-1.5 text-xs text-[#d70015]">{input.error ?? "Add a short reason."}</p>
            )}
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={onClose} disabled={busy} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className={`btn ${destructive ? "bg-[#ff3b30] text-white hover:bg-[#e0352b]" : "btn-primary"}`}
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
