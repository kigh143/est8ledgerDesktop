import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  UserRound,
  ShieldCheck,
  Lock,
  Smartphone,
  Building2,
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CloudOff,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAppStore } from "../../store";
import securityDepositAccountService from "../../services/securityDepositAccountService";
import SlideOver from "../../componennts/SlideOver";
import { ConfirmDialog, PageHeader } from "../../componennts/dashboard/ui";
import type { DepositAccountType, PropertyDepositSetup, SecurityDepositAccount } from "../../types";
import { getNetworkError } from "../../utils";

export const Route = createFileRoute("/dashboard/deposit-collection")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) return { setup: null as PropertyDepositSetup | null, failed: false };
    try {
      const setup = await securityDepositAccountService.getPropertySetup(activeProperty.id);
      return { setup, failed: false };
    } catch {
      return { setup: null as PropertyDepositSetup | null, failed: true };
    }
  },
  component: DepositCollectionPage,
});

const SUPPORT_PHONE = "447930068728";

const supportLink = (propertyName?: string) =>
  `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(
    `Hello, I need help changing the security deposit accounts${propertyName ? ` for ${propertyName}` : ""} on est8Ledger.`
  )}`;

const ACCOUNT_TYPES: { value: DepositAccountType; label: string }[] = [
  { value: "MTN_MOMO", label: "MTN Mobile Money" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "BANK_ACCOUNT", label: "Bank account" },
];

const formatAccountType = (type?: string | null) =>
  ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? (type || "").replace(/_/g, " ").toLowerCase();

