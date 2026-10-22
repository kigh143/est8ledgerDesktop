import { createFileRoute, useRouter, useRouterState } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Calculator as CalculatorIcon, Loader2, MapPin, Tags } from "lucide-react";
import { Badge, DetailRow, EmptyState, PageHeader, Segmented } from "../../componennts/dashboard/ui";
import TaxpayerTypePrompt from "../../componennts/tax/TaxpayerTypePrompt";
import rentalTaxService, {
  parseTaxpayerType,
  rememberedTaxpayerType,
  rememberTaxpayerType,
  type MarketComparison,
  type PriceOutcome,
  type PricingResult,
} from "../../services/rentalTaxService";
import { useAppStore } from "../../store";
import type { TaxpayerType } from "../../types";
import { getNetworkError } from "../../utils";
import { formatMoney } from "../../utils/reportFormat";

type PricingSearch = { type?: TaxpayerType; rent?: number; target?: number; expenses?: number };

const amount = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && v !== "" && v != null ? n : undefined;
};

export const Route = createFileRoute("/dashboard/pricing")({
  validateSearch: (search: Record<string, unknown>): PricingSearch => ({
    type: parseTaxpayerType(search.type),
    rent: amount(search.rent),
    target: amount(search.target),
    expenses: amount(search.expenses),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) return { result: null, error: "Choose a property first." };
    const query = {
      propertyId: activeProperty.id,
      monthlyRent: deps.rent,
      targetMonthlyNet: deps.target,
      annualExpenses: deps.expenses,
    };
    try {
      // The landlord's tax config decides by default; a remembered choice only fills in when there's none.
      let result = await rentalTaxService.pricing({ ...query, taxpayerType: deps.type });
      const remembered = rememberedTaxpayerType();
      if (result.needsTaxpayerType && remembered)
        result = await rentalTaxService.pricing({ ...query, taxpayerType: remembered });
      return { result, error: null };
    } catch (e) {
      return { result: null, error: getNetworkError(e) };
    }
  },
  component: PricingInsightPage,
});

const digits = (s: string) => s.replace(/[^\d]/g, "");
const withCommas = (s: string) => (s ? Number(s).toLocaleString("en-US") : "");

