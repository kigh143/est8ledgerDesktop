import { useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, Loader2, Minus } from "lucide-react";
import { toast } from "react-toastify";
import { Badge, EmptyState, Segmented } from "../dashboard/ui";
import { AgingBar, CategoryBars, TrendChart } from "./ReportCharts";
import { formatMoney } from "../../utils/reportFormat";
import reportService, { type CurrencyGroup, type PortfolioReport, type ReportGranularity, type ReportQuery } from "../../services/reportService";
import { getNetworkError } from "../../utils";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
const pct = (n: number | null) => (n === null ? "—" : `${n % 1 === 0 ? n : n.toFixed(1)}%`);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function step(q: ReportQuery, by: number): ReportQuery {
  if (q.period === "year") return { ...q, year: q.year + by };
  const per = q.period === "month" ? 12 : 4;
  const zero = q.year * per + (q.index - 1) + by;
  return { ...q, year: Math.floor(zero / per), index: (zero % per) + 1 };
}

/** Switching granularity keeps you in the same stretch of time: March → Q1 → 2026. */
function regrain(q: ReportQuery, period: ReportGranularity): ReportQuery {
  const firstMonth = q.period === "month" ? q.index : q.period === "quarter" ? (q.index - 1) * 3 + 1 : 1;
  const now = new Date();
  const month = q.period === "year" ? (q.year === now.getFullYear() ? now.getMonth() + 1 : 12) : firstMonth;
  return { ...q, period, index: period === "month" ? month : period === "quarter" ? Math.ceil(month / 3) : 1 };
}

const isFuture = (q: ReportQuery, now = new Date()) => {
  const startMonth = q.period === "month" ? q.index : q.period === "quarter" ? (q.index - 1) * 3 + 1 : 1;
  return new Date(q.year, startMonth - 1, 1) > now;
};

type Props = {
  query: ReportQuery;
  report: PortfolioReport | null;
  error?: string | null;
  loading: boolean;
  onChange: (next: ReportQuery) => void;
  /** Portfolio view lets you pick a property or all of them; the property dashboard is fixed to one */
  showPropertyPicker: boolean;
};

