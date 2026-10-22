import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Plus, Search, UsersRound, X } from "lucide-react";
import tenancyService from "../../../services/tenancyService";
import { useAppStore } from "../../../store";
import { Badge, EmptyState, PageHeader, Segmented, type Tone } from "../../../componennts/dashboard/ui";
import { getDepositStage } from "../../../utils/depositStatus";
import type { SecurityDepositRecord, TenancyAgreement } from "../../../types";

export const Route = createFileRoute("/dashboard/tenants/")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) return { tenancies: [] as TenancyAgreement[] };
    const response = await tenancyService.getPropertyTenancies(String(activeProperty.id));
    const tenancies = (Array.isArray(response) ? response : response?.data ?? []) as TenancyAgreement[];
    return { tenancies };
  },
  pendingComponent: TenantsSkeleton,
  component: TenantsPage,
});

type Filter = "current" | "attention" | "behind" | "ending" | "past";

type Row = {
  tenancy: TenancyAgreement;
  name: string;
  balance: number;
  rent: number;
  status: { label: string; tone: Tone };
  steps: [boolean, boolean, boolean];
  ending: boolean;
  past: boolean;
};

const toRow = (tenancy: TenancyAgreement): Row => {
  const name = `${tenancy.tenant?.firstName ?? ""} ${tenancy.tenant?.lastName ?? ""}`.trim() || "Unnamed tenant";
  const signed = !!tenancy.tenantSignedAt;
  const inspected = !!tenancy.inspections?.some(
    (i: { type?: string; tenantApprovedAt?: string | null }) => i.type !== "MOVE_OUT" && !!i.tenantApprovedAt
  );
  // A rejected deposit doesn't count; the tenant still has to pay (mirrors the mobile app).
  const depositPaid =
    !!tenancy.securityDepositPaidAt ||
    !!tenancy.securityDeposits?.some((d: SecurityDepositRecord) => getDepositStage(d) !== "REJECTED");
  const past = !!tenancy.terminatedAt;
  const ending =
    !past && !!(tenancy.mgtRequestedAt || tenancy.tenantRequestedAt || tenancy.terminationApprovedByTenantAt);

  const status: Row["status"] = past
    ? { label: "Moved out", tone: "slate" }
    : ending
    ? { label: "Moving out", tone: "orange" }
    : !signed
    ? { label: "Awaiting signature", tone: "amber" }
    : !inspected
    ? { label: "Inspection pending", tone: "blue" }
    : !depositPaid
    ? { label: "Deposit pending", tone: "amber" }
    : { label: "Active", tone: "emerald" };

  return {
    tenancy,
    name,
    balance: Number(tenancy.outstanding_rent_balance ?? 0) || parseFloat(tenancy.outstandingBalance || "0") || 0,
    rent: Number(tenancy.rentAmount) || 0,
    status,
    steps: [signed, inspected, depositPaid],
    ending,
    past,
  };
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "T";

function TenantsPage() {
  const { tenancies } = Route.useLoaderData();
  const activeProperty = useAppStore((s) => s.activeProperty);
  const currency = activeProperty?.currency || "UGX";
  const money = (n: number) => `${currency} ${new Intl.NumberFormat("en-US").format(Math.round(n))}`;
  const [filter, setFilter] = useState<Filter>("current");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => tenancies.map(toRow).sort((a, b) => a.name.localeCompare(b.name)), [tenancies]);
  const current = rows.filter((r) => !r.past);
  const groups: Record<Filter, Row[]> = {
    current,
    attention: current.filter((r) => !r.ending && r.status.label !== "Active"),
    behind: current.filter((r) => r.balance > 0),
    ending: current.filter((r) => r.ending),
    past: rows.filter((r) => r.past),
  };

  const q = query.trim().toLowerCase();
  const visible = groups[filter].filter(
    (r) =>
      !q ||
      [r.name, r.tenancy.tenant?.email, r.tenancy.tenant?.phoneNumber, r.tenancy.unitName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
  );

  const units = activeProperty?.numberOfUnits ?? 0;
  const rentRoll = current.reduce((sum, r) => sum + r.rent, 0);
  const outstanding = current.reduce((sum, r) => sum + r.balance, 0);
  const occupancy = units > 0 ? Math.min(100, Math.round((current.length / units) * 100)) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        subtitle={units > 0 ? `${current.length} of ${units} units let` : `${current.length} current tenants`}
        actions={
          <Link to="/dashboard/tenants/add" className="btn btn-primary">
            <Plus size={17} strokeWidth={2.25} />
            Add tenant
          </Link>
        }
      />

      {rows.length > 0 && (
        <div className="card grid grid-cols-1 divide-y divide-black/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Summary label="Monthly rent roll" value={money(rentRoll)} hint={`${current.length} active ${current.length === 1 ? "tenancy" : "tenancies"}`} />
          <Summary
            label="Outstanding"
            value={outstanding > 0 ? money(outstanding) : "All paid up"}
            valueClass={outstanding > 0 ? "text-[#d70015]" : "text-[#248a3d]"}
            hint={
              groups.behind.length > 0 ? (
                <button onClick={() => setFilter("behind")} className="font-medium text-[#3f0ee3] hover:underline">
                  {groups.behind.length} behind on rent
                </button>
              ) : (
                "No one is behind"
              )
            }
          />
          <Summary
            label="Occupancy"
            value={units > 0 ? `${occupancy}%` : "—"}
            hint={
              units > 0 ? (
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-[#3f0ee3]" style={{ width: `${occupancy}%` }} />
                </span>
              ) : (
                "Set the unit count on the property"
              )
            }
          />
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <Segmented
              ariaLabel="Filter tenants"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "current", label: "Current", count: groups.current.length },
                { value: "attention", label: "Setting up", count: groups.attention.length },
                { value: "behind", label: "Behind", count: groups.behind.length },
                { value: "ending", label: "Moving out", count: groups.ending.length },
                { value: "past", label: "Past", count: groups.past.length },
              ]}
            />
          </div>
          <div className="relative w-full lg:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, unit, phone"
              aria-label="Search tenants"
              className="field py-2 pl-9 pr-9 text-sm [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No tenants yet"
            message="Add a tenant to send them the agreement, record their deposit and start tracking rent."
            action={
              <Link to="/dashboard/tenants/add" className="btn btn-primary">
                <Plus size={17} strokeWidth={2.25} />
                Add your first tenant
              </Link>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={q ? Search : UsersRound}
            title={q ? "No matches" : "No one here"}
            message={q ? `No tenants match “${query.trim()}”.` : emptyCopy[filter]}
            action={
              q ? (
                <button onClick={() => setQuery("")} className="btn btn-secondary">
                  Clear search
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_16px] gap-4 border-b border-black/[0.06] px-6 py-2.5 text-xs font-medium text-slate-500 md:grid">
              <span>Tenant</span>
              <span>Status</span>
              <span className="text-right">Rent</span>
              <span className="text-right">Balance</span>
              <span />
            </div>
            <ul className="divide-y divide-black/[0.06]">
              {visible.map((row) => (
                <TenantRow key={row.tenancy.id} row={row} money={money} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

const emptyCopy: Record<Filter, string> = {
  current: "Everyone here has moved out.",
  attention: "Every tenant has signed, been inspected and paid their deposit.",
  behind: "No one owes rent right now.",
  ending: "No tenancies are ending.",
  past: "Tenants who move out are kept here for your records.",
};

function Summary({
  label,
  value,
  hint,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0 px-6 py-5">
      <p className="text-[13px] text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-[22px] font-semibold tracking-tight tabular-nums ${valueClass}`}>{value}</p>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function TenantRow({ row, money }: { row: Row; money: (n: number) => string }) {
  const { tenancy, name, status, steps, balance, rent, past } = row;
  const stepsDone = steps.filter(Boolean).length;

  return (
    <li>
      <Link
        to="/dashboard/tenants/$tenantId"
        params={{ tenantId: tenancy.id.toString() }}
        className="group grid grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-4 px-5 py-3.5 hover:bg-slate-50 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_16px]"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
              past ? "bg-slate-100 text-slate-500" : "bg-[#3f0ee3]/[0.08] text-[#3f0ee3]"
            }`}
            aria-hidden="true"
          >
            {initialsOf(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-slate-900 capitalize">{name}</p>
            <p className="truncate text-[13px] text-slate-500">
              {tenancy.unitName ? `Unit ${tenancy.unitName}` : "No unit"}
              {tenancy.tenant?.phoneNumber && ` · ${tenancy.tenant.phoneNumber}`}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 md:block">
          <Badge tone={status.tone}>{status.label}</Badge>
          {!past && !row.ending && stepsDone < 3 && (
            <div className="mt-1.5 flex items-center gap-1" aria-label={`${stepsDone} of 3 setup steps done`}>
              {steps.map((done, i) => (
                <span key={i} className={`h-1 w-5 rounded-full ${done ? "bg-[#34c759]" : "bg-slate-200"}`} />
              ))}
            </div>
          )}
        </div>

        <p className="hidden text-right text-sm text-slate-900 tabular-nums md:block">
          {money(rent)}
          <span className="block text-xs text-slate-500">per month</span>
        </p>

        <div className="text-right">
          {balance > 0 ? (
            <p className="text-sm font-semibold text-[#d70015] tabular-nums">{money(balance)}</p>
          ) : (
            <p className="text-sm text-slate-500">{past ? "—" : "Paid up"}</p>
          )}
          <span className="md:hidden">
            <Badge tone={status.tone}>{status.label}</Badge>
          </span>
        </div>

        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
      </Link>
    </li>
  );
}

function TenantsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading tenants">
      <div className="mt-2 h-10 w-48 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="card h-[104px] animate-pulse" />
      <div className="card divide-y divide-black/[0.06]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 px-6 py-4">
            <span className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <span className="block h-3.5 w-40 animate-pulse rounded bg-slate-100" />
              <span className="block h-3 w-24 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