function PricingInsightPage() {
  const { result, error } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const activeProperty = useAppStore((s) => s.activeProperty);
  const loading = useRouterState({ select: (s) => s.status === "pending" });

  const choose = (type: TaxpayerType) => {
    rememberTaxpayerType(type);
    navigate({ search: { ...search, type }, replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing insight"
        subtitle={`What similar homes rent for near ${activeProperty?.propertyName ?? "this property"}, and what you keep after tax`}
        actions={
          result?.taxpayerType && (
            <Segmented<TaxpayerType>
              ariaLabel="Taxpayer type"
              value={result.taxpayerType}
              onChange={choose}
              options={[
                { value: "INDIVIDUAL", label: "Solo landlord" },
                { value: "COMPANY", label: "Business" },
              ]}
            />
          )
        }
      />

      {error || !result ? (
        <div className="card">
          <EmptyState
            icon={Tags}
            title="Couldn't load pricing insight"
            message={error ?? undefined}
            action={<button onClick={() => router.invalidate()} className="btn btn-secondary">Try again</button>}
          />
        </div>
      ) : (
        <>
          <MarketCard market={result.market} currency={result.currency} yourRent={search.rent} />
          {result.needsTaxpayerType ? (
            <TaxpayerTypePrompt onChoose={choose} />
          ) : !result.rule ? (
            <div className="card">
              <EmptyState
                icon={CalculatorIcon}
                title={`No tax rules for ${result.country.name} yet`}
                message="Market rents above still apply. We'll show what you keep after tax once the rules are added."
              />
            </div>
          ) : (
            <PriceCalculator
              // Remount when the URL changes so the fields show what was calculated
              key={`${search.rent}-${search.target}-${search.expenses}`}
              result={result}
              search={search}
              loading={loading}
              onSubmit={(next) => navigate({ search: { ...search, ...next }, replace: true })}
            />
          )}
          <p className="text-xs text-slate-400">{result.disclaimer}</p>
        </>
      )}
    </div>
  );
}

function MarketCard({ market, currency, yourRent }: { market: MarketComparison; currency: string; yourRent?: number }) {
  const money = (n: number) => formatMoney(currency, n);
  const { stats } = market;
  const where = market.area ? `${market.area}${market.level === "district" ? " district" : ""}` : null;
  const kind = market.propertyType ? `${market.propertyType.toLowerCase()} listings` : "listings";

  if (!stats)
    return (
      <section className="card">
        <EmptyState
          icon={MapPin}
          title="No listings nearby to compare yet"
          message={where ? `There are no active ${kind} in ${where} right now.` : "Add a district or city to this property to compare rents."}
        />
      </section>
    );

  // Position along the min–max range; a single listing has no range to show.
  const span = stats.max - stats.min;
  const at = (n: number) => (span > 0 ? Math.min(100, Math.max(0, ((n - stats.min) / span) * 100)) : 50);

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Market rent</p>
          <p className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-slate-900">{money(stats.median)}</p>
          <p className="mt-1.5 text-[13px] text-slate-500">
            Typical monthly rent across {stats.count} active {kind}
            {where ? ` in ${where}` : ""}
          </p>
        </div>
        {!market.enoughData && <Badge tone="amber">Few listings, treat as a rough guide</Badge>}
      </div>

      <div className="mt-8 px-1" aria-hidden="true">
        <div className="relative h-2 rounded-full bg-[#2a78d6]/15">
          <span className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2a78d6]" style={{ left: `${at(stats.median)}%` }} />
          {yourRent != null && (
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#3f0ee3] shadow-[0_1px_4px_rgb(0_0_0/0.25)]"
              style={{ left: `${at(yourRent)}%` }}
            />
          )}
        </div>
        <div className="mt-2 flex justify-between text-xs tabular-nums text-slate-500">
          <span>{money(stats.min)}</span>
          <span>{money(stats.max)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-[#2a78d6]" /> Typical (median)</span>
        {yourRent != null && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#3f0ee3]" /> Your rent, {money(yourRent)}</span>}
        <span>Average {money(stats.average)}</span>
      </div>
    </section>
  );
}

function PriceCalculator({ result, search, loading, onSubmit }: {
  result: PricingResult;
  search: PricingSearch;
  loading: boolean;
  onSubmit: (next: Pick<PricingSearch, "rent" | "target" | "expenses">) => void;
}) {
  const money = (n: number) => formatMoney(result.currency, n);
  const [rent, setRent] = useState(search.rent != null ? String(search.rent) : "");
  const [target, setTarget] = useState(search.target != null ? String(search.target) : "");
  const [expenses, setExpenses] = useState(search.expenses != null ? String(search.expenses) : "");
  const median = result.market.stats?.median;
  const business = result.taxpayerType === "COMPANY";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      rent: rent ? Number(rent) : undefined,
      target: target ? Number(target) : undefined,
      expenses: expenses ? Number(expenses) : undefined,
    });
  };

  const field = (id: string, label: string, value: string, set: (v: string) => void, placeholder: string, hint?: string) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{result.currency}</span>
        <input id={id} inputMode="numeric" className="field pl-14 tabular-nums" value={withCommas(value)} onChange={(e) => set(digits(e.target.value))} placeholder={placeholder} />
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={submit} className="card space-y-5 p-6">
        <div>
          <p className="eyebrow">Try a price</p>
          <p className="mt-1 text-[13px] text-slate-500">Fill in either or both.</p>
        </div>
        <div>
          {field("rent", "Monthly rent to check", rent, setRent, median ? withCommas(String(median)) : "e.g. 800,000")}
          {median != null && rent !== String(median) && (
            <button type="button" onClick={() => setRent(String(median))} className="mt-1.5 text-xs font-medium text-[#3f0ee3] hover:underline">
              Use the market rent, {money(median)}
            </button>
          )}
        </div>
        {field("target", "Take-home you want each month", target, setTarget, "e.g. 700,000", "After tax and this unit's running costs")}
        {field(
          "expenses",
          "Running costs for this unit, per year",
          expenses,
          setExpenses,
          withCommas(String(result.context.annualExpenses)) || "0",
          business
            ? "Leave blank to use this property's paid expenses over the last 12 months, split per unit"
            : "Solo landlords can't deduct these from tax, but they still come out of what you keep",
        )}
        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Calculate
        </button>
      </form>

      <div className="space-y-6">
        {!result.atPrice && !result.forTargetNet && (
          <div className="card">
            <EmptyState icon={CalculatorIcon} title="See what you'd keep" message="Enter a monthly rent, a take-home target, or both." />
          </div>
        )}

        {result.forTargetNet && search.target != null && (
          <section className="card p-6">
            <p className="eyebrow">To take home {money(search.target)} a month</p>
            <p className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-slate-900">
              Charge at least {money(result.forTargetNet.monthlyRent)}
            </p>
            {median != null && <MedianBadge rent={result.forTargetNet.monthlyRent} median={median} />}
            <Outcome outcome={result.forTargetNet} money={money} annualExpenses={result.context.annualExpenses} />
          </section>
        )}

        {result.atPrice && (
          <section className="card p-6">
            <p className="eyebrow">At {money(result.atPrice.monthlyRent)} a month</p>
            <p className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-slate-900">
              You keep {money(result.atPrice.monthlyNetIncome)} a month
            </p>
            {median != null && <MedianBadge rent={result.atPrice.monthlyRent} median={median} />}
            <Outcome outcome={result.atPrice} money={money} annualExpenses={result.context.annualExpenses} />
          </section>
        )}

        {(result.atPrice || result.forTargetNet) && (
          <p className="text-xs leading-relaxed text-slate-500">
            {result.context.otherAnnualRent > 0
              ? `This rent is counted on top of the ${money(result.context.otherAnnualRent)} you expect from your ${result.country.name} properties this tax year, so it's taxed at the rate that rent leaves you on.`
              : `This is your only expected rent in ${result.country.name} this tax year, so the tax-free amount applies to it in full.`}
          </p>
        )}
      </div>
    </div>
  );
}

