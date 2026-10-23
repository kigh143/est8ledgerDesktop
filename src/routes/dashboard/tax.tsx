import { createFileRoute, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Building2, ChevronLeft, ChevronRight, CircleDollarSign, ExternalLink, Landmark, PiggyBank, ReceiptText, Tags, TrendingUp } from "lucide-react";
import { DetailRow, EmptyState, LoadingState, PageHeader, Segmented, StatCard } from "../../componennts/dashboard/ui";
import TaxpayerTypePrompt from "../../componennts/tax/TaxpayerTypePrompt";
import rentalTaxService, {
  parseTaxpayerType,
  rememberedTaxpayerType,
  rememberTaxpayerType,
  type TaxEstimateGroup,
} from "../../services/rentalTaxService";
import { useAppStore } from "../../store";
import type { TaxpayerType } from "../../types";
import { getNetworkError } from "../../utils";
import { formatMoney } from "../../utils/reportFormat";

type TaxSearch = { type?: TaxpayerType; taxYear?: number };

export const Route = createFileRoute("/dashboard/tax")({
  validateSearch: (search: Record<string, unknown>): TaxSearch => ({
    type: parseTaxpayerType(search.type),
    taxYear: Number(search.taxYear) || undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      // The landlord's tax config decides by default; a remembered choice only fills in when there's none.
      let estimate = await rentalTaxService.estimate({ taxpayerType: deps.type, taxYear: deps.taxYear });
      const remembered = rememberedTaxpayerType();
      if (estimate.needsTaxpayerType && remembered)
        estimate = await rentalTaxService.estimate({ taxpayerType: remembered, taxYear: deps.taxYear });
      return { estimate, error: null };
    } catch (e) {
      return { estimate: null, error: getNetworkError(e) };
    }
  },
  component: PropertyTaxPage,
});

const percent = (n: number) => `${Number(n.toFixed(2))}%`;

/** A property's part of the landlord's tax: tax is charged on all their rent together, so split it by rent. */
const shareOf = (tax: number, part: number, whole: number) => (whole > 0 ? Math.round((tax * part) / whole) : 0);

function PropertyTaxPage() {
  const { estimate, error } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const activeProperty = useAppStore((s) => s.activeProperty);
  const loading = useRouterState({ select: (s) => s.status === "pending" });

  const choose = (type: TaxpayerType) => {
    rememberTaxpayerType(type);
    navigate({ search: { ...search, type }, replace: true });
  };

  const group = estimate?.groups.find((g) => g.properties.some((p) => p.id === activeProperty?.id));
  const header = (
    <PageHeader
      title="Tax"
      subtitle={`Estimated rental income tax for ${activeProperty?.propertyName ?? "this property"}`}
      actions={
        estimate?.taxpayerType && (
          <Segmented<TaxpayerType>
            ariaLabel="Taxpayer type"
            value={estimate.taxpayerType}
            onChange={choose}
            options={[
              { value: "INDIVIDUAL", label: "Solo landlord" },
              { value: "COMPANY", label: "Business" },
            ]}
          />
        )
      }
    />
  );

  if (error || !estimate)
    return (
      <div className="space-y-6">
        {header}
        <div className="card">
          <EmptyState
            icon={ReceiptText}
            title="Couldn't load your tax estimate"
            message={error ?? undefined}
            action={<button onClick={() => router.invalidate()} className="btn btn-secondary">Try again</button>}
          />
        </div>
      </div>
    );

  if (estimate.needsTaxpayerType)
    return (
      <div className="space-y-6">
        {header}
        <TaxpayerTypePrompt onChoose={choose} />
      </div>
    );

  return (
    <div className="space-y-6">
      {header}
      {loading ? (
        <LoadingState label="Working out your tax" />
      ) : !group ? (
        <div className="card">
          <EmptyState icon={ReceiptText} title="No rent recorded for this property" message="Add tenants and record rent to see an estimate." />
        </div>
      ) : (
        <TaxDetails group={group} propertyId={activeProperty!.id} disclaimer={estimate.disclaimer} onYear={(taxYear) => navigate({ search: { ...search, taxYear }, replace: true })} />
      )}
    </div>
  );
}