export default function ReportView({ query, report, error, loading, onChange, showPropertyPicker }: Props) {
  const [currency, setCurrency] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const group = report?.groups.find((g) => g.currency === currency) ?? report?.groups[0];
  const nextDisabled = isFuture(step(query, 1));

  const exportAs = async (kind: "pdf" | "excel") => {
    if (!report) return;
    setExporting(kind);
    try {
      if (kind === "pdf") await reportService.downloadPdf(query);
      else await (await import("../../utils/reportExcel")).downloadReportExcel(report);
    } catch (e) {
      toast.error(getNetworkError(e));
    } finally {
      setExporting(null);
    }
  };

  const years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 6 + i);

  return (
    <div className="space-y-6">
      {/* Controls: one row above everything they filter */}
      <div className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<ReportGranularity>
            ariaLabel="Report period"
            value={query.period}
            onChange={(p) => onChange(regrain(query, p))}
            options={[
              { value: "month", label: "Monthly" },
              { value: "quarter", label: "Quarterly" },
              { value: "year", label: "Yearly" },
            ]}
          />
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-secondary h-9 w-9 !px-0" aria-label="Previous period" onClick={() => onChange(step(query, -1))}>
              <ChevronLeft size={16} />
            </button>
            {query.period !== "year" && (
              <select
                aria-label={query.period === "month" ? "Month" : "Quarter"}
                className="field h-9 !w-auto !py-0 pr-8"
                value={query.index}
                onChange={(e) => onChange({ ...query, index: Number(e.target.value) })}
              >
                {(query.period === "month" ? MONTHS : ["Q1 (Jan–Mar)", "Q2 (Apr–Jun)", "Q3 (Jul–Sep)", "Q4 (Oct–Dec)"]).map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            )}
            <select aria-label="Year" className="field h-9 !w-auto !py-0 pr-8" value={query.year} onChange={(e) => onChange({ ...query, year: Number(e.target.value) })}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary h-9 w-9 !px-0"
              aria-label="Next period"
              disabled={nextDisabled}
              onClick={() => onChange(step(query, 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {showPropertyPicker && report && (
            <select
              aria-label="Property"
              className="field h-9 !w-auto max-w-[16rem] !py-0 pr-8"
              value={query.propertyId ?? ""}
              onChange={(e) => onChange({ ...query, propertyId: e.target.value ? Number(e.target.value) : undefined })}
            >
              <option value="">All properties</option>
              {report.availableProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {loading && <Loader2 size={16} className="animate-spin text-slate-400" aria-label="Updating report" />}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-secondary" disabled={!report || !!exporting} onClick={() => exportAs("excel")}>
            {exporting === "excel" ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Excel
          </button>
          <button type="button" className="btn btn-primary" disabled={!report || !!exporting} onClick={() => exportAs("pdf")}>
            {exporting === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            PDF
          </button>
        </div>
      </div>

      {error && !report && (
        <div className="card">
          <EmptyState icon={BarChart3} title="Couldn't load this report" message={error} />
        </div>
      )}

      {report && !group && (
        <div className="card">
          <EmptyState icon={BarChart3} title="No properties to report on" message="Add a property or import your data, and its reports appear here." />
        </div>
      )}

      {report && group && (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">{report.scope.name}</p>
              <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">{report.period.label}</h2>
              <p className="text-sm text-slate-500">
                Balances as of {formatDate(report.asOf)} · compared with {report.period.previousLabel}
              </p>
            </div>
            {report.groups.length > 1 && (
              <Segmented<string>
                ariaLabel="Currency"
                value={group.currency}
                onChange={setCurrency}
                options={report.groups.map((g) => ({ value: g.currency, label: g.currency, count: g.propertyCount }))}
              />
            )}
          </div>
          <GroupReport group={group} report={report} />
        </div>
      )}
    </div>
  );
}

function Delta({ now, before, kind, goodWhenUp, currency, label }: {
  now: number | null;
  before: number | null;
  kind: "money" | "points";
  goodWhenUp: boolean;
  currency: string;
  label: string;
}) {
  if (now === null || before === null) return <span className="text-slate-400">No comparison</span>;
  const d = now - before;
  if (Math.abs(d) < 0.005) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-500">
        <Minus size={12} /> Same as {label}
      </span>
    );
  }
  const good = d > 0 === goodWhenUp;
  const Icon = d > 0 ? ArrowUpRight : ArrowDownRight;
  const text = kind === "money" ? formatMoney(currency, Math.abs(d)) : `${Math.abs(d).toFixed(1)} pts`;
  return (
    <span className={`inline-flex items-center gap-1 ${good ? "text-[#248a3d]" : "text-[#d70015]"}`}>
      <Icon size={12} strokeWidth={2.25} />
      {text} vs {label}
    </span>
  );
}

function Tile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card p-4">
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      <p className="mt-2 truncate text-[22px] font-semibold leading-tight tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1.5 text-xs">{hint}</p>}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="text-[17px] font-semibold text-slate-900">{title}</h3>
        {note && <p className="mt-0.5 text-[13px] text-slate-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Table({ head, rows, empty, align }: { head: string[]; rows: ReactNode[][]; empty: string; align?: ("left" | "right")[] }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-slate-500">{empty}</p>;
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
            {head.map((h, i) => (
              <th key={h} className={`px-5 py-2 font-medium sm:px-6 ${align?.[i] === "right" ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className={`px-5 py-2.5 sm:px-6 ${align?.[j] === "right" ? "text-right tabular-nums" : ""} ${j === 0 ? "text-slate-900" : "text-slate-600"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShowMore({ total, shown, onToggle, expanded }: { total: number; shown: number; onToggle: () => void; expanded: boolean }) {
  if (total <= shown && !expanded) return null;
  return (
    <button type="button" className="mt-3 text-sm font-medium text-[#3f0ee3] hover:underline" onClick={onToggle}>
      {expanded ? "Show fewer" : `Show all ${total}`}
    </button>
  );
}

const LIMIT = 10;

function GroupReport({ group: g, report }: { group: CurrencyGroup; report: PortfolioReport }) {
  const [allTenants, setAllTenants] = useState(false);
  const [allRepairs, setAllRepairs] = useState(false);
  const c = g.currency;
  const prev = g.previous.label;
  const multi = report.scope.propertyId === null;
  const tenants = allTenants ? g.rent.rows : g.rent.rows.slice(0, LIMIT);
  const repairs = allRepairs ? g.repairs.items : g.repairs.items.slice(0, LIMIT);
  const movements = [
    ...g.occupancy.moveIns.map((m) => ({ ...m, change: "Moved in" as const })),
    ...g.occupancy.moveOuts.map((m) => ({ ...m, change: "Moved out" as const })),
    ...g.occupancy.notices.map((m) => ({ ...m, change: "Gave notice" as const })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Tile label="Rent collected" value={formatMoney(c, g.income.rentCollected)} hint={<Delta now={g.income.rentCollected} before={g.previous.income} kind="money" goodWhenUp currency={c} label={prev} />} />
        <Tile label="Expenses" value={formatMoney(c, g.income.totalExpenses)} hint={<Delta now={g.income.totalExpenses} before={g.previous.expenses} kind="money" goodWhenUp={false} currency={c} label={prev} />} />
        <Tile
          label="Net operating income"
          value={formatMoney(c, g.income.netOperatingIncome)}
          hint={<Delta now={g.income.netOperatingIncome} before={g.previous.netOperatingIncome} kind="money" goodWhenUp currency={c} label={prev} />}
        />
        <Tile label="Collection rate" value={pct(g.rent.collectionRate)} hint={<Delta now={g.rent.collectionRate} before={g.previous.collectionRate} kind="points" goodWhenUp currency={c} label={prev} />} />
        <Tile
          label="Occupancy"
          value={pct(g.occupancy.occupancyRate)}
          hint={<span className="text-slate-500">{g.occupancy.occupied} of {g.occupancy.units} units let</span>}
        />
        <Tile
          label="Rent in arrears"
          value={formatMoney(c, g.rent.arrears)}
          hint={<Delta now={g.rent.arrears} before={g.previous.arrears} kind="money" goodWhenUp={false} currency={c} label={prev} />}
        />
      </div>

      <Section title="Income & expenses" note="Rent is counted in the month it covers. Only approved expenses are included.">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <dl className="divide-y divide-slate-100 text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-slate-600">Rent collected</dt>
                <dd className="font-medium tabular-nums text-slate-900">{formatMoney(c, g.income.rentCollected)}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-600">Expenses</dt>
                <dd className="font-medium tabular-nums text-slate-900">− {formatMoney(c, g.income.totalExpenses)}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="font-semibold text-slate-900">Net operating income</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{formatMoney(c, g.income.netOperatingIncome)}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Margin</dt>
                <dd className="tabular-nums text-slate-600">{pct(g.income.margin)}</dd>
              </div>
            </dl>
            <p className="mb-3 mt-5 text-xs font-medium text-slate-500">Expenses by category</p>
            {g.income.expensesByCategory.length ? (
              <CategoryBars items={g.income.expensesByCategory} currency={c} />
            ) : (
              <p className="text-sm text-slate-500">No approved expenses in this period.</p>
            )}
            {(g.income.lateFeesCharged > 0 || g.income.pendingExpenses > 0) && (
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                {g.income.lateFeesCharged > 0 && <>Late fees charged on these payments: {formatMoney(c, g.income.lateFeesCharged)}. </>}
                {g.income.pendingExpenses > 0 && <>Expenses awaiting approval, not included: {formatMoney(c, g.income.pendingExpenses)}.</>}
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">
              {report.period.granularity === "month" ? "Last six months" : "By month"}
            </p>
            <TrendChart trend={g.trend} currency={c} />
          </div>
        </div>
      </Section>

      {multi && g.comparison.length > 1 && (
        <Section title="By property">
          <Table
            head={["Property", "Collected", "Expenses", "NOI", "Collection", "Occupancy", "Arrears"]}
            align={["left", "right", "right", "right", "right", "right", "right"]}
            empty=""
            rows={g.comparison.map((p) => [
              p.name,
              formatMoney(c, p.income),
              formatMoney(c, p.expenses),
              formatMoney(c, p.netOperatingIncome),
              pct(p.collectionRate),
              pct(p.occupancyRate),
              formatMoney(c, p.arrears),
            ])}
          />
        </Section>
      )}

      <Section
        title="Rent roll & arrears"
        note={`Expected ${formatMoney(c, g.rent.expected)}, collected ${formatMoney(c, g.rent.collected)}. Arrears are as of ${formatDate(report.asOf)} and include earlier months.`}
      >
        {g.rent.arrears > 0 ? (
          <div className="mb-6">
            <AgingBar aging={g.rent.aging} total={g.rent.arrears} currency={c} />
          </div>
        ) : (
          <p className="mb-5 text-sm text-[#248a3d]">No rent is overdue.</p>
        )}
        <Table
          head={[...(multi ? ["Property"] : []), "Tenant", "Unit", "Expected", "Collected", "Arrears", "Overdue"]}
          align={[...(multi ? (["left"] as const) : []), "left", "left", "right", "right", "right", "right"]}
          empty="No tenants owed rent in this period."
          rows={tenants.map((r) => [
            ...(multi ? [r.propertyName] : []),
            r.tenantName,
            r.unit,
            formatMoney(c, r.expected),
            formatMoney(c, r.collected),
            r.arrears > 0 ? <span className="font-medium text-[#d70015]">{formatMoney(c, r.arrears)}</span> : "—",
            r.daysOverdue > 0 ? `${r.daysOverdue} days` : "—",
          ])}
        />
        <ShowMore total={g.rent.rows.length} shown={LIMIT} expanded={allTenants} onToggle={() => setAllTenants((v) => !v)} />
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Occupancy & tenants">
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Mini label="Occupied" value={`${g.occupancy.occupied} / ${g.occupancy.units}`} />
            <Mini label="Average occupancy" value={pct(g.occupancy.averageOccupancyRate)} />
            <Mini label="Vacant units" value={String(g.occupancy.vacant)} />
          </div>
          {movements.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {movements.map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">{m.tenantName}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {multi ? `${m.propertyName} · ` : ""}Unit {m.unit} · {formatDate(m.date)}
                    </span>
                  </span>
                  <Badge tone={m.change === "Moved in" ? "emerald" : m.change === "Moved out" ? "slate" : "amber"}>{m.change}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No tenants moved in, moved out or gave notice.</p>
          )}
        </Section>

        <Section title="Security deposits">
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Held at period end" value={formatMoney(c, g.deposits.heldAtEnd)} note={`${g.deposits.tenanciesWithDeposit} tenancies`} />
            <Mini label="Collected this period" value={formatMoney(c, g.deposits.collected)} />
            <Mini label="Returned" value={formatMoney(c, g.deposits.settled)} note={`${g.deposits.settledCount} settled`} />
            <Mini label="Deducted for damage" value={formatMoney(c, g.deposits.deductions)} />
          </div>
        </Section>
      </div>

      <Section title="Repairs & maintenance" note="A repair counts as completed when it was last updated to Completed.">
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Mini label="Opened / completed" value={`${g.repairs.opened} / ${g.repairs.completed}`} note={`${g.repairs.openAtEnd} still open`} />
          <Mini label="Repair cost" value={formatMoney(c, g.repairs.managementCost)} note="Paid by management" />
          <Mini label="Chargeable to tenants" value={formatMoney(c, g.repairs.tenantChargeable)} />
          <Mini label="Average time to fix" value={g.repairs.averageDaysToComplete === null ? "—" : `${g.repairs.averageDaysToComplete.toFixed(1)} days`} />
        </div>
        <Table
          head={[...(multi ? ["Property"] : []), "Repair", "Unit", "Priority", "Status", "Cost"]}
          align={[...(multi ? (["left"] as const) : []), "left", "left", "left", "left", "right"]}
          empty="No repairs were opened or completed in this period."
          rows={repairs.map((r) => [
            ...(multi ? [r.propertyName] : []),
            r.title,
            r.unit ?? "—",
            <Badge tone={r.priority === "HIGH" ? "red" : r.priority === "MEDIUM" ? "amber" : "slate"}>{titleCase(r.priority)}</Badge>,
            titleCase(r.status),
            r.amount ? formatMoney(c, r.amount) : "—",
          ])}
        />
        <ShowMore total={g.repairs.items.length} shown={LIMIT} expanded={allRepairs} onToggle={() => setAllRepairs((v) => !v)} />
      </Section>
    </>
  );
}

function Mini({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[17px] font-semibold tabular-nums text-slate-900">{value}</p>
      {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
    </div>
  );
}