function MedianBadge({ rent, median }: { rent: number; median: number }) {
  const diff = ((rent - median) / median) * 100;
  if (Math.abs(diff) < 2) return <div className="mt-2"><Badge tone="emerald">In line with the market</Badge></div>;
  return (
    <div className="mt-2">
      <Badge tone={diff > 15 ? "amber" : "blue"}>
        {Math.abs(Math.round(diff))}% {diff > 0 ? "above" : "below"} market rent
      </Badge>
    </div>
  );
}

function Outcome({ outcome, money, annualExpenses }: { outcome: PriceOutcome; money: (n: number) => string; annualExpenses: number }) {
  return (
    <div className="mt-4 divide-y divide-black/[0.06]">
      <DetailRow label="Rent per year">{money(outcome.annualRent)}</DetailRow>
      <DetailRow label="Tax per year">
        − {money(outcome.annualTax)}
        <span className="block text-xs font-normal text-slate-500">{Number(outcome.effectiveRatePercent.toFixed(1))}% of the rent</span>
      </DetailRow>
      {annualExpenses > 0 && <DetailRow label="Running costs per year">− {money(annualExpenses)}</DetailRow>}
      <DetailRow label="You keep per year">
        <span className="text-[15px] font-semibold">{money(outcome.annualNetIncome)}</span>
      </DetailRow>
    </div>
  );
}