function TaxDetails({ group, propertyId, disclaimer, onYear }: {
  group: TaxEstimateGroup;
  propertyId: number;
  disclaimer: string;
  onYear: (startYear: number) => void;
}) {
  const property = group.properties.find((p) => p.id === propertyId)!;
  const money = (n: number) => formatMoney(group.currency, n);
  const { rule, projectedTax, taxSoFar, income } = group;
  const others = group.properties.length - 1;

  const yearPicker = (
    <div className="flex items-center gap-1">
      <button onClick={() => onYear(group.taxYear.startYear - 1)} className="btn btn-secondary !px-2" aria-label="Previous tax year">
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[10rem] text-center text-[15px] font-semibold tabular-nums text-slate-900">{group.taxYear.label}</span>
      <button onClick={() => onYear(group.taxYear.startYear + 1)} className="btn btn-secondary !px-2" aria-label="Next tax year">
        <ChevronRight size={16} />
      </button>
    </div>
  );

  if (!rule || !projectedTax || !taxSoFar)
    return (
      <>
        {yearPicker}
        <div className="card">
          <EmptyState
            icon={Landmark}
            title={`No tax rules for ${group.country.name} yet`}
            message={`This property is expected to bring in ${money(property.projectedAnnual)} in ${group.taxYear.label}. We'll estimate the tax once ${group.country.name}'s rules are added.`}
          />
        </div>
      </>
    );

  const projectedShare = shareOf(projectedTax.tax, property.projectedAnnual, income.projectedAnnual);
  const soFarShare = shareOf(taxSoFar.tax, property.collectedToDate, income.collectedToDate);
  const solo = rule.taxpayerType === "INDIVIDUAL";

  return (
    <>
      {yearPicker}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CircleDollarSign} tone="blue" label="Rent collected so far" value={money(property.collectedToDate)} hint={`Confirmed rent for ${group.taxYear.label}`} />
        <StatCard icon={TrendingUp} tone="violet" label="Projected rent this year" value={money(property.projectedAnnual)} hint="Collected plus rent still due from current tenants" />
        <StatCard icon={ReceiptText} tone="orange" label="Estimated tax for this property" value={money(projectedShare)} hint={`${money(soFarShare)} on rent collected so far`} />
        <StatCard icon={PiggyBank} tone="emerald" label="Set aside each month" value={money(Math.round(projectedShare / 12))} hint="Spreads this property's tax over the year" />
      </div>

      <FullOccupancy group={group} propertyId={propertyId} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-6">
          <p className="eyebrow">How it's worked out</p>
          <h2 className="mt-1 text-[17px] font-semibold text-slate-900">
            Your {group.country.name} rent for {group.taxYear.label}
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            URA taxes all your rent together
            {others > 0 ? `, so this includes your ${others} other ${others === 1 ? "property" : "properties"} in ${group.country.name}` : ""}.
            This property's share is in proportion to its rent.
          </p>

          <div className="mt-4 divide-y divide-black/[0.06]">
            <DetailRow label="Projected rent, all properties">{money(projectedTax.grossIncome)}</DetailRow>
            {solo ? (
              <DetailRow label="Tax-free amount">− {money(projectedTax.taxFreeThreshold)}</DetailRow>
            ) : (
              <DetailRow label={`Expenses deducted${rule.maxExpenseDeductionPercent != null ? ` (max ${percent(rule.maxExpenseDeductionPercent)} of rent)` : ""}`}>
                − {money(projectedTax.expenseDeduction)}
                {projectedTax.expensesClaimed > projectedTax.expenseDeduction && (
                  <span className="block text-xs font-normal text-slate-500">of {money(projectedTax.expensesClaimed)} paid</span>
                )}
              </DetailRow>
            )}
            <DetailRow label="Taxable rent">{money(projectedTax.chargeableIncome)}</DetailRow>
            <DetailRow label={`Tax at ${percent(rule.ratePercent)}`}>
              <span className="text-[15px] font-semibold">{money(projectedTax.tax)}</span>
            </DetailRow>
            <DetailRow label="Share for this property">
              {money(projectedShare)}
              <span className="block text-xs font-normal text-slate-500">
                {income.projectedAnnual > 0 ? percent((property.projectedAnnual / income.projectedAnnual) * 100) : "0%"} of your rent
              </span>
            </DetailRow>
          </div>

          {!solo && (
            <p className="mt-4 text-xs text-slate-500">
              Only paid expenses recorded so far ({money(group.paidExpensesToDate)}) are deducted. Record expenses as you pay them to keep this accurate.
            </p>
          )}
        </section>

        <section className="card p-6">
          <p className="eyebrow">{solo ? "Solo landlord" : "Business"} rules</p>
          <div className="mt-3 divide-y divide-black/[0.06]">
            <DetailRow label="Tax rate">{percent(rule.ratePercent)}</DetailRow>
            <DetailRow label="Tax-free each year">{rule.taxFreeThreshold > 0 ? money(rule.taxFreeThreshold) : "None"}</DetailRow>
            <DetailRow label="Expenses">
              {rule.expensesDeductible
                ? rule.maxExpenseDeductionPercent != null
                  ? `Deductible, up to ${percent(rule.maxExpenseDeductionPercent)} of rent`
                  : "Deductible"
                : "Not deductible"}
            </DetailRow>
            <DetailRow label="Tax year">{group.taxYear.label}</DetailRow>
          </div>
          {rule.filingNotes && <p className="mt-4 text-[13px] leading-relaxed text-slate-600">{rule.filingNotes}</p>}
          {rule.sourceUrl && (
            <a href={rule.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3f0ee3] hover:underline">
              URA guidance <ExternalLink size={13} />
            </a>
          )}
          <div className="mt-5 rounded-xl bg-slate-100/70 p-4">
            <p className="text-[13px] text-slate-600">
              Thinking about rent for a new tenant?{" "}
              <Link to="/dashboard/pricing" className="font-medium text-[#3f0ee3] hover:underline">
                See pricing insight
              </Link>
            </p>
          </div>
        </section>
      </div>

      <p className="text-xs text-slate-400">{disclaimer}</p>
    </>
  );
}

