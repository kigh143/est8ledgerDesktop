import { useState } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { securityDepositService } from "../../services/securityDepositService";
import SlideOver from "../SlideOver";
import { ConfirmDialog } from "../dashboard/ui";
import type { SecurityDepositRecord } from "../../types";
import { getNetworkError } from "../../utils";
import { getReleaseState } from "../../utils/depositStatus";

const money = (amount: number | string | null | undefined, currency: string) =>
  `${currency} ${new Intl.NumberFormat("en-US").format(Math.round(Number(amount) || 0))}`;

type Row = { key: number; reason: string; amount: string };

const parseAmount = (s: string) => {
  const n = parseFloat(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Pay a landlord-held deposit back, minus itemised deductions the tenant will see. */
export default function ReleaseDepositSheet({ open, deposit, tenantName: name, onClose, onReleased }: {
  open: boolean;
  deposit: SecurityDepositRecord;
  tenantName: string;
  onClose: () => void;
  onReleased: () => void;
}) {
  const disputed = getReleaseState(deposit) === "DISPUTED";
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
