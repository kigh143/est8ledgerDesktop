import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft, MessageCircle, Mail, Phone, AlertCircle, Edit, Trash2, Banknote,
  CheckCircle2, Clock, ShieldCheck, FileSignature, ClipboardCheck,
  Wallet, CalendarClock, Coins, CircleDollarSign, Home, Droplets, Zap,
  ListChecks, X, AlertTriangle, Download,
} from "lucide-react";
import tenancyService from "../../../services/tenancyService";
import { securityDepositService } from "../../../services/securityDepositService";
import { rentPaymentsService } from "../../../services/rentPaymentsService";
import type { DueRentDetails } from "../../../services/rentPaymentsService";
import { inspectionService } from "../../../services/inspectionService";
import SlideOver from "../../../componennts/SlideOver";
import { useAppStore } from "../../../store";
import { toast } from "react-toastify";
import type { TenancyAgreement, SecurityDepositRecord, RentPayment, InspectionItem, PropertyClause } from "../../../types";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formattedDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "";

function TenancyAgreementDrawer({
  open,
  onClose,
  tenancy,
  fmtMoney,
}: {
  open: boolean;
  onClose: () => void;
  tenancy: TenancyAgreement;
  fmtMoney: (n: number) => string;
}) {
  const { activeProperty } = useAppStore();
  const clauses = (activeProperty?.propertyClauses || []) as PropertyClause[];
  const owner = activeProperty?.owner;

  const financialTerms = [
    { label: "Monthly Rent", value: fmtMoney(Number(tenancy.rentAmount) || 0) },
    { label: "Security Deposit", value: fmtMoney(Number(tenancy.securityDeposit) || 0) },
    { label: "Payment Due Day", value: tenancy.paymentDueDay ? `Day ${tenancy.paymentDueDay} of each month` : "Not specified" },
    { label: "Grace Period", value: `${tenancy.gracePeriodDays} days` },
    ...(activeProperty
      ? [
          { label: "Initial Advance", value: `${activeProperty.initialAdvanceMonths} months' rent` },
          { label: "Termination Notice Period", value: `${activeProperty.terminationNoticeDays} days` },
          { label: "Rent Increase Notice Period", value: `${activeProperty.rentIncreaseNoticeDays} days` },
          { label: "Eviction Process", value: String(activeProperty.evictionProcess) },
        ]
      : []),
  ];

  const handleDownload = () => {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      toast.error("Please allow pop-ups to download the agreement");
      return;
    }

    const termRows = financialTerms
      .map(
        (t, i) =>
          `<div class="row"><span class="num">3.${i + 1}</span><span class="lbl">${esc(t.label)}</span><span class="val">${esc(t.value)}</span></div>`
      )
      .join("");

    const clauseBlocks = clauses
      .map(
        (pc, i) => `<div class="clause">
          <h4>4.${i + 1}&nbsp; ${esc(pc.clause?.title)}${pc.isCustom ? " <em>(Custom)</em>" : ""}</h4>
          <p>${esc(pc.clause?.body || pc.clause?.description)}</p>
        </div>`
      )
      .join("");

    const sigBlock = (label: string, fullName: string, signedAt: string | null | undefined) =>
      signedAt
        ? `<div><p class="sig-script">${esc(fullName)}</p><p class="sig-printed-name">${esc(fullName)}</p><p class="sig-label">${esc(label)}</p><p class="sig-date">Signed ${esc(formattedDate(signedAt))}</p></div>`
        : `<div><div class="sig-line"></div><p class="sig-label">${esc(label)}</p><p class="date-label">PENDING SIGNATURE</p></div>`;

    win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>Tenancy Agreement — ${esc(tenancy.tenant.firstName)} ${esc(tenancy.tenant.lastName)}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@400;600;700&family=Dancing+Script:wght@600;700&display=swap" rel="stylesheet" />
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Lora', Georgia, serif; color: #1e293b; margin: 0; padding: 56px; line-height: 1.7; font-size: 15px; }
        .letterhead { text-align: center; padding-bottom: 28px; margin-bottom: 32px; border-bottom: 2px solid #1e293b; }
        .brand { font-family: 'Poppins', sans-serif; text-transform: uppercase; letter-spacing: .2em; font-size: 11px; color: #94a3b8; font-weight: 600; margin: 0 0 10px; }
        .letterhead h1 { margin: 0; font-size: 30px; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; }
        .letterhead .sub { font-family: 'Poppins', sans-serif; color: #64748b; font-size: 12px; margin-top: 10px; }
        .preamble { margin-bottom: 36px; text-align: justify; }
        section { margin-bottom: 36px; }
        h2 { font-family: 'Poppins', sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: .1em; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin: 0 0 16px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .doc-label { font-family: 'Poppins', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin: 0 0 4px; font-weight: 600; }
        .doc-value-lg { font-size: 17px; font-weight: 600; margin: 0 0 2px; }
        .doc-value { margin: 0 0 2px; color: #334155; }
        .row { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #e2e8f0; align-items: baseline; }
        .row .num { font-family: 'Poppins', sans-serif; font-size: 11px; color: #94a3b8; width: 32px; flex-shrink: 0; }
        .row .lbl { color: #475569; flex: 1; }
        .row .val { font-weight: 600; text-align: right; }
        .clause { padding: 14px 0; border-bottom: 1px solid #e2e8f0; }
        .clause h4 { margin: 0 0 6px; font-size: 15px; font-weight: 700; }
        .clause em { font-style: italic; color: #94a3b8; font-weight: 400; font-size: 13px; }
        .clause p { margin: 0; color: #334155; white-space: pre-wrap; text-align: justify; }
        .witness { font-style: italic; color: #64748b; margin-bottom: 32px; }
        .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 8px; }
        .sig-line { border-bottom: 1px solid #475569; height: 44px; }
        .sig-script { font-family: 'Dancing Script', cursive; font-size: 30px; color: #1e293b; line-height: 1.2; }
        .sig-printed-name { font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; color: #334155; margin-top: 6px; }
        .sig-label { font-family: 'Poppins', sans-serif; font-size: 12px; color: #64748b; margin-top: 2px; }
        .date-label { font-family: 'Poppins', sans-serif; font-size: 10px; color: #d97706; margin-top: 6px; font-weight: 600; letter-spacing: .05em; }
        .sig-date { font-family: 'Poppins', sans-serif; font-size: 11px; color: #059669; margin-top: 4px; }
        .foot { font-family: 'Poppins', sans-serif; margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-align: center; }
        @media print { body { padding: 32px; } }
      </style></head><body>
      <div class="letterhead">
        <p class="brand">est8Ledger · Property Management</p>
        <h1>Tenancy Agreement</h1>
        <div class="sub">Agreement Ref. #${esc(tenancy.id)} &nbsp;·&nbsp; Prepared ${esc(formattedDate(tenancy.createdAt))}</div>
      </div>

      <p class="preamble">This Tenancy Agreement (the &ldquo;<strong>Agreement</strong>&rdquo;) is made and entered into by and between <strong>${esc(owner?.firstName)} ${esc(owner?.lastName)}</strong> (the &ldquo;<strong>Landlord</strong>&rdquo;) and <strong>${esc(tenancy.tenant.firstName)} ${esc(tenancy.tenant.lastName)}</strong> (the &ldquo;<strong>Tenant</strong>&rdquo;) in respect of Unit ${esc(tenancy.unitName)} at ${esc(activeProperty?.propertyName)}, ${esc(activeProperty?.propertyAddress)}.</p>

      <section>
        <h2>1. The Parties</h2>
        <div class="grid2">
          <div>
            <p class="doc-label">The Landlord / Management</p>
            <p class="doc-value-lg">${esc(owner?.firstName)} ${esc(owner?.lastName)}</p>
            <p class="doc-value">${esc(owner?.email)}</p>
          </div>
          <div>
            <p class="doc-label">The Tenant</p>
            <p class="doc-value-lg">${esc(tenancy.tenant.firstName)} ${esc(tenancy.tenant.lastName)}</p>
            <p class="doc-value">${esc(tenancy.tenant.email)}</p>
            <p class="doc-value">${esc(tenancy.tenant.phoneNumber)}</p>
          </div>
        </div>
      </section>

      <section>
        <h2>2. Property &amp; Unit</h2>
        <div class="grid2">
          <div>
            <p class="doc-label">Property</p>
            <p class="doc-value-lg">${esc(activeProperty?.propertyName)}</p>
            <p class="doc-value">${esc(activeProperty?.propertyAddress)}, ${esc(activeProperty?.city)}, ${esc(activeProperty?.district)}</p>
          </div>
          <div>
            <p class="doc-label">Unit</p>
            <p class="doc-value-lg">${esc(tenancy.unitName)}</p>
            <p class="doc-value">Water Meter: ${esc(tenancy.waterMeter || "N/A")} &nbsp;·&nbsp; YAKA Meter: ${esc(tenancy.yakaMeter || "N/A")}</p>
            <p class="doc-value">Waste handled by: ${esc(tenancy.wasteHandledBy)}</p>
          </div>
        </div>
      </section>

      <section>
        <h2>3. Financial Terms</h2>
        ${termRows}
      </section>

      ${clauses.length ? `<section><h2>4. Additional Clauses</h2>${clauseBlocks}</section>` : ""}

      <section>
        <p class="witness">IN WITNESS WHEREOF, the parties have executed this Agreement as evidenced by the signatures below.</p>
        <div class="sigs">
          ${sigBlock("Landlord / Management Signature", `${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`, tenancy.mgtSignedAt)}
          ${sigBlock("Tenant Signature", `${tenancy.tenant.firstName} ${tenancy.tenant.lastName}`, tenancy.tenantSignedAt)}
        </div>
      </section>

      <div class="foot">Document generated via est8Ledger &nbsp;·&nbsp; Last updated ${esc(formattedDate(tenancy.updatedAt))}</div>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Tenancy Agreement"
      subtitle={`${tenancy.tenant.firstName} ${tenancy.tenant.lastName} · ${tenancy.unitName}`}
      widthClass="max-w-3xl"
      footer={
        <div className="flex justify-end">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3f0ee3] text-white rounded-lg font-semibold hover:bg-[#3f0ee3]/90 transition-colors"
          >
            <Download size={17} />
            Download Agreement
          </button>
        </div>
      }
    >
      <div className="font-document">
        {/* Letterhead */}
        <div className="text-center pb-8 mb-8 border-b-2 border-slate-800">
          <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-slate-400 font-semibold mb-3">
            est8Ledger · Property Management
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-wide">
            Tenancy Agreement
          </h1>
          <p className="font-sans text-xs text-slate-500 mt-3">
            Agreement Ref. #{tenancy.id} &nbsp;·&nbsp; Prepared {formattedDate(tenancy.createdAt)}
          </p>
        </div>

        {/* Preamble */}
        <p className="text-slate-700 leading-relaxed mb-10 text-justify">
          This Tenancy Agreement (the &ldquo;<strong>Agreement</strong>&rdquo;) is made and entered into by and
          between <strong>{owner?.firstName} {owner?.lastName}</strong> (the &ldquo;<strong>Landlord</strong>
          &rdquo;) and <strong>{tenancy.tenant.firstName} {tenancy.tenant.lastName}</strong> (the &ldquo;
          <strong>Tenant</strong>&rdquo;) in respect of Unit {tenancy.unitName} at{" "}
          {activeProperty?.propertyName}, {activeProperty?.propertyAddress}.
        </p>

        {/* 1. Parties */}
        <section className="mb-10">
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-slate-900 border-b border-slate-300 pb-2 mb-5">
            1. The Parties
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                The Landlord / Management
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {owner?.firstName} {owner?.lastName}
              </p>
              <p className="text-slate-600">{owner?.email}</p>
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                The Tenant
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {tenancy.tenant.firstName} {tenancy.tenant.lastName}
              </p>
              <p className="text-slate-600">{tenancy.tenant.email}</p>
              <p className="text-slate-600">{tenancy.tenant.phoneNumber}</p>
            </div>
          </div>
        </section>

        {/* 2. Property & Unit */}
        <section className="mb-10">
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-slate-900 border-b border-slate-300 pb-2 mb-5">
            2. Property &amp; Unit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                Property
              </p>
              <p className="text-lg font-semibold text-slate-900">{activeProperty?.propertyName}</p>
              <p className="text-slate-600">
                {activeProperty?.propertyAddress}, {activeProperty?.city}, {activeProperty?.district}
              </p>
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                Unit
              </p>
              <p className="text-lg font-semibold text-slate-900">{tenancy.unitName}</p>
              <p className="text-slate-600">
                Water Meter: {tenancy.waterMeter || "N/A"} · YAKA Meter: {tenancy.yakaMeter || "N/A"}
              </p>
              <p className="text-slate-600 capitalize">Waste handled by: {tenancy.wasteHandledBy?.toLowerCase()}</p>
            </div>
          </div>
        </section>

        {/* 3. Financial Terms */}
        <section className="mb-10">
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-slate-900 border-b border-slate-300 pb-2 mb-2">
            3. Financial Terms
          </h2>
          <dl className="divide-y divide-slate-200">
            {financialTerms.map((t, i) => (
              <div key={t.label} className="flex items-baseline gap-3 py-3">
                <span className="font-sans text-[11px] text-slate-400 w-8 shrink-0">3.{i + 1}</span>
                <dt className="text-slate-600 flex-1">{t.label}</dt>
                <dd className="font-semibold text-slate-900 text-right">{t.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 4. Additional Clauses */}
        {clauses.length > 0 && (
          <section className="mb-10">
            <h2 className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-slate-900 border-b border-slate-300 pb-2 mb-5">
              4. Additional Clauses
            </h2>
            <div className="divide-y divide-slate-200">
              {clauses.map((pc, i) => (
                <div key={pc.id} className="py-4">
                  <h3 className="font-semibold text-slate-900 mb-1.5">
                    <span className="font-sans text-[11px] text-slate-400 mr-1.5">4.{i + 1}</span>
                    {pc.clause?.title}
                    {pc.isCustom && (
                      <em className="font-sans not-italic text-slate-400 font-normal text-xs ml-2">(custom)</em>
                    )}
                  </h3>
                  <p className="text-slate-700 whitespace-pre-wrap text-justify leading-relaxed">
                    {pc.clause?.body || pc.clause?.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Signatures */}
        <section className="pt-8 border-t-2 border-slate-800">
          <p className="italic text-slate-500 mb-10">
            IN WITNESS WHEREOF, the parties have executed this Agreement as evidenced by the signatures below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {[
              {
                label: "Landlord / Management Signature",
                fullName: `${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`.trim(),
                at: tenancy.mgtSignedAt,
              },
              {
                label: "Tenant Signature",
                fullName: `${tenancy.tenant.firstName} ${tenancy.tenant.lastName}`.trim(),
                at: tenancy.tenantSignedAt,
              },
            ].map(({ label, fullName, at }) =>
              at ? (
                <div key={label}>
                  <p className="font-signature text-3xl text-slate-800 leading-tight border-b border-slate-400 pb-1">
                    {fullName}
                  </p>
                  <p className="font-sans text-xs font-semibold text-slate-700 mt-2">{fullName}</p>
                  <p className="font-sans text-xs text-slate-500">{label}</p>
                  <p className="font-sans text-xs text-emerald-600 font-semibold mt-1">
                    Signed {formattedDate(at)}
                  </p>
                </div>
              ) : (
                <div key={label}>
                  <div className="h-11 border-b border-slate-400" />
                  <p className="font-sans text-xs text-slate-500 mt-2">{label}</p>
                  <p className="font-sans text-[10px] uppercase tracking-wide text-amber-600 font-semibold mt-2">
                    Pending signature
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* Footer */}
        <div className="font-sans mt-12 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            Document generated via est8Ledger · Last updated {formattedDate(tenancy.updatedAt)}
          </p>
        </div>
      </div>
    </SlideOver>
  );
}

export const Route = createFileRoute("/dashboard/tenants/$tenantId")({
  component: TenantProfilePage,
});


function UnpaidMonthsDrawer({
  open,
  onClose,
  dueRent,
  fmtMoney,
}: {
  open: boolean;
  onClose: () => void;
  dueRent: DueRentDetails | null;
  fmtMoney: (n: number) => string;
}) {
  const [render, setRender] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const id = setTimeout(() => setRender(false), 300);
    return () => clearTimeout(id);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!render || !dueRent) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Scrim */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Unpaid months"
        className={`absolute right-0 top-0 h-full w-full sm:max-w-md bg-slate-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3f0ee3] to-indigo-600 text-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Unpaid Months</h2>
              <p className="text-sm text-white/80 mt-0.5">
                {dueRent.tenant.firstName} {dueRent.tenant.lastName} · {dueRent.unitName}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-white/70">Total Outstanding</p>
              <p className="text-2xl font-bold tabular-nums">{fmtMoney(dueRent.overallTotal)}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15">
              {dueRent.unpaidMonths.length} month{dueRent.unpaidMonths.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {dueRent.unpaidMonths.map((m) => (
            <div
              key={`${m.year}-${m.month}`}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {m.monthName} {m.year}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Due {new Date(m.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 shrink-0">
                  <AlertTriangle size={12} />
                  {m.daysLate} day{m.daysLate === 1 ? "" : "s"} late
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rent Due</span>
                  <span className="font-medium text-slate-900 tabular-nums">{fmtMoney(m.rentDue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Late Fee</span>
                  <span className="font-medium text-amber-600 tabular-nums">{fmtMoney(m.lateFee)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-100">
                  <span className="font-medium text-slate-700">Total</span>
                  <span className="font-bold text-red-600 tabular-nums">{fmtMoney(m.total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer totals */}
        <div className="border-t border-slate-200 bg-white p-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Rent</span>
            <span className="font-medium text-slate-900 tabular-nums">{fmtMoney(dueRent.totalRentDue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Late Fees</span>
            <span className="font-medium text-amber-600 tabular-nums">{fmtMoney(dueRent.totalLateFees)}</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Grand Total</span>
            <span className="font-bold text-red-600 text-base tabular-nums">{fmtMoney(dueRent.overallTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TenantProfilePage() {
  const navigate = useNavigate();
  const { tenantId } = Route.useParams();
  const [tenancy, setTenancy] = useState<TenancyAgreement | null>(null);
  const [deposits, setDeposits] = useState<SecurityDepositRecord[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [dueRent, setDueRent] = useState<DueRentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textMessage, setTextMessage] = useState("");
  const [sendingText, setSendingText] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [showAgreementDrawer, setShowAgreementDrawer] = useState(false);

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      const [tenancyRes, depositsRes, paymentsRes, inspectionsRes, dueRentRes] = await Promise.all([
        tenancyService.getTenancy(tenantId),
        securityDepositService.getTenancyDeposit(tenantId),
        rentPaymentsService.getTenancyRentPayments(tenantId),
        inspectionService.getTenancyInspection(tenantId),
        rentPaymentsService.getDueRent(tenantId).catch(() => null),
      ]);

      setTenancy(tenancyRes.data || tenancyRes);
      setDeposits((depositsRes?.data || []) as SecurityDepositRecord[]);
      setPayments(paymentsRes as any[]);
      setInspections((inspectionsRes?.data || inspectionsRes || []) as InspectionItem[]);
      setDueRent(dueRentRes);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tenant data");
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!textMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSendingText(true);
    try {
      // Mock SMS service - replace with actual service when available
      console.log(`Sending SMS to ${tenancy?.tenant.phoneNumber}: ${textMessage}`);
      toast.success("Text sent successfully");
      setShowTextModal(false);
      setTextMessage("");
    } catch (error) {
      toast.error("Failed to send text");
    } finally {
      setSendingText(false);
    }
  };

  const handleTerminateTenancy = async () => {
    if (!tenancy) return;

    setTerminatingId(tenancy.id.toString());
    try {
      await tenancyService.mgtRequestTenancyTermiantion(tenancy.id.toString());
      toast.success("Termination request sent successfully");
      setShowTerminateModal(false);
      // Reload the data
      setTimeout(() => {
        loadTenantData();
      }, 500);
    } catch (error) {
      console.error(error);
      toast.error("Failed to terminate tenancy");
    } finally {
      setTerminatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#3f0ee3]/20 border-t-[#3f0ee3] rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Tenant not found</p>
        </div>
      </div>
    );
  }

  const currency = tenancy.propertyAgreement?.currency || "UGX";
  const monthlyRent = Number(dueRent?.rentAmount ?? tenancy.rentAmount) || 0;
  // Prefer the authoritative due-rent endpoint, fall back to tenancy fields
  const outstandingBalance =
    Number(dueRent?.totalRentDue ?? NaN) ||
    Number(tenancy.outstanding_rent_balance ?? 0) ||
    parseFloat(tenancy.outstandingBalance || "0");
  const totalDeposits = deposits.reduce((sum, d) => sum + parseFloat(d.amount?.toString() || "0"), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // At-a-glance landlord metrics
  const monthsUnpaid =
    dueRent?.unpaidMonths != null
      ? dueRent.unpaidMonths.length
      : monthlyRent > 0 && outstandingBalance > 0
      ? Math.ceil(outstandingBalance / monthlyRent)
      : 0;
  const isUpToDate = outstandingBalance <= 0;
  const depositPaid = !!tenancy.securityDepositPaidAt || deposits.some((d) => d.paymentStatus === "COMPLETED");
  const agreementSigned = !!tenancy.tenantSignedAt && !!tenancy.mgtSignedAt;
  const completedInspections = inspections.filter(
    (i) => i.status === "COMPLETED" || i.status === "APPROVED"
  ).length;
  const inspectionsDone = inspections.length > 0 && completedInspections === inspections.length;

  const recentPayments = [...payments].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );

  const initials = `${tenancy.tenant.firstName?.[0] ?? ""}${tenancy.tenant.lastName?.[0] ?? ""}`.toUpperCase();

  const fmtMoney = (n: number) =>
    `${currency} ${new Intl.NumberFormat("en-US").format(Math.round(n))}`;
  const monthLabel = (m: number, y: number) =>
    new Date(y, m - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate({ to: "/dashboard/tenants" })}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to tenants
      </button>

      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#3f0ee3] to-indigo-600 p-6 text-white shadow-lg shadow-[#3f0ee3]/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/15 text-xl font-bold backdrop-blur shrink-0">
              {initials || "T"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold truncate">
                  {tenancy.tenant.firstName} {tenancy.tenant.lastName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    tenancy.terminatedAt ? "bg-red-500/90 text-white" : "bg-white/20 text-white"
                  }`}
                >
                  {tenancy.terminatedAt ? "Terminated" : "Active"}
                </span>
              </div>
              <p className="text-white/80 text-sm mt-0.5">
                {tenancy.unitName}
                {tenancy.propertyAgreement?.propertyName ? ` · ${tenancy.propertyAgreement.propertyName}` : ""}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                <a href={`mailto:${tenancy.tenant.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Mail size={15} />
                  <span className="truncate">{tenancy.tenant.email}</span>
                </a>
                <a href={`tel:${tenancy.tenant.phoneNumber}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Phone size={15} />
                  {tenancy.tenant.phoneNumber}
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() =>
                navigate({
                  to: "/dashboard/renttracking/record",
                  search: { tenancyId: tenancy.id.toString() },
                })
              }
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#3f0ee3] rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              <Banknote size={18} />
              Record Payment
            </button>
            <button
              onClick={() => setShowTextModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 text-white rounded-lg font-medium hover:bg-white/25 transition-colors backdrop-blur"
            >
              <MessageCircle size={18} />
              Send Text
            </button>
            <button
              onClick={() => navigate({ to: `/dashboard/tenants/edit/${tenancy.id}` })}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 text-white rounded-lg font-medium hover:bg-white/25 transition-colors backdrop-blur"
            >
              <Edit size={18} />
              Edit
            </button>
            <button
              onClick={() => setShowTerminateModal(true)}
              aria-label="Terminate tenancy"
              className="flex items-center justify-center p-2 w-10 h-10 bg-white/15 text-white rounded-lg hover:bg-red-500 transition-colors backdrop-blur"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Financial command center — the single home for all money figures */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Outstanding focal */}
          <div
            className={`p-6 lg:w-80 shrink-0 text-white ${
              outstandingBalance > 0
                ? "bg-gradient-to-br from-red-500 to-rose-600"
                : "bg-gradient-to-br from-emerald-500 to-emerald-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
                <CircleDollarSign size={16} />
                Outstanding Balance
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur">
                {isUpToDate ? "Up to date" : "Overdue"}
              </span>
            </div>
            <p className="mt-3 text-[1.5rem] leading-none font-bold tabular-nums">
              {fmtMoney(outstandingBalance)}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {dueRent && dueRent.totalLateFees > 0
                ? `+ ${fmtMoney(dueRent.totalLateFees)} late fees → ${fmtMoney(dueRent.overallTotal)} total due`
                : isUpToDate
                ? "All rent settled"
                : "Rent outstanding"}
            </p>
            {dueRent && dueRent.unpaidMonths.length > 0 && (
              <button
                onClick={() => setShowUnpaidModal(true)}
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-semibold backdrop-blur transition-colors"
              >
                <ListChecks size={16} />
                See all unpaid months
              </button>
            )}
          </div>

          {/* Secondary metrics — clean divided cells */}
          <div className="flex-1 grid grid-cols-2 xl:grid-cols-4 gap-px bg-slate-100">
            {[
              {
                icon: CalendarClock,
                label: "Months Unpaid",
                value: String(monthsUnpaid),
                valueClass: monthsUnpaid > 0 ? "text-amber-600" : "text-slate-900",
                hint: monthsUnpaid > 0 ? "behind on rent" : "none",
              },
              {
                icon: Coins,
                label: "Late Fees",
                value: fmtMoney(dueRent?.totalLateFees ?? 0),
                valueClass: (dueRent?.totalLateFees ?? 0) > 0 ? "text-amber-600" : "text-slate-900",
                hint: dueRent ? `${dueRent.late_paymeny_percentage}% per month` : undefined,
              },
              {
                icon: Wallet,
                label: "Total Paid",
                value: fmtMoney(totalPayments),
                valueClass: "text-emerald-600",
                hint: `${payments.length} payment${payments.length === 1 ? "" : "s"}`,
              },
              {
                icon: Banknote,
                label: "Monthly Rent",
                value: fmtMoney(monthlyRent),
                valueClass: "text-slate-900",
                hint: tenancy.paymentDueDay ? `due day ${tenancy.paymentDueDay}` : undefined,
              },
            ].map(({ icon: Icon, label, value, valueClass, hint }) => (
              <div key={label} className="bg-white p-5 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Icon size={14} />
                  <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
                </div>
                <p className={`mt-1.5 text-xl font-bold tabular-nums ${valueClass}`}>{value}</p>
                {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — records */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Payments */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#3f0ee3]/10 text-[#3f0ee3]">
                  <Banknote size={18} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recent Payments</h2>
                  <p className="text-xs text-slate-500">
                    {payments.length === 0 ? "No records yet" : `Showing ${Math.min(3, payments.length)} of ${payments.length}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  navigate({
                    to: "/dashboard/renttracking/record",
                    search: { tenancyId: tenancy.id.toString() },
                  })
                }
                className="flex items-center gap-1.5 text-sm font-medium text-[#3f0ee3] hover:text-[#3f0ee3]/80 transition-colors"
              >
                <Banknote size={16} />
                Record
              </button>
            </div>
            {recentPayments.length > 0 ? (
              <div className="space-y-2.5">
                {recentPayments.slice(0, 3).map((payment) => {
                  const badge =
                    payment.status === "CONFIRMED"
                      ? "bg-emerald-100 text-emerald-800"
                      : payment.status === "PENDING"
                      ? "bg-amber-100 text-amber-800"
                      : payment.status === "DISPUTED"
                      ? "bg-red-100 text-red-800"
                      : "bg-slate-100 text-slate-700";
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                          <Banknote size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {monthLabel(payment.monthPaidFor, payment.yearPaidFor)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Recorded {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-slate-900 tabular-nums">
                          {payment.currency || currency} {Number(payment.amount).toLocaleString()}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                <Banknote size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No payments recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">Record this tenant's first payment to start tracking.</p>
              </div>
            )}
          </div>

          {/* Inspections — single home for inspection status + records */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 text-violet-600">
                  <ClipboardCheck size={18} />
                </span>
                <h2 className="text-base font-semibold text-slate-900">Inspections</h2>
              </div>
              {inspections.length > 0 && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    inspectionsDone ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {completedInspections}/{inspections.length} done
                </span>
              )}
            </div>
            {inspections.length > 0 ? (
              <div className="space-y-2.5">
                {inspections.map((inspection) => {
                  const done = inspection.status === "COMPLETED" || inspection.status === "APPROVED";
                  return (
                    <div
                      key={inspection.id}
                      className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${done ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                          <ClipboardCheck size={18} />
                        </span>
                        <div>
                          <p className="font-medium text-slate-900 capitalize">
                            {inspection.type.replace("_", " ").toLowerCase()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(inspection.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          done ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inspection.status || "PENDING"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                <ClipboardCheck size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No inspections yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — status & reference */}
        <div className="space-y-6">
          {/* Security Deposit — single home for deposit status + detail */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700">
                  <ShieldCheck size={18} />
                </span>
                <h2 className="text-base font-semibold text-slate-900">Security Deposit</h2>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  depositPaid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                }`}
              >
                {depositPaid ? "Paid" : "Not paid"}
              </span>
            </div>
            {deposits.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-slate-500">Total held</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{fmtMoney(totalDeposits)}</p>
                </div>
                <div className="space-y-2 pt-1">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900 tabular-nums">
                          {deposit.currency || currency} {Number(deposit.amount).toLocaleString()}
                        </p>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            deposit.paymentStatus === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : deposit.paymentStatus === "REFUNDED"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {deposit.paymentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {deposit.investedAt ? "Invested" : "Not invested"}
                        {deposit.createdAt ? ` · ${new Date(deposit.createdAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle size={16} className="shrink-0" />
                No security deposit on record.
              </div>
            )}
          </div>

          {/* Agreement — single home for signature status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600">
                  <FileSignature size={18} />
                </span>
                <h2 className="text-base font-semibold text-slate-900">Agreement</h2>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  agreementSigned ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {agreementSigned ? "Signed" : "Pending"}
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Manager Signed", at: tenancy.mgtSignedAt },
                { label: "Tenant Signed", at: tenancy.tenantSignedAt },
              ].map(({ label, at }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    {at ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Clock size={16} className="text-amber-500 shrink-0" />
                    )}
                    <p className="text-sm text-slate-700">{label}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {at ? new Date(at).toLocaleDateString() : "Pending"}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAgreementDrawer(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              <FileSignature size={16} />
              View Tenancy Agreement
            </button>
          </div>

          {/* Tenancy Details — reference facts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-500">
                <Home size={18} />
              </span>
              <h2 className="text-base font-semibold text-slate-900">Tenancy Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {[
                { icon: Droplets, label: "Water Meter", value: tenancy.waterMeter || "N/A" },
                { icon: Zap, label: "YAKA Meter", value: tenancy.yakaMeter || "N/A" },
                { icon: Trash2, label: "Waste By", value: tenancy.wasteHandledBy || "N/A" },
                { icon: CalendarClock, label: "Due Day", value: tenancy.paymentDueDay ? `Day ${tenancy.paymentDueDay}` : "N/A" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Icon size={14} />
                    <p className="text-xs font-medium">{label}</p>
                  </div>
                  <p className="mt-1 font-medium text-slate-900 truncate capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Unpaid Months Drawer */}
      <UnpaidMonthsDrawer
        open={showUnpaidModal}
        onClose={() => setShowUnpaidModal(false)}
        dueRent={dueRent}
        fmtMoney={fmtMoney}
      />

      {/* Tenancy Agreement Drawer */}
      <TenancyAgreementDrawer
        open={showAgreementDrawer}
        onClose={() => setShowAgreementDrawer(false)}
        tenancy={tenancy}
        fmtMoney={fmtMoney}
      />

      {/* Send Text Modal */}
      <SlideOver
        open={showTextModal}
        onClose={() => setShowTextModal(false)}
        title="Send Text Message"
        widthClass="max-w-md"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowTextModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendText}
              disabled={sendingText}
              className="px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingText ? "Sending..." : "Send"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">To: {tenancy.tenant.phoneNumber}</p>
          <textarea
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
          />
        </div>
      </SlideOver>

      {/* Terminate Tenancy Modal */}
      <SlideOver
        open={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        title="Terminate Tenancy"
        widthClass="max-w-md"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowTerminateModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTerminateTenancy}
              disabled={terminatingId !== null}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {terminatingId ? "Terminating..." : "Confirm Termination"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900">
              <strong>Warning:</strong> This will send a termination request for this tenancy. The tenant will be notified and the request will require confirmation.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Tenant Name:</p>
            <p className="font-medium text-slate-900">
              {tenancy.tenant.firstName} {tenancy.tenant.lastName}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Unit:</p>
            <p className="font-medium text-slate-900">{tenancy.unitName}</p>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