/** Tax if every priced unit were let for the whole year, from the unit prices on the property. */
function FullOccupancy({ group, propertyId }: { group: TaxEstimateGroup; propertyId: number }) {
  const property = group.properties.find((p) => p.id === propertyId)!;
  const money = (n: number) => formatMoney(group.currency, n);
  const full = group.fullOccupancy;
  const editLink = (label: string) => (
    <Link to="/properties/$propertyId/edit" params={{ propertyId: String(propertyId) }} className="btn btn-tinted">
      <Tags size={16} />
      {label}
    </Link>
  );

  if (property.fullOccupancyAnnual == null || !full?.tax)
    return (
      <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">If fully let all year</p>
          <p className="mt-1 text-[15px] text-slate-700">
            Add what each unit lets for to see the tax if every unit is let for the whole year.
          </p>
        </div>
        {editLink("Add unit prices")}
      </section>
    );

  const share = shareOf(full.tax.tax, property.fullOccupancyAnnual, full.annualRent);
  const vacancyGap = property.fullOccupancyAnnual - property.projectedAnnual;
  const totalUnits = property.totalUnits ?? property.pricedUnits;

  return (
    <section className="card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">If fully let all year</p>
          <h2 className="mt-1 text-[17px] font-semibold text-slate-900">
            Every priced unit let for the whole of {group.taxYear.label}
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            From your unit prices: {property.pricedUnits} of {totalUnits} units priced
            {property.pricedUnits < totalUnits ? "; unpriced units aren't counted" : ""}.
          </p>
        </div>
        {editLink("Edit unit prices")}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} tone="violet" label="Full-year rent" value={money(property.fullOccupancyAnnual)} hint={`${money(Math.round(property.fullOccupancyAnnual / 12))} a month`} />
        <StatCard
          icon={TrendingUp}
          tone={vacancyGap > 0 ? "amber" : "emerald"}
          label="Compared with projected"
          value={vacancyGap > 0 ? `− ${money(vacancyGap)}` : money(0)}
          hint={vacancyGap > 0 ? "Rent lost to empty units this year" : "On track for full occupancy"}
        />
        <StatCard icon={ReceiptText} tone="orange" label="Estimated tax for this property" value={money(share)} hint={`${money(full.tax.tax)} across all your ${group.country.name} rent`} />
        <StatCard icon={PiggyBank} tone="emerald" label="Set aside each month" value={money(Math.round(share / 12))} hint="If fully let" />
      </div>

      {full.unpricedProperties > 0 && (
        <p className="mt-4 text-xs text-slate-500">
          Your {full.unpricedProperties} other {full.unpricedProperties === 1 ? "property" : "properties"} in {group.country.name} without unit prices
          {full.unpricedProperties === 1 ? " is" : " are"} counted at current rent.
        </p>
      )}
    </section>
  );
}
