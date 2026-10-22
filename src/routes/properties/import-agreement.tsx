import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Check, FileText, Loader2, Quote, RotateCcw, Upload } from "lucide-react";
import { toast } from "react-toastify";
import PropertiesLayout from "../../componennts/PropertiesLayout";
import { Badge } from "../../componennts/dashboard/ui";
import importService, { type AgreementExtraction } from "../../services/importService";
import agreementService from "../../services/agreementService";
import configurationService from "../../services/config";
import { useAppStore } from "../../store";
import { getNetworkError } from "../../utils";
import type { PropertyAgreement } from "../../types";

export const Route = createFileRoute("/properties/import-agreement")({
  component: ImportAgreementPage,
  beforeLoad: () => {
    if (!useAppStore.getState().token) throw redirect({ to: "/login" });
  },
});

type Form = {
  propertyName: string;
  propertyAddress: string;
  city: string;
  district: string;
  propertyType: string;
  numberOfUnits: string;
  currency: string;
  terminationNoticeDays: string;
  securityDepositMonths: string;
  initialAdvanceMonths: string;
  rentIncreaseNoticeDays: string;
  evictionProcess: string;
};

type FieldKey = keyof Form;
type Evidence = Partial<Record<FieldKey, string>>;

type Country = {
  currency?: string;
  terminationNoticeDays?: number | null;
  securityDepositMonths?: number | null;
  initialAdvanceMonths?: number | null;
  rentIncreaseNoticeDays?: number | null;
  maxSecurityDepositMonths?: number | null;
  evictionProcess?: string | null;
};

const MAX_BYTES = 10 * 1024 * 1024;
const REQUIRED: FieldKey[] = ["propertyName", "propertyAddress", "city", "district", "propertyType", "numberOfUnits", "currency", "evictionProcess"];

const str = (n?: number | null) => (n == null ? "" : String(n));

function ImportAgreementPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const setActiveProperty = useAppStore((s) => s.setActiveProperty);
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState<File | null>(null);
  const [result, setResult] = useState<{ file: File; data: AgreementExtraction; country: Country } | null>(null);

  const read = async (file: File) => {
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      toast.error("Choose a PDF file");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("The PDF is larger than 10 MB");
      return;
    }
    setReading(file);
    try {
      const [data, countryResponse] = await Promise.all([
        importService.extractAgreement(file),
        user?.countryId ? configurationService.getCountryById(user.countryId).catch(() => null) : Promise.resolve(null),
      ]);
      setResult({ file, data, country: (countryResponse?.data ?? countryResponse ?? {}) as Country });
    } catch (error) {
      toast.error(getNetworkError(error));
    } finally {
      setReading(null);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) read(file);
  };

  const onCreated = (property: PropertyAgreement | null) => {
    if (property?.id) {
      setActiveProperty(property);
      navigate({ to: "/dashboard/home" });
    } else {
      navigate({ to: "/properties" });
    }
  };

  return (
    <PropertiesLayout
      pageTitle="Add from agreement"
      subTitle="Upload a signed tenancy agreement and est8Ledger sets up the property and its clauses for you to check."
    >
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) read(file);
          e.target.value = "";
        }}
      />
      {result ? (
        <ReviewForm
          key={result.file.name + result.file.lastModified}
          fileName={result.file.name}
          data={result.data}
          country={result.country}
          countryId={user?.countryId}
          onReplace={() => input.current?.click()}
          onCreated={onCreated}
        />
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={!!reading}
          className={`card flex w-full flex-col items-center justify-center gap-3 px-6 py-20 text-center transition-colors ${
            dragging ? "bg-[#3f0ee3]/[0.04] ring-2 ring-[#3f0ee3]" : "hover:bg-slate-50"
          }`}
        >
          {reading ? (
            <>
              <Loader2 size={30} className="animate-spin text-[#3f0ee3]" />
              <p className="text-[17px] font-semibold text-slate-900">Reading the agreement…</p>
              <p className="text-sm text-slate-500">{reading.name}</p>
            </>
          ) : (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3f0ee3]/[0.08] text-[#3f0ee3]">
                <FileText size={24} strokeWidth={1.75} />
              </span>
              <p className="text-[17px] font-semibold text-slate-900">Drop the agreement PDF here</p>
              <p className="max-w-md text-sm leading-relaxed text-slate-500">
                We read the property details and notice periods, and match each clause to your standard clauses. You check
                everything before the property is created. PDFs exported from Word or Google Docs work best; scans can't be read.
              </p>
              <span className="btn btn-primary mt-2">
                <Upload size={16} />
                Choose PDF
              </span>
            </>
          )}
        </button>
      )}
    </PropertiesLayout>
  );
}

