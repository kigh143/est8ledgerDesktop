import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ReceiptText, ShieldCheck, ShieldAlert, Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAppStore } from "../../store";
import PropertiesLayout from "../../componennts/PropertiesLayout";
import SlideOver from "../../componennts/SlideOver";
import { Badge, ConfirmDialog, EmptyState, Segmented } from "../../componennts/dashboard/ui";
import taxConfigService from "../../services/taxConfigService";
import type { TaxConfig, TaxpayerType } from "../../types";
import { getNetworkError } from "../../utils";

export const Route = createFileRoute("/properties/tax-compliance")({
  beforeLoad: () => {
    const { token } = useAppStore.getState();
    if (!token) throw redirect({ to: "/login" });
  },
  loader: async () => {
    try {
      return { configs: await taxConfigService.getMyTaxConfigs(), failed: false };
    } catch {
      return { configs: [] as TaxConfig[], failed: true };
    }
  },
  component: TaxCompliancePage,
});

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function TaxCompliancePage() {
  const { configs, failed } = Route.useLoaderData();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [toggling, setToggling] = useState<TaxConfig | null>(null);
  const [busy, setBusy] = useState(false);

  const activeConfig = configs.find((c) => c.isActive);

  const toggleActive = async () => {
    if (!toggling) return;
    setBusy(true);
    try {
      await taxConfigService.setTaxConfigActive(toggling.id, !toggling.isActive);
      toast.success(toggling.isActive ? "Tax config deactivated" : "Tax config activated");
      setToggling(null);
      await router.invalidate();
    } catch (error) {
      toast.error(getNetworkError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PropertiesLayout
      pageTitle="Tax compliance"
      subTitle="Issue URA EFRIS e-receipts automatically when you approve rent payments."
      action={
        <button onClick={() => setFormOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Add tax config
        </button>
      }
    >
      <div className="max-w-3xl space-y-8">
        <div
          className={`flex items-start gap-4 rounded-2xl p-5 ${
            activeConfig ? "bg-[#34c759]/[0.09]" : "bg-[#ff9500]/[0.09]"
          }`}
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white ${
              activeConfig ? "text-[#248a3d]" : "text-[#c93400]"
            }`}
          >
            {activeConfig ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          </span>
          <div>
            <p className="text-[15px] font-semibold text-slate-900">
              {activeConfig ? "EFRIS compliance is on" : "EFRIS compliance isn't set up"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {activeConfig
                ? `Approved rent payments get an EFRIS e-receipt using product code ${activeConfig.productCode}.`
                : "Add a tax config and activate it so approved rent payments get an EFRIS e-receipt."}
            </p>
          </div>
        </div>

        <section>
          <p className="eyebrow mb-3">Your tax configs</p>
          <div className="card overflow-hidden">
            {failed ? (
              <EmptyState
                icon={ReceiptText}
                title="Couldn't load your tax configs"
                message="Check your connection, then try again."
                action={<button onClick={() => router.invalidate()} className="btn btn-secondary">Try again</button>}
              />
            ) : configs.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="No tax configs yet"
                message="Add your TIN or NIN and the EFRIS product code to start issuing e-receipts."
                action={<button onClick={() => setFormOpen(true)} className="btn btn-tinted"><Plus size={16} /> Add tax config</button>}
              />
            ) : (
              <ul className="divide-y divide-black/[0.06]">
                {configs.map((config) => (
                  <li key={config.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                        {config.type === "COMPANY" ? "Company" : "Individual"} · {config.productCode}
                        {config.isActive && <Badge tone="emerald">Active</Badge>}
                      </p>
                      <p className="mt-0.5 text-[13px] text-slate-500 tabular-nums">
                        {[config.tin && `TIN ${config.tin}`, config.nin && `NIN ${config.nin}`].filter(Boolean).join(" · ") || "No TIN or NIN"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">Added {formatDate(config.createdAt)}</p>
                    </div>
                    <Switch checked={config.isActive} label={`${config.isActive ? "Deactivate" : "Activate"} ${config.productCode}`} onChange={() => setToggling(config)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <TaxConfigSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={async () => {
          setFormOpen(false);
          await router.invalidate();
        }}
      />

      <ConfirmDialog
        open={!!toggling}
        title={toggling?.isActive ? "Deactivate tax config?" : "Activate tax config?"}
        message={
          toggling?.isActive
            ? "Approved rent payments won't get an EFRIS receipt until you activate another tax config."
            : "Newly approved rent payments will use this config for EFRIS receipts. Any other active config is turned off."
        }
        confirmLabel={toggling?.isActive ? "Deactivate" : "Activate"}
        destructive={toggling?.isActive}
        busy={busy}
        onConfirm={toggleActive}
        onClose={() => setToggling(null)}
      />
    </PropertiesLayout>
  );
}

/** iOS-style toggle. */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-[#34c759]" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.06)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function TaxConfigSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<TaxpayerType>("INDIVIDUAL");
  const [tin, setTin] = useState("");
  const [nin, setNin] = useState("");
  const [productCode, setProductCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSubmitted(true);
    if (!productCode.trim() || saving) return;
    setSaving(true);
    try {
      await taxConfigService.createTaxConfig({
        type,
        tin: tin.trim() || undefined,
        nin: nin.trim() || undefined,
        productCode: productCode.trim(),
      });
      toast.success("Tax config saved. Activate it to start issuing EFRIS receipts.");
      setType("INDIVIDUAL");
      setTin("");
      setNin("");
      setProductCode("");
      setSubmitted(false);
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
      title="Add tax config"
      subtitle="Details used on EFRIS e-receipts for your rent payments."
      footer={
        <button onClick={save} disabled={saving} className="btn btn-primary btn-lg w-full">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save tax config
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <span className="label">Taxpayer type</span>
          <Segmented<TaxpayerType>
            ariaLabel="Taxpayer type"
            value={type}
            onChange={setType}
            options={[{ value: "INDIVIDUAL", label: "Individual" }, { value: "COMPANY", label: "Company" }]}
          />
        </div>
        <div>
          <label className="label" htmlFor="tin">TIN <span className="font-normal text-slate-400">Optional</span></label>
          <input id="tin" inputMode="numeric" className="field tabular-nums" value={tin} onChange={(e) => setTin(e.target.value)} placeholder="Tax Identification Number" />
        </div>
        <div>
          <label className="label" htmlFor="nin">NIN <span className="font-normal text-slate-400">Optional</span></label>
          <input id="nin" className="field" value={nin} onChange={(e) => setNin(e.target.value)} placeholder="National Identification Number" />
        </div>
        <div>
          <label className="label" htmlFor="product-code">EFRIS product code</label>
          <input id="product-code" className="field" value={productCode} onChange={(e) => setProductCode(e.target.value)} aria-invalid={submitted && !productCode.trim()} placeholder="e.g. 72101500" />
          {submitted && !productCode.trim() && (
            <p className="mt-1.5 text-xs text-[#d70015]">Enter the EFRIS product code.</p>
          )}
        </div>
      </div>
    </SlideOver>
  );
}
