import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Vault,
  Wallet,
  CheckCircle2,
  Clock,
  ChevronRight,
  Check,
  X,
  Minus,
  Copy,
  Plus,
  Trash2,
  AlertCircle,
  Landmark,
} from "lucide-react";
import { toast } from "react-toastify";
import { securityDepositService } from "../../services/securityDepositService";
import { tenancyService } from "../../services/tenancyService";
import { useAppStore } from "../../store";
import {
  PageHeader,
  StatCard,
  EmptyState,
  Badge,
  Segmented,
  DetailRow,
  ConfirmDialog,
  type Tone,
} from "../../componennts/dashboard/ui";
import SlideOver from "../../componennts/SlideOver";
import type { SecurityDepositRecord } from "../../types";
import { getNetworkError } from "../../utils";
import {
  canReleaseDeposit,
  getDepositStage,
  getPaidIntoAccount,
  getReleaseState,
  isLandlordHeld,
  type DepositStage,
} from "../../utils/depositStatus";

type TenancyLike = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/securitydeposits")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) {
      return { deposits: [] as SecurityDepositRecord[], tenancies: {} as Record<string, TenancyLike> };
    }

    const propertyId = activeProperty.id.toString();

    const [depositsResponse, tenanciesResponse] = await Promise.all([
      securityDepositService.getPropertyDeposits(propertyId),
      tenancyService.getPropertyTenancies(propertyId).catch(() => []),
    ]);

    const rawDeposits = depositsResponse as unknown as SecurityDepositRecord[];

    const tenancyList: any[] = Array.isArray(tenanciesResponse)
      ? tenanciesResponse
      : tenanciesResponse.data || [];
    const tenancies: Record<string, TenancyLike> = Object.fromEntries(
      tenancyList.map((t) => [t.id.toString(), t])
    );

    // The deposits endpoint doesn't always include the nested tenant/unit info,
    // so cross-reference the property's tenancies to fill it in.
    const deposits: SecurityDepositRecord[] = rawDeposits.map((d: any) => {
      const tenancy: any = tenancies[d.tenancyId?.toString()];
      return {
        ...d,
        currency: d.currency || activeProperty.currency || "UGX",
        tenancy:
          d.tenancy ||
          (tenancy ? { id: tenancy.id, tenant: tenancy.tenant, unitName: tenancy.unitName } : undefined),
      };
    });

    return { deposits, tenancies };
  },
  component: SecurityDepositsPage,
});

const money = (amount: number | string | null | undefined, currency: string) =>
  `${currency} ${new Intl.NumberFormat("en-US").format(Math.round(Number(amount) || 0))}`;

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

const tenantName = (d: SecurityDepositRecord) => {
  const t = d.tenancy?.tenant;
  const name = `${t?.firstName ?? ""} ${t?.lastName ?? ""}`.trim();
  return name || t?.email || "Tenant";
};

const stageMeta: Record<DepositStage, { label: string; tone: Tone }> = {
  AWAITING_LANDLORD: { label: "Needs your confirmation", tone: "amber" },
  AWAITING_EST8LEDGER: { label: "With est8Ledger", tone: "blue" },
  COMPLETED: { label: "Approved", tone: "emerald" },
  REJECTED: { label: "Rejected", tone: "red" },
};

type Filter = "all" | "action" | "approved" | "rejected";