function ReviewForm({
  fileName,
  data,
  country,
  countryId,
  onReplace,
  onCreated,
}: {
  fileName: string;
  data: AgreementExtraction;
  country: Country;
  countryId?: number;
  onReplace: () => void;
  onCreated: (property: PropertyAgreement | null) => void;
}) {
  const { terms } = data;
  const evidence: Evidence = {
    propertyName: terms.propertyName?.evidence,
    propertyAddress: terms.propertyAddress?.evidence,
    currency: terms.currency?.evidence,
    terminationNoticeDays: terms.terminationNoticeDays?.evidence,
    securityDepositMonths: terms.securityDepositMonths?.evidence,
    initialAdvanceMonths: terms.initialAdvanceMonths?.evidence,
    rentIncreaseNoticeDays: terms.rentIncreaseNoticeDays?.evidence,
  };

  // Agreement first, then the country's defaults, as the add-property form does.
  const [form, setForm] = useState<Form>(() => ({
    propertyName: terms.propertyName?.value ?? "",
    propertyAddress: terms.propertyAddress?.value ?? "",
    city: "",
    district: "",
    propertyType: "Residential",
    numberOfUnits: "",
    currency: terms.currency?.value ?? country.currency ?? "",
    terminationNoticeDays: str(terms.terminationNoticeDays?.value ?? country.terminationNoticeDays),
    securityDepositMonths: str(terms.securityDepositMonths?.value ?? country.securityDepositMonths),
    initialAdvanceMonths: str(terms.initialAdvanceMonths?.value ?? country.initialAdvanceMonths),
    rentIncreaseNoticeDays: str(terms.rentIncreaseNoticeDays?.value ?? country.rentIncreaseNoticeDays),
    evictionProcess: country.evictionProcess ?? "",
  }));
  const [selected, setSelected] = useState<Set<number>>(() => new Set(data.matchedClauses.map((m) => m.clauseId)));
  const [customs, setCustoms] = useState<Set<number>>(() => new Set());
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: FieldKey) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const missing = REQUIRED.filter((k) => !form[k].trim());
  const depositOverMax =
    country.maxSecurityDepositMonths != null && Number(form.securityDepositMonths) > country.maxSecurityDepositMonths;

  const toggle = (setter: typeof setSelected, id: number) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const create = async () => {
    setTouched(true);
    if (missing.length || depositOverMax) {
      toast.error(depositOverMax ? "The deposit is above your country's limit" : "Fill in the highlighted details");
      return;
    }
    if (!countryId) {
      toast.error("Your account has no country set. Update it in Settings first.");
      return;
    }
    setSaving(true);
    try {
      const int = (v: string) => (v.trim() === "" ? undefined : parseInt(v, 10));
      const response = await agreementService.createPropertyAgreement({
        propertyName: form.propertyName.trim(),
        propertyAddress: form.propertyAddress.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        propertyType: form.propertyType,
        numberOfUnits: int(form.numberOfUnits),
        currency: form.currency.trim().toUpperCase(),
        countryId,
        terminationNoticeDays: int(form.terminationNoticeDays),
        securityDepositMonths: int(form.securityDepositMonths),
        initialAdvanceMonths: int(form.initialAdvanceMonths),
        rentIncreaseNoticeDays: int(form.rentIncreaseNoticeDays),
        evictionProcess: form.evictionProcess,
        securityDepositRequired: (int(form.securityDepositMonths) ?? 0) > 0,
        selectedClauseIds: [...selected],
        customClauses: data.customClauseSuggestions
          .filter((_, i) => customs.has(i))
          .map((c) => ({ title: c.title, description: c.description })),
      });
      toast.success(`${form.propertyName.trim()} is set up`);
      onCreated((response?.data ?? response) as PropertyAgreement | null);
    } catch (error) {
      toast.error(getNetworkError(error));
    } finally {
      setSaving(false);
    }
  };

  const foundCount = Object.values(evidence).filter(Boolean).length;
  const field = (key: FieldKey, label: string, control: ReactNode) => (
    <Field label={label} evidence={evidence[key]} invalid={touched && REQUIRED.includes(key) && !form[key].trim()}>
      {control}
    </Field>
  );
  const text = (key: FieldKey, props: { inputMode?: "numeric"; placeholder?: string } = {}) => (
    <input
      value={form[key]}
      onChange={(e) => set(key)(e.target.value)}
      aria-invalid={touched && REQUIRED.includes(key) && !form[key].trim()}
      className="field"
      {...props}
    />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Property */}
      <div className="space-y-6">
        <section className="card flex items-center gap-3.5 px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff3b30]/[0.08] text-[#d70015]">
            <FileText size={21} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-slate-900">{fileName}</p>
            <p className="text-[13px] text-slate-500">
              {data.pageCount} {data.pageCount === 1 ? "page" : "pages"} · {data.sectionCount} sections · {foundCount} details found
            </p>
          </div>
          <button onClick={onReplace} className="btn btn-secondary">
            <RotateCcw size={15} />
            Replace
          </button>
        </section>

        <section className="card space-y-5 p-6">
          <div>
            <h2 className="text-[17px] font-semibold text-slate-900">Property</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Details marked <span className="font-medium text-[#3f0ee3]">From agreement</span> were read from the PDF. Fill in the rest.
            </p>
          </div>
          {field("propertyName", "Property name", text("propertyName"))}
          {field("propertyAddress", "Address", text("propertyAddress"))}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("city", "City", text("city"))}
            {field("district", "District", text("district"))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {field(
              "propertyType",
              "Type",
              <select value={form.propertyType} onChange={(e) => set("propertyType")(e.target.value)} className="field">
                <option>Residential</option>
                <option>Commercial</option>
                <option>Mixed-Use</option>
              </select>
            )}
            {field("numberOfUnits", "Units", text("numberOfUnits", { inputMode: "numeric", placeholder: "e.g. 8" }))}
            {field("currency", "Currency", text("currency"))}
          </div>
          {terms.monthlyRent && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
              The agreement sets rent at{" "}
              <span className="font-semibold text-slate-900 tabular-nums">
                {form.currency || terms.currency?.value} {terms.monthlyRent.value.toLocaleString()}
              </span>{" "}
              a month. You'll enter rent for each tenant when you add them.
            </p>
          )}
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="text-[17px] font-semibold text-slate-900">Terms</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("terminationNoticeDays", "Termination notice (days)", text("terminationNoticeDays", { inputMode: "numeric" }))}
            {field("rentIncreaseNoticeDays", "Rent increase notice (days)", text("rentIncreaseNoticeDays", { inputMode: "numeric" }))}
            {field("securityDepositMonths", "Security deposit (months)", text("securityDepositMonths", { inputMode: "numeric" }))}
            {field("initialAdvanceMonths", "Rent in advance (months)", text("initialAdvanceMonths", { inputMode: "numeric" }))}
          </div>
          {depositOverMax && (
            <p className="text-xs text-[#d70015]">Your country allows at most {country.maxSecurityDepositMonths} months of deposit.</p>
          )}
          {field(
            "evictionProcess",
            "Eviction process",
            <select
              value={form.evictionProcess}
              onChange={(e) => set("evictionProcess")(e.target.value)}
              aria-invalid={touched && !form.evictionProcess}
              className="field"
            >
              <option value="">Choose…</option>
              <option value="COURT">Court</option>
              <option value="TRIBUNAL">Tribunal</option>
              <option value="OTHER">Other</option>
            </select>
          )}
        </section>
      </div>

      {/* Clauses */}
      <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <section className="card overflow-hidden">
          <div className="px-6 pb-3 pt-5">
            <h2 className="text-[17px] font-semibold text-slate-900">Clauses</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {data.matchedClauses.length > 0
                ? `${data.matchedClauses.length} of the agreement's clauses match your standard clauses and are ticked. Untick any that don't belong.`
                : "None of the agreement's clauses clearly matched your standard clauses. Tick the ones that apply."}
            </p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto border-t border-black/[0.06]">
            {data.matchedClauses.length > 0 && (
              <ClauseGroup title="Found in the agreement">
                {data.matchedClauses.map((m) => (
                  <ClauseRow
                    key={m.clauseId}
                    checked={selected.has(m.clauseId)}
                    onToggle={() => toggle(setSelected, m.clauseId)}
                    title={m.title}
                    badge={m.confidence === "high" ? <Badge tone="emerald">Strong match</Badge> : <Badge tone="amber">Possible match</Badge>}
                    quote={m.excerpt ? `${m.sectionHeading} — ${m.excerpt}` : m.sectionHeading}
                  />
                ))}
              </ClauseGroup>
            )}
            {data.customClauseSuggestions.length > 0 && (
              <ClauseGroup title="Only in this agreement" hint="Add as custom clauses">
                {data.customClauseSuggestions.map((c, i) => (
                  <ClauseRow key={i} checked={customs.has(i)} onToggle={() => toggle(setCustoms, i)} title={c.title} quote={c.description} />
                ))}
              </ClauseGroup>
            )}
            {data.otherClauses.length > 0 && (
              <ClauseGroup title="Other standard clauses" hint="Not found in the agreement">
                {data.otherClauses.map((c) => (
                  <ClauseRow
                    key={c.clauseId}
                    checked={selected.has(c.clauseId)}
                    onToggle={() => toggle(setSelected, c.clauseId)}
                    title={c.title}
                    description={c.description ?? undefined}
                  />
                ))}
              </ClauseGroup>
            )}
          </div>
        </section>

        <button onClick={create} disabled={saving} className="btn btn-primary btn-lg w-full">
          {saving && <Loader2 size={17} className="animate-spin" />}
          Create property with {selected.size + customs.size} {selected.size + customs.size === 1 ? "clause" : "clauses"}
        </button>
        {touched && missing.length > 0 && (
          <p className="text-center text-xs text-[#d70015]">Fill in the {missing.length} highlighted {missing.length === 1 ? "detail" : "details"} first.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, evidence, invalid, children }: { label: string; evidence?: string; invalid?: boolean; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <span className={`text-[13px] font-medium ${invalid ? "text-[#d70015]" : "text-slate-700"}`}>{label}</span>
        {evidence && (
          <span className="group relative">
            <span className="cursor-help whitespace-nowrap text-[11px] font-semibold text-[#3f0ee3]" tabIndex={0}>
              From agreement
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute right-0 top-5 z-10 hidden w-72 rounded-xl bg-slate-900 p-3 text-xs leading-relaxed text-white shadow-xl group-focus-within:block group-hover:block"
            >
              “{evidence}”
            </span>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ClauseGroup({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="sticky top-0 z-[1] flex items-baseline justify-between bg-slate-50/95 px-6 py-2 text-xs font-semibold text-slate-500 backdrop-blur">
        {title}
        {hint && <span className="font-normal">{hint}</span>}
      </p>
      <ul className="divide-y divide-black/[0.05]">{children}</ul>
    </div>
  );
}

function ClauseRow({
  checked,
  onToggle,
  title,
  badge,
  quote,
  description,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  badge?: ReactNode;
  quote?: string;
  description?: string;
}) {
  return (
    <li>
      <label className="flex cursor-pointer gap-3 px-6 py-3.5 hover:bg-slate-50">
        <input type="checkbox" checked={checked} onChange={onToggle} className="peer sr-only" />
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#3f0ee3] ${
            checked ? "bg-[#3f0ee3] text-white ring-[#3f0ee3]" : "bg-white ring-slate-300"
          }`}
        >
          {checked && <Check size={13} strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-900">{title}</span>
            {badge}
          </span>
          {quote && (
            <span className="mt-1 flex gap-1.5 text-[13px] leading-relaxed text-slate-500">
              <Quote size={12} className="mt-1 shrink-0 text-slate-300" />
              <span className="line-clamp-3">{quote}</span>
            </span>
          )}
          {description && <span className="mt-0.5 block text-[13px] text-slate-500 line-clamp-2">{description}</span>}
        </span>
      </label>
    </li>
  );
}