function DepositCollectionPage() {
  const { setup, failed } = Route.useLoaderData();
  const router = useRouter();
  const activeProperty = useAppStore((s) => s.activeProperty);
  const [pendingMode, setPendingMode] = useState<boolean | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<SecurityDepositAccount | null>(null);
  const [removing, setRemoving] = useState<SecurityDepositAccount | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [lockedInfo, setLockedInfo] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(t);
  }, [justSaved]);

  if (failed || !setup) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CloudOff size={36} strokeWidth={1.5} className="text-slate-400" />
        <p className="mt-4 text-[17px] font-semibold text-slate-900">Couldn't load deposit settings</p>
        <p className="mt-1 text-sm text-slate-500">Check your connection, then try again.</p>
        <button onClick={() => router.invalidate()} className="btn btn-primary mt-5">Try again</button>
      </div>
    );
  }

  const savedViaEst8ledger = !!setup.collectDepositViaEst8ledger;
  // Show the chosen option straight away while it saves; on failure it falls back to the saved value.
  const viaEst8ledger = pendingMode ?? savedViaEst8ledger;
  const accounts = setup.accounts || [];
  const hasActiveAccount = accounts.some((a) => a.isActive);
  const hasLockedAccount = accounts.some((a) => a.isLocked);
  // While est8Ledger still holds deposits that haven't been returned, the landlord can't take collection back.
  const est8ledgerHoldsDeposits = savedViaEst8ledger && (setup.unsettledEst8ledgerDepositCount ?? 0) > 0;

  const changeMode = async (toEst8ledger: boolean) => {
    if (toEst8ledger === savedViaEst8ledger || pendingMode !== null) return;
    if ((toEst8ledger && hasLockedAccount) || (!toEst8ledger && est8ledgerHoldsDeposits)) {
      setLockedInfo(true);
      return;
    }
    setJustSaved(false);
    setPendingMode(toEst8ledger);
    try {
      await securityDepositAccountService.setCollectionMode(activeProperty!.id, toEst8ledger);
      await router.invalidate();
      setJustSaved(true);
    } catch (error) {
      toast.error(`${getNetworkError(error)} Your previous choice is still in place.`);
    } finally {
      setPendingMode(null);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      const res = await securityDepositAccountService.remove(removing.id);
      toast.success(
        res?.deactivated
          ? "This account already received deposits, so it was kept for your records and hidden from tenants."
          : "Account removed"
      );
      setRemoving(null);
      await router.invalidate();
    } catch (error) {
      toast.error(getNetworkError(error));
    } finally {
      setRemoveBusy(false);
    }
  };

  const openForm = (account: SecurityDepositAccount | null) => {
    setEditing(account);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Deposit collection"
        subtitle={`Choose where tenants of ${activeProperty?.propertyName ?? "this property"} pay their security deposit.`}
      />

      <section>
        <p className="eyebrow mb-3">Who collects the deposit?</p>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          <ModeOption
            selected={!viaEst8ledger}
            icon={<UserRound size={18} />}
            title="I collect it myself"
            description="Tenants pay into your own accounts below. You confirm each payment, then est8Ledger gives the final approval."
            onSelect={() => changeMode(false)}
            saving={pendingMode === false}
            disabled={pendingMode !== null}
            locked={est8ledgerHoldsDeposits && pendingMode === null}
            lockedReason="Unavailable while est8Ledger holds deposits that haven't been returned yet"
          />
          <ModeOption
            selected={viaEst8ledger}
            icon={<ShieldCheck size={18} />}
            title="Collect through est8Ledger"
            description="Tenants pay into est8Ledger's accounts, and est8Ledger holds and verifies the deposit."
            onSelect={() => changeMode(true)}
            saving={pendingMode === true}
            disabled={pendingMode !== null}
            locked={!savedViaEst8ledger && hasLockedAccount && pendingMode === null}
            lockedReason="Unavailable while your accounts hold deposits not yet paid out"
          />
        </div>
        {/* Fixed-height status line so the list below doesn't jump. */}
        <div className="mt-3 flex h-5 items-center gap-1.5 text-[13px] text-slate-500" aria-live="polite">
          {pendingMode !== null ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving your choice…
            </>
          ) : justSaved ? (
            <>
              <CheckCircle2 size={15} className="text-[#34c759]" />
              Saved · {savedViaEst8ledger ? "est8Ledger collects new deposits" : "You collect new deposits"}
            </>
          ) : null}
        </div>
      </section>

      {!viaEst8ledger && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">Your deposit accounts</p>
            {accounts.length > 0 && (
              <button onClick={() => openForm(null)} className="btn btn-tinted min-h-8 px-3 text-[13px]">
                <Plus size={15} /> Add account
              </button>
            )}
          </div>

          {!hasActiveAccount && (
            <div className="mb-3 flex gap-2.5 rounded-2xl bg-[#ff9500]/10 p-4 text-sm text-slate-800" role="alert">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#c93400]" />
              Tenants can't pay their deposit until you add at least one account.
            </div>
          )}

          {accounts.length === 0 ? (
            <button
              onClick={() => openForm(null)}
              className="flex w-full flex-col items-center rounded-2xl border border-dashed border-[#3f0ee3]/40 px-6 py-8 text-center hover:bg-[#3f0ee3]/[0.03]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3f0ee3]/10 text-[#3f0ee3]">
                <Plus size={20} />
              </span>
              <span className="mt-3 text-[15px] font-semibold text-[#3f0ee3]">Add a deposit account</span>
              <span className="mt-1 text-[13px] text-slate-500">Mobile money or bank details, with instructions for your tenants</span>
            </button>
          ) : (
            <ul className="card divide-y divide-black/[0.06] overflow-hidden">
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onEdit={() => openForm(account)}
                  onRemove={() => setRemoving(account)}
                  onLocked={() => setLockedInfo(true)}
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {activeProperty && (
        <AccountFormSheet
          key={formKey}
          open={formOpen}
          account={editing}
          propertyAgreementId={activeProperty.id}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await router.invalidate();
          }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        title="Remove account?"
        message={removing && `Tenants will no longer see ${removing.accountName} when paying their deposit.`}
        confirmLabel="Remove"
        destructive
        busy={removeBusy}
        onConfirm={confirmRemove}
        onClose={() => setRemoving(null)}
      />

      <ConfirmDialog
        open={lockedInfo}
        title="Contact us to make this change"
        message="To edit or delete an account that holds deposits, or to switch who collects deposits, please get in touch with us."
        confirmLabel="Message us"
        cancelLabel="Close"
        onConfirm={() => {
          window.open(supportLink(activeProperty?.propertyName), "_blank", "noopener");
          setLockedInfo(false);
        }}
        onClose={() => setLockedInfo(false)}
      />
    </div>
  );
}

function ModeOption({ selected, icon, title, description, onSelect, disabled, locked, lockedReason, saving }: {
  selected: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onSelect: () => void;
  disabled?: boolean;
  locked?: boolean;
  lockedReason: string;
  saving?: boolean;
}) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={`relative flex h-full flex-col items-start rounded-2xl bg-white p-5 text-left transition-shadow ${
        selected
          ? "ring-2 ring-[#3f0ee3] shadow-md"
          : "ring-1 ring-black/[0.08] hover:ring-black/[0.16]"
      } ${disabled && !saving ? "opacity-60" : ""}`}
    >
      <span className="flex w-full items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            selected ? "bg-[#3f0ee3]/10 text-[#3f0ee3]" : "bg-slate-100 text-slate-500"
          }`}
        >
          {icon}
        </span>
        {saving ? (
          <Loader2 size={18} className="animate-spin text-[#3f0ee3]" />
        ) : locked ? (
          <Lock size={16} className="text-slate-400" />
        ) : (
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
              selected ? "border-[#3f0ee3]" : "border-slate-300"
            }`}
          >
            {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#3f0ee3]" />}
          </span>
        )}
      </span>
      <span className="mt-4 text-[15px] font-semibold text-slate-900">{title}</span>
      <span className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</span>
      {locked && <span className="mt-3 text-xs font-medium text-slate-400">{lockedReason}</span>}
    </button>
  );
}