function SecurityDepositsPage() {
  const { deposits, tenancies } = Route.useLoaderData();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseKey, setReleaseKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const selected = deposits.find((d: SecurityDepositRecord) => d.id === selectedId) ?? null;
  const currency = deposits[0]?.currency || "UGX";

  const counts = useMemo(() => {
    const byStage = (stage: DepositStage) => deposits.filter((d) => getDepositStage(d) === stage);
    const approved = byStage("COMPLETED");
    return {
      action: byStage("AWAITING_LANDLORD").length,
      withEst8ledger: byStage("AWAITING_EST8LEDGER").length,
      approved: approved.length,
      rejected: byStage("REJECTED").length,
      heldAmount: approved.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    };
  }, [deposits]);

  const visible = deposits.filter((d: SecurityDepositRecord) => {
    const stage = getDepositStage(d);
    if (filter === "action") return stage === "AWAITING_LANDLORD";
    if (filter === "approved") return stage === "COMPLETED";
    if (filter === "rejected") return stage === "REJECTED";
    return true;
  });

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await router.invalidate();
      return true;
    } catch (error) {
      toast.error(getNetworkError(error));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    if (await run(() => securityDepositService.mgtApproveDeposit(selected.id), "Receipt confirmed")) {
      setConfirming(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selected) return;
    if (await run(() => securityDepositService.rejectDeposit(selected.id, reason), "Payment rejected")) {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security deposits"
        subtitle="Confirm deposits paid to you and return them when a tenancy ends."
        actions={
          <Link to="/dashboard/deposit-collection" className="btn btn-secondary">
            <Landmark size={16} />
            Collection settings
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} tone="violet" label="Approved deposits held" value={money(counts.heldAmount, currency)} />
        <StatCard
          icon={Clock}
          tone="amber"
          label="Need your confirmation"
          value={counts.action}
          hint={counts.action > 0 ? "Check the money arrived, then confirm" : "You're all caught up"}
        />
        <StatCard icon={Vault} tone="blue" label="With est8Ledger" value={counts.withEst8ledger} hint="Awaiting final approval" />
        <StatCard icon={CheckCircle2} tone="emerald" label="Approved" value={counts.approved} />
      </div>

      <section className="space-y-4">
        <div className="overflow-x-auto -mx-1 px-1">
          <Segmented<Filter>
            ariaLabel="Filter deposits"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: deposits.length },
              { value: "action", label: "Needs action", count: counts.action },
              { value: "approved", label: "Approved", count: counts.approved },
              { value: "rejected", label: "Rejected", count: counts.rejected },
            ]}
          />
        </div>

        <div className="card overflow-hidden">
          {visible.length === 0 ? (
            <EmptyState
              icon={Vault}
              title={deposits.length === 0 ? "No security deposits yet" : "Nothing here"}
              message={
                deposits.length === 0
                  ? "When a tenant pays their deposit it appears here for you to confirm."
                  : "No deposits match this filter."
              }
              action={
                deposits.length === 0 ? (
                  <Link to="/dashboard/deposit-collection" className="btn btn-tinted">
                    Set up deposit collection
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {visible.map((deposit: SecurityDepositRecord) => {
                const stage = getDepositStage(deposit);
                const meta = stageMeta[stage];
                const release = getReleaseState(deposit);
                return (
                  <li key={deposit.id}>
                    <button
                      onClick={() => setSelectedId(deposit.id)}
                      className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                        {tenantName(deposit)[0]?.toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-slate-900 capitalize">
                          {tenantName(deposit)}
                        </span>
                        <span className="block truncate text-[13px] text-slate-500">
                          {deposit.tenancy?.unitName ? `Unit ${deposit.tenancy.unitName} · ` : ""}
                          {isLandlordHeld(deposit) ? "Paid to you" : "Held by est8Ledger"}
                          {deposit.createdAt ? ` · ${formatDate(deposit.createdAt)}` : ""}
                        </span>
                      </span>
                      <span className="hidden sm:block">
                        {release !== "HELD" ? (
                          <Badge tone={release === "DISPUTED" ? "red" : release === "RECEIVED" ? "slate" : "amber"}>
                            {release === "DISPUTED" ? "Refund disputed" : release === "RECEIVED" ? "Refunded" : "Refund sent"}
                          </Badge>
                        ) : (
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        )}
                      </span>
                      <span className="w-28 shrink-0 text-right text-[15px] font-semibold text-slate-900 tabular-nums">
                        {money(deposit.amount, deposit.currency)}
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-slate-300 group-hover:text-slate-500" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <SlideOver
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title="Deposit"
        subtitle={selected ? `${tenantName(selected)}${selected.tenancy?.unitName ? ` · Unit ${selected.tenancy.unitName}` : ""}` : undefined}
        widthClass="max-w-lg"
        footer={
          selected && (
            <DepositActions
              deposit={selected}
              canRelease={canReleaseDeposit(selected, tenancies[selected.tenancyId?.toString()])}
              onConfirm={() => setConfirming(true)}
              onReject={() => setRejecting(true)}
              onRelease={() => {
                setReleaseKey((k) => k + 1);
                setReleasing(true);
              }}
            />
          )
        }
      >
        {selected && <DepositDetail deposit={selected} />}
      </SlideOver>

      {selected && (
        <ReleaseSheet
          key={releaseKey}
          open={releasing}
          deposit={selected}
          onClose={() => setReleasing(false)}
          onReleased={async () => {
            setReleasing(false);
            await router.invalidate();
          }}
        />
      )}

      <ConfirmDialog
        open={confirming && !!selected}
        title="Confirm you received it?"
        message={
          selected && (
            <>
              Only confirm once {money(selected.amount, selected.currency)} from {tenantName(selected)} is in{" "}
              {getPaidIntoAccount(selected)?.name || "your account"}. est8Ledger then gives the final approval.
            </>
          )
        }
        confirmLabel="Yes, I received it"
        cancelLabel="Not yet"
        busy={busy}
        onConfirm={handleApprove}
        onClose={() => setConfirming(false)}
      />

      <ConfirmDialog
        open={rejecting && !!selected}
        title="Reject this payment?"
        message={selected && `Tell ${tenantName(selected)} what's wrong. They'll see this and can pay again.`}
        confirmLabel="Reject"
        destructive
        busy={busy}
        input={{ placeholder: "e.g. Money not received", minLength: 3, error: "Say why you're rejecting the payment." }}
        onConfirm={handleReject}
        onClose={() => setRejecting(false)}
      />
    </div>
  );
}

type StepState = "done" | "current" | "todo" | "skipped" | "rejected";

function Step({ title, detail, state, isLast }: { title: string; detail?: string; state: StepState; isLast?: boolean }) {
  const style = {
    done: { dot: "bg-[#34c759] text-white", icon: <Check size={12} strokeWidth={3} /> },
    current: { dot: "bg-[#ff9500] text-white", icon: <Clock size={12} strokeWidth={2.5} /> },
    todo: { dot: "bg-slate-200 text-slate-400", icon: null },
    skipped: { dot: "bg-slate-200 text-slate-400", icon: <Minus size={12} strokeWidth={3} /> },
    rejected: { dot: "bg-[#ff3b30] text-white", icon: <X size={12} strokeWidth={3} /> },
  }[state];
  const muted = state === "todo" || state === "skipped";
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full ${style.dot}`}>{style.icon}</span>
        {!isLast && <span className="my-1 w-px flex-1 bg-slate-200" />}
      </div>
      <div className={isLast ? "" : "pb-5"}>
        <p className={`text-sm font-semibold ${muted ? "text-slate-400" : "text-slate-900"}`}>{title}</p>
        {detail && <p className="mt-0.5 text-[13px] text-slate-500">{detail}</p>}
      </div>
    </li>
  );
}

function DepositDetail({ deposit }: { deposit: SecurityDepositRecord }) {
  const stage = getDepositStage(deposit);
  const landlordHeld = isLandlordHeld(deposit);
  const account = getPaidIntoAccount(deposit);
  const reference = deposit.paymentReference || deposit.reference;
  const release = getReleaseState(deposit);
  const meta = stageMeta[stage];

  const landlordStep = (): { state: StepState; detail?: string } => {
    if (!landlordHeld) return { state: "skipped", detail: "Not needed: paid to est8Ledger" };
    if (deposit.mgtApprovedAt) return { state: "done", detail: formatDate(deposit.mgtApprovedAt) };
    if (stage === "REJECTED" && deposit.rejectedByRole === "MGT") return { state: "rejected", detail: formatDate(deposit.rejectedAt) };
    return stage === "AWAITING_LANDLORD" ? { state: "current", detail: "Check you received it" } : { state: "todo" };
  };
  const adminStep = (): { state: StepState; detail?: string } => {
    if (stage === "COMPLETED") return { state: "done", detail: formatDate(deposit.adminApprovedAt) || undefined };
    if (stage === "REJECTED" && deposit.rejectedByRole !== "MGT") return { state: "rejected", detail: formatDate(deposit.rejectedAt) };
    return stage === "AWAITING_EST8LEDGER" ? { state: "current", detail: "est8Ledger is reviewing it" } : { state: "todo" };
  };

  const copyReference = async () => {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      toast.success("Reference copied");
    } catch {
      toast.error("Couldn't copy the reference");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-50 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-500">Deposit payment</span>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
        <p className="mt-2 text-[34px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
          {money(deposit.amount, deposit.currency)}
        </p>
      </div>

      <div className="divide-y divide-black/[0.06] rounded-2xl ring-1 ring-black/[0.06] px-4">
        <DetailRow label="Paid into">
          <span className="block">{account ? account.name : landlordHeld ? "Your account" : "est8Ledger"}</span>
          {account?.number && <span className="block text-xs font-normal text-slate-500">{account.number}</span>}
        </DetailRow>
        <DetailRow label="Reference">
          {reference ? (
            <button onClick={copyReference} className="inline-flex items-center gap-1.5 hover:text-[#3f0ee3]" title="Copy reference">
              {reference}
              <Copy size={13} className="text-slate-400" />
            </button>
          ) : (
            "—"
          )}
        </DetailRow>
        <DetailRow label="Submitted">{formatDate(deposit.createdAt) || "—"}</DetailRow>
      </div>

      <div>
        <p className="eyebrow mb-3">Approval</p>
        <ol>
          <Step title="Tenant paid" detail={formatDate(deposit.updatedAt || deposit.createdAt)} state="done" />
          <Step title="You confirm receipt" {...landlordStep()} />
          <Step title="est8Ledger final approval" {...adminStep()} isLast />
        </ol>
      </div>

      {stage === "REJECTED" && deposit.rejectionReason && (
        <div className="rounded-2xl bg-[#ff3b30]/[0.07] p-4">
          <p className="text-[13px] font-semibold text-[#d70015]">
            Rejected by {deposit.rejectedByRole === "MGT" ? "you" : "est8Ledger"}
          </p>
          <p className="mt-1 text-sm text-slate-800">{deposit.rejectionReason}</p>
          <p className="mt-1.5 text-xs text-slate-500">The tenant has been asked to pay again.</p>
        </div>
      )}

      {release !== "HELD" && (
        <div>
          <p className="eyebrow mb-3">Refund</p>
          <div className="divide-y divide-black/[0.06] rounded-2xl ring-1 ring-black/[0.06] px-4">
            <DetailRow label="Status">
              {release === "RECEIVED" ? "Tenant confirmed receipt" : release === "RELEASED" ? "Waiting for tenant to confirm" : "Tenant disputed"}
            </DetailRow>
            <DetailRow label="Amount returned">{money(deposit.releasedAmount, deposit.currency)}</DetailRow>
            {(deposit.releaseDeductions ?? []).map((d, i) => (
              <DetailRow key={i} label={d.reason}>− {money(d.amount, deposit.currency)}</DetailRow>
            ))}
            {release === "DISPUTED" && deposit.releaseDisputeReason && (
              <DetailRow label="Dispute">“{deposit.releaseDisputeReason}”</DetailRow>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DepositActions({ deposit, canRelease, onConfirm, onReject, onRelease }: {
  deposit: SecurityDepositRecord;
  canRelease: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onRelease: () => void;
}) {
  if (getDepositStage(deposit) === "AWAITING_LANDLORD") {
    return (
      <div className="grid grid-cols-[1fr_2fr] gap-2">
        <button onClick={onReject} className="btn btn-danger">Reject</button>
        <button onClick={onConfirm} className="btn btn-primary">
          <CheckCircle2 size={16} />
          Confirm received
        </button>
      </div>
    );
  }
  if (canRelease) {
    return (
      <button onClick={onRelease} className="btn btn-primary w-full">
        {getReleaseState(deposit) === "DISPUTED" ? "Release deposit again" : "Release deposit"}
      </button>
    );
  }
  return null;
}

type Row = { key: number; reason: string; amount: string };

const parseAmount = (s: string) => {
  const n = parseFloat(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Pay a landlord-held deposit back, minus itemised deductions the tenant will see. */
function ReleaseSheet({ open, deposit, onClose, onReleased }: {
  open: boolean;
  deposit: SecurityDepositRecord;
  onClose: () => void;
  onReleased: () => void;
}) {
  const disputed = getReleaseState(deposit) === "DISPUTED";
  const name = tenantName(deposit);
  const depositAmount = Number(deposit.amount) || 0;
  // After a dispute, start from the previous deductions so the landlord can adjust them.
  // Remounted (via `key`) on every open. After a dispute, start from the previous deductions so the landlord can adjust them.
  const [rows, setRows] = useState<Row[]>(() =>
    disputed
      ? (deposit.releaseDeductions ?? []).map((d, i) => ({ key: i, reason: d.reason, amount: String(d.amount) }))
      : []
  );
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const deducted = rows.reduce((sum, r) => sum + parseAmount(r.amount), 0);
  const refund = Math.max(0, depositAmount - deducted);
  const rowErrors = rows.map((r) => ({ reason: r.reason.trim().length < 3, amount: parseAmount(r.amount) <= 0 }));
  const overDeducted = deducted > depositAmount;
  const isValid = !overDeducted && rowErrors.every((e) => !e.reason && !e.amount);

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const release = async () => {
    setSaving(true);
    try {
      await securityDepositService.releaseDeposit(
        deposit.id,
        rows.map((r) => ({ reason: r.reason.trim(), amount: parseAmount(r.amount) }))
      );
      toast.success(`Deposit released. ${name} has been asked to confirm they received it.`);
      setConfirmOpen(false);
      onReleased();
    } catch (error) {
      toast.error(getNetworkError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SlideOver
        open={open}
        onClose={onClose}
        title="Release deposit"
        subtitle={`Pay ${name} back. Add a deduction for anything you're keeping, with a reason they'll see.`}
        widthClass="max-w-lg"
        footer={
          <button
            onClick={() => {
              setSubmitted(true);
              if (isValid) setConfirmOpen(true);
            }}
            className="btn btn-primary btn-lg w-full"
          >
            Release {money(refund, deposit.currency)}
          </button>
        }
      >
        <div className="space-y-5">
          {disputed && (
            <div className="flex gap-2.5 rounded-2xl bg-[#ff9500]/10 p-4 text-sm text-slate-800" role="alert">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#c93400]" />
              <p>
                {name} disputed your last release
                {deposit.releaseDisputeReason ? `: “${deposit.releaseDisputeReason}”` : "."} Adjust the deductions if needed and release again.
              </p>
            </div>
          )}

          <div>
            <p className="eyebrow mb-3">Deductions</p>
            {rows.length === 0 && (
              <p className="text-sm text-slate-500">No deductions. {name} gets the full deposit back.</p>
            )}
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={row.key} className="rounded-2xl bg-slate-50 p-3.5">
                  <div className="flex items-start gap-2">
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
                      <input
                        value={row.reason}
                        onChange={(e) => updateRow(row.key, { reason: e.target.value })}
                        placeholder="Reason, e.g. Broken kitchen window"
                        maxLength={200}
                        aria-label={`Reason for deduction ${i + 1}`}
                        aria-invalid={submitted && rowErrors[i]?.reason}
                        className="field"
                      />
                      <input
                        value={row.amount}
                        onChange={(e) => updateRow(row.key, { amount: e.target.value.replace(/[^\d.]/g, "") })}
                        placeholder="Amount"
                        inputMode="decimal"
                        aria-label={`Amount for deduction ${i + 1}`}
                        aria-invalid={submitted && rowErrors[i]?.amount}
                        className="field tabular-nums"
                      />
                    </div>
                    <button
                      onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                      aria-label={`Remove deduction ${i + 1}`}
                      className="flex h-11 w-9 items-center justify-center rounded-lg text-[#d70015] hover:bg-[#ff3b30]/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {submitted && (rowErrors[i]?.reason || rowErrors[i]?.amount) && (
                    <p className="mt-1.5 text-xs text-[#d70015]">
                      {rowErrors[i]?.reason ? "Give a reason the tenant will understand." : "Enter an amount above zero."}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setRows((rs) => [...rs, { key: Date.now(), reason: "", amount: "" }])}
              disabled={rows.length >= 20}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#3f0ee3]/40 py-3 text-sm font-semibold text-[#3f0ee3] hover:bg-[#3f0ee3]/[0.04]"
            >
              <Plus size={16} />
              Add deduction
            </button>
          </div>

          <div className="rounded-2xl ring-1 ring-black/[0.06] px-4 py-2">
            <div className="flex justify-between py-1.5 text-sm text-slate-600">
              <span>Deposit held</span>
              <span className="tabular-nums">{money(depositAmount, deposit.currency)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm text-slate-600">
              <span>Deductions</span>
              <span className={`tabular-nums ${deducted > 0 ? "text-[#d70015]" : ""}`}>
                {deducted > 0 ? `− ${money(deducted, deposit.currency)}` : money(0, deposit.currency)}
              </span>
            </div>
            <div className="mt-1 flex justify-between border-t border-black/[0.06] py-2.5">
              <span className="font-semibold text-slate-900">{name} receives</span>
              <span className="text-[17px] font-semibold text-slate-900 tabular-nums">{money(refund, deposit.currency)}</span>
            </div>
          </div>
          {overDeducted && (
            <p className="text-xs text-[#d70015]" aria-live="polite">Deductions can't be more than the deposit.</p>
          )}
        </div>
      </SlideOver>

      <ConfirmDialog
        open={confirmOpen}
        title="Release deposit?"
        message={`${name} will be told to expect ${money(refund, deposit.currency)}${
          deducted > 0 ? ` (${money(deducted, deposit.currency)} deducted)` : ""
        }. Only release once you've sent the money. They'll confirm when it arrives.`}
        confirmLabel={saving ? "Releasing" : "Release"}
        busy={saving}
        onConfirm={release}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
