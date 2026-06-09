import type { ComponentType, ReactNode } from "react";

type IconType = ComponentType<{ size?: number; className?: string }>;

export type Tone =
  | "violet" | "emerald" | "amber" | "red"
  | "blue" | "slate" | "sky" | "orange" | "purple";

const toneChip: Record<Tone, string> = {
  violet: "bg-[#3f0ee3]/10 text-[#3f0ee3]",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  slate: "bg-slate-100 text-slate-600",
  sky: "bg-sky-100 text-sky-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
};

/** Section header used at the top of each dashboard page. */
export function PageHeader({ icon: Icon, title, subtitle, actions }: {
  icon?: IconType;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#3f0ee3]/10 text-[#3f0ee3] shrink-0">
            <Icon size={22} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** Icon-accented KPI card. */
export function StatCard({ icon: Icon, label, value, hint, tone = "slate", valueClass }: {
  icon: IconType;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  valueClass?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${toneChip[tone]}`}>
          <Icon size={20} />
        </span>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className={`mt-3 text-2xl font-bold tabular-nums ${valueClass ?? "text-slate-900"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Centered empty / no-data state. */
export function EmptyState({ icon: Icon, title, message, action }: {
  icon: IconType;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <Icon size={40} className="text-slate-300 mb-3" />
      <p className="font-medium text-slate-900">{title}</p>
      {message && <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