function AccountRow({ account, onEdit, onRemove, onLocked }: {
  account: SecurityDepositAccount;
  onEdit: () => void;
  onRemove: () => void;
  onLocked: () => void;
}) {
  const isBank = account.accountType === "BANK_ACCOUNT";
  const unsettled = account.unsettledDepositCount ?? 0;
  return (
    <li className="px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3f0ee3]/[0.08] text-[#3f0ee3]">
          {isBank ? <Building2 size={18} /> : <Smartphone size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
            <span className="truncate">{account.accountName}</span>
            {!account.isActive && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">Inactive</span>
            )}
          </p>
          <p className="truncate text-[13px] text-slate-500 tabular-nums">
            {account.accountNumber}
            {account.accountType ? ` · ${formatAccountType(account.accountType)}` : ""}
          </p>
        </div>
        {account.isLocked ? (
          <button onClick={onLocked} aria-label={`${account.accountName} is locked. Learn why`} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <Lock size={16} />
          </button>
        ) : (
          <div className="flex items-center">
            <button onClick={onEdit} aria-label={`Edit ${account.accountName}`} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
              <Pencil size={16} />
            </button>
            <button onClick={onRemove} aria-label={`Remove ${account.accountName}`} className="flex h-9 w-9 items-center justify-center rounded-full text-[#d70015] hover:bg-[#ff3b30]/10">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      {account.isLocked && (
        <p className="mt-2 pl-[52px] text-xs text-slate-400">
          Holding {unsettled} deposit{unsettled === 1 ? "" : "s"} not yet paid out, so it can't be edited or removed
        </p>
      )}
      {account.instructions && (
        <p className="mt-3 ml-[52px] border-t border-black/[0.06] pt-3 text-[13px] leading-relaxed text-slate-500">
          {account.instructions}
        </p>
      )}
    </li>
  );
}

function AccountFormSheet({ open, account, propertyAgreementId, onClose, onSaved }: {
  open: boolean;
  account: SecurityDepositAccount | null;
  propertyAgreementId: number | string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!account;
  // The parent remounts this sheet (via `key`) each time it opens, so state starts from the account.
  const [accountType, setAccountType] = useState<DepositAccountType | "">((account?.accountType as DepositAccountType) || "");
  const [accountName, setAccountName] = useState(account?.accountName || "");
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber || "");
  const [instructions, setInstructions] = useState(account?.instructions || "");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const isBank = accountType === "BANK_ACCOUNT";
  const missing = { type: !accountType, name: !accountName.trim(), number: !accountNumber.trim() };
  const isValid = !missing.type && !missing.name && !missing.number;

  const save = async () => {
    setSubmitted(true);
    if (!isValid || saving) return;
    setSaving(true);
    const payload = {
      accountType: accountType as DepositAccountType,
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      instructions: instructions.trim() || undefined,
    };
    try {
      if (account) await securityDepositAccountService.update(account.id, payload);
      else await securityDepositAccountService.create(propertyAgreementId, payload);
      toast.success(isEdit ? "Account updated" : "Account added");
      onSaved();
    } catch (error) {
      toast.error(getNetworkError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit account" : "Add deposit account"}
      subtitle="Tenants see these details when they pay their deposit."
      footer={
        <button onClick={save} disabled={saving} className="btn btn-primary btn-lg w-full">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? "Save changes" : "Add account"}
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <span className="label">Account type</span>
          <div className="grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setAccountType(t.value)}
                aria-pressed={accountType === t.value}
                className={`rounded-xl px-2 py-3 text-[13px] font-medium ${
                  accountType === t.value
                    ? "bg-[#3f0ee3]/[0.08] text-[#3f0ee3] ring-2 ring-[#3f0ee3]"
                    : "ring-1 ring-black/[0.1] text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {submitted && missing.type && <p className="mt-1.5 text-xs text-[#d70015]">Choose an account type.</p>}
        </div>

        <div>
          <label className="label" htmlFor="acc-name">{isBank ? "Account holder name" : "Registered name"}</label>
          <input id="acc-name" className="field" value={accountName} onChange={(e) => setAccountName(e.target.value)} aria-invalid={submitted && missing.name} placeholder="e.g. Jane Nakato" />
          {submitted && missing.name && <p className="mt-1.5 text-xs text-[#d70015]">Enter the name on the account.</p>}
        </div>

        <div>
          <label className="label" htmlFor="acc-number">{isBank ? "Account number" : "Phone number"}</label>
          <input id="acc-number" className="field tabular-nums" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} aria-invalid={submitted && missing.number} placeholder={isBank ? "e.g. 0123456789" : "e.g. 0772 123456"} />
          {submitted && missing.number && <p className="mt-1.5 text-xs text-[#d70015]">Enter the {isBank ? "account" : "phone"} number.</p>}
        </div>

        <div>
          <label className="label" htmlFor="acc-instructions">How should tenants pay you? <span className="font-normal text-slate-400">Optional</span></label>
          <textarea id="acc-instructions" rows={4} className="field resize-none" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder={isBank ? "e.g. Stanbic Bank, Kampala Road branch. Use your unit number as the reference." : "e.g. Send to this number and use your unit number as the reason."} />
        </div>
      </div>
    </SlideOver>
  );
}
