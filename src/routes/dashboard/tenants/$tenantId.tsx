import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Banknote, CalendarClock, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, ClipboardCheck, Clock,
  Download, FileText, Hourglass, LogOut, Mail, MessageCircle, MessageSquareText, MoreHorizontal, Pencil,
  Phone, Plus, Undo2, UserX, XCircle,
} from "lucide-react";
import tenancyService from "../../../services/tenancyService";
import { securityDepositService } from "../../../services/securityDepositService";
import { rentPaymentsService } from "../../../services/rentPaymentsService";
import type { DueRentDetails } from "../../../services/rentPaymentsService";
import { inspectionService } from "../../../services/inspectionService";
import SlideOver from "../../../componennts/SlideOver";
import ReleaseDepositSheet from "../../../componennts/deposits/ReleaseDepositSheet";
import { Badge, ConfirmDialog, DetailRow, EmptyState, type Tone } from "../../../componennts/dashboard/ui";
import { useAppStore } from "../../../store";
import { toast } from "react-toastify";
import type { TenancyAgreement, SecurityDepositRecord, RentPayment, InspectionItem, PropertyClause } from "../../../types";
import { getNetworkError } from "../../../utils";
import {
  canReleaseDeposit, getDepositStage, getReleaseState, isLandlordHeld, type DepositStage,
} from "../../../utils/depositStatus";

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
          <button onClick={handleDownload} className="btn btn-primary">
            <Download size={16} />
            Download PDF
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


function UnpaidMonthsSheet({
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
  if (!dueRent) return null;
  const count = dueRent.unpaidMonths.length;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Unpaid months"
      subtitle={`${dueRent.tenant.firstName} ${dueRent.tenant.lastName} · Unit ${dueRent.unitName}`}
      footer={
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Rent</span>
            <span className="tabular-nums text-slate-900">{fmtMoney(dueRent.totalRentDue)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Late fees</span>
            <span className="tabular-nums text-slate-900">{fmtMoney(dueRent.totalLateFees)}</span>
          </div>
          <div className="flex justify-between border-t border-black/[0.06] pt-2">
            <span className="font-semibold text-slate-900">Total due</span>
            <span className="text-[17px] font-semibold text-[#d70015] tabular-nums">{fmtMoney(dueRent.overallTotal)}</span>
          </div>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        {count} month{count === 1 ? "" : "s"} unpaid, oldest first.
      </p>
      <ul className="divide-y divide-black/[0.06] rounded-2xl ring-1 ring-black/[0.06]">
        {dueRent.unpaidMonths.map((m) => (
          <li key={`${m.year}-${m.month}`} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">
                {m.monthName} {m.year}
              </p>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Due {formatShort(m.dueDate)} · {m.daysLate} day{m.daysLate === 1 ? "" : "s"} late
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold text-slate-900 tabular-nums">{fmtMoney(m.total)}</p>
              {m.lateFee > 0 && (
                <p className="text-xs text-[#c93400] tabular-nums">incl. {fmtMoney(m.lateFee)} late fee</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </SlideOver>
  );
}

const formatShort = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const paymentStatus: Record<RentPayment["status"], { label: string; tone: Tone }> = {
  CONFIRMED: { label: "Confirmed", tone: "emerald" },
  PENDING: { label: "Pending", tone: "amber" },
  DISPUTED: { label: "Disputed", tone: "red" },
  CANCELLED: { label: "Cancelled", tone: "slate" },
};

/** Small popover menu anchored to a trigger button. Closes on outside click and Escape. */
function Menu({ trigger, label, children }: { trigger: ReactNode; label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="btn btn-secondary"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 origin-top-right rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-black/[0.08] backdrop-blur-xl animate-fade-up"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, children, onSelect, href, destructive, hint }: {
  icon: typeof Mail;
  children: ReactNode;
  onSelect?: () => void;
  href?: string;
  destructive?: boolean;
  hint?: string;
}) {
  const cls = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${
    destructive ? "text-[#d70015] hover:bg-[#ff3b30]/[0.07]" : "text-slate-800 hover:bg-slate-100"
  }`;
  const body = (
    <>
      <Icon size={17} className={destructive ? "" : "text-slate-500"} />
      <span className="min-w-0 flex-1">
        <span className="block">{children}</span>
        {hint && <span className="block truncate text-xs font-normal text-slate-500">{hint}</span>}
      </span>
    </>
  );
  return href ? (
    <a role="menuitem" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" onClick={onSelect} className={cls}>
      {body}
    </a>
  ) : (
    <button role="menuitem" onClick={onSelect} className={cls}>
      {body}
    </button>
  );
}

function SectionCard({ title, meta, action, children }: { title: string; meta?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
          {meta}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TenantProfileSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading tenant">
      <div className="h-4 w-20 rounded bg-slate-200" />
      <div className="flex items-center gap-5">
        <div className="h-20 w-20 rounded-full bg-slate-200" />
        <div className="space-y-3">
          <div className="h-7 w-56 rounded bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-200" />
        </div>
      </div>
      <div className="h-36 rounded-2xl bg-slate-200/70" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 rounded-2xl bg-slate-200/70 lg:col-span-2" />
        <div className="h-72 rounded-2xl bg-slate-200/70" />
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
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [confirmCancelTermination, setConfirmCancelTermination] = useState(false);
  const [busy, setBusy] = useState(false);
  const [releaseKey, setReleaseKey] = useState(0);
  const [releasing, setReleasing] = useState(false);

  const loadTenantData = useCallback(async () => {
    try {
      const [tenancyRes, depositsRes, paymentsRes, inspectionsRes, dueRentRes] = await Promise.all([
        tenancyService.getTenancy(tenantId),
        securityDepositService.getTenancyDeposit(tenantId),
        rentPaymentsService.getTenancyRentPayments(tenantId),
        inspectionService.getTenancyInspection(tenantId),
        rentPaymentsService.getDueRent(tenantId).catch(() => null),
      ]);

      setTenancy(tenancyRes.data || tenancyRes);
      setDeposits((depositsRes?.data || depositsRes || []) as SecurityDepositRecord[]);
      setPayments((paymentsRes || []) as RentPayment[]);
      setInspections((inspectionsRes?.data || inspectionsRes || []) as InspectionItem[]);
      setDueRent(dueRentRes);
    } catch (error) {
      toast.error(getNetworkError(error));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  if (loading) return <TenantProfileSkeleton />;

  if (!tenancy) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <UserX size={26} strokeWidth={1.5} />
        </span>
        <p className="text-[17px] font-semibold text-slate-900">We couldn't find this tenant</p>
        <p className="mt-1 text-sm text-slate-500">They may have been removed, or the link is out of date.</p>
        <Link to="/dashboard/tenants" className="btn btn-secondary mt-5">Back to tenants</Link>
      </div>
    );
  }

  const tenant = tenancy.tenant;
  const fullName = `${tenant.firstName ?? ""} ${tenant.lastName ?? ""}`.trim() || tenant.email;
  const firstName = tenant.firstName || "The tenant";
  const initials = `${tenant.firstName?.[0] ?? ""}${tenant.lastName?.[0] ?? ""}`.toUpperCase() || "T";
  const currency = tenancy.propertyAgreement?.currency || "UGX";
  const fmtMoney = (n: number) => `${currency} ${new Intl.NumberFormat("en-US").format(Math.round(n))}`;
  const monthLabel = (m: number, y: number) =>
    new Date(y, m - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Money
  const monthlyRent = Number(dueRent?.rentAmount ?? tenancy.rentAmount) || 0;
  // Prefer the authoritative due-rent endpoint, fall back to tenancy fields
  const outstandingBalance =
    Number(dueRent?.totalRentDue ?? NaN) ||
    Number(tenancy.outstanding_rent_balance ?? 0) ||
    parseFloat(tenancy.outstandingBalance || "0");
  const lateFees = dueRent?.totalLateFees ?? 0;
  const totalDue = dueRent?.overallTotal ?? outstandingBalance;
  const monthsUnpaid =
    dueRent?.unpaidMonths != null
      ? dueRent.unpaidMonths.length
      : monthlyRent > 0 && outstandingBalance > 0
      ? Math.ceil(outstandingBalance / monthlyRent)
      : 0;
  const owes = totalDue > 0;
  const totalPaid = payments
    .filter((p) => p.status === "CONFIRMED")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingPayments = payments.filter((p) => p.status === "PENDING").length;
  const sortedPayments = [...payments].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const visiblePayments = showAllPayments ? sortedPayments : sortedPayments.slice(0, 5);

  // Setup checklist
  const agreementSigned = !!tenancy.tenantSignedAt && !!tenancy.mgtSignedAt;
  const activeDeposits = deposits.filter((d) => getDepositStage(d) !== "REJECTED");
  const depositApproved = activeDeposits.some((d) => getDepositStage(d) === "COMPLETED");
  const depositPaid = !!tenancy.securityDepositPaidAt || depositApproved || activeDeposits.length > 0;
  const moveIn = inspections.find((i) => i.type === "MOVE_IN");
  const moveInDone = !!moveIn && (moveIn.status === "COMPLETED" || moveIn.status === "APPROVED");
  const setupSteps = [
    { label: "Agreement signed", done: agreementSigned, detail: agreementSigned ? formatShort(tenancy.tenantSignedAt) : tenancy.tenantSignedAt ? "Waiting on you" : `Waiting on ${firstName}` },
    { label: "Deposit paid", done: depositApproved, partial: depositPaid && !depositApproved, detail: depositApproved ? "Approved" : depositPaid ? "Awaiting approval" : "Not paid yet" },
    { label: "Move-in inspection", done: moveInDone, partial: !!moveIn && !moveInDone, detail: moveInDone ? formatShort(moveIn?.createdAt) : moveIn ? "Awaiting approval" : "Not started" },
  ];
  const stepsDone = setupSteps.filter((s) => s.done).length;

  // Termination (mirrors the mobile app)
  const isActive = !tenancy.terminatedAt;
  const noticeDays = tenancy.propertyAgreement?.terminationNoticeDays || 30;
  const tenantSideAt = tenancy.tenantRequestedAt || tenancy.terminationApprovedByTenantAt;
  const canManageTermination =
    isActive && !tenancy.terminationApprovedByTenantAt && !(tenancy.repairBreakdowns?.length > 0);
  const awaitingTenantApproval = canManageTermination && !!tenancy.mgtRequestedAt;

  // Deposit refund
  const landlordDeposit = deposits.find((d) => isLandlordHeld(d) && getDepositStage(d) === "COMPLETED") ?? null;
  const canRelease = !!landlordDeposit && canReleaseDeposit(landlordDeposit, tenancy as unknown as Record<string, unknown>);
  const releaseState = landlordDeposit ? getReleaseState(landlordDeposit) : null;

  const phoneDigits = (tenant.phoneNumber || "").replace(/[^\d]/g, "");
  const openRelease = () => {
    setReleaseKey((k) => k + 1);
    setReleasing(true);
  };
  const releaseAction = canRelease && (
    <button onClick={openRelease} className="btn btn-primary min-h-8 px-3.5 text-[13px]">
      {releaseState === "DISPUTED" ? "Release deposit again" : "Release deposit"}
    </button>
  );
  const goRecordPayment = () =>
    navigate({ to: "/dashboard/renttracking/record", search: { tenancyId: tenancy.id.toString() } });

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await loadTenantData();
      return true;
    } catch (error) {
      toast.error(getNetworkError(error));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleRequestTermination = async () => {
    const ok = await runAction(
      () => tenancyService.mgtRequestTenancyTermiantion(tenancy.id.toString()),
      `Termination request sent to ${firstName}`
    );
    if (ok) setConfirmTerminate(false);
  };

  const handleCancelTermination = async () => {
    const ok = await runAction(
      () => tenancyService.updateTenancy({ id: tenancy.id, mgtRequestedAt: null }),
      "Termination request withdrawn"
    );
    if (ok) setConfirmCancelTermination(false);
  };

  return (
    <div className="space-y-8">
      <Link
        to="/dashboard/tenants"
        className="-ml-1.5 inline-flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[15px] font-medium text-[#3f0ee3] hover:bg-[#3f0ee3]/[0.06]"
      >
        <ChevronLeft size={18} strokeWidth={2.25} />
        Tenants
      </Link>

      {/* Identity */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between animate-fade-up">
        <div className="flex min-w-0 items-center gap-5">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3f0ee3] to-[#7c5cff] text-2xl font-semibold text-white shadow-[0_8px_24px_-8px_rgb(63_14_227/0.5)]">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-[30px] font-bold leading-tight tracking-[-0.028em] text-slate-900 capitalize">
                {fullName}
              </h1>
              {!isActive ? (
                <Badge tone="slate">Ended</Badge>
              ) : tenantSideAt || tenancy.mgtRequestedAt ? (
                <Badge tone="amber">Ending</Badge>
              ) : (
                <Badge tone="emerald">Active</Badge>
              )}
            </div>
            <p className="mt-1 text-[15px] text-slate-500">
              Unit {tenancy.unitName}
              {tenancy.propertyAgreement?.propertyName ? ` · ${tenancy.propertyAgreement.propertyName}` : ""}
              {` · Tenant since ${new Date(tenancy.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              {tenant.email && (
                <a href={`mailto:${tenant.email}`} className="inline-flex items-center gap-1.5 hover:text-[#3f0ee3]">
                  <Mail size={14} className="text-slate-400" />
                  {tenant.email}
                </a>
              )}
              {tenant.phoneNumber && (
                <a href={`tel:${tenant.phoneNumber}`} className="inline-flex items-center gap-1.5 hover:text-[#3f0ee3] tabular-nums">
                  <Phone size={14} className="text-slate-400" />
                  {tenant.phoneNumber}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Menu label="Contact tenant" trigger={<><MessageCircle size={16} /> Contact</>}>
            {(close) => (
              <>
                {phoneDigits ? (
                  <>
                    <MenuItem icon={MessageCircle} href={`https://wa.me/${phoneDigits}`} onSelect={close} hint={tenant.phoneNumber}>WhatsApp</MenuItem>
                    <MenuItem icon={MessageSquareText} href={`sms:${tenant.phoneNumber}`} onSelect={close}>Text message</MenuItem>
                    <MenuItem icon={Phone} href={`tel:${tenant.phoneNumber}`} onSelect={close}>Call</MenuItem>
                  </>
                ) : (
                  <p className="px-3 py-2 text-xs text-slate-500">No phone number on file.</p>
                )}
                {tenant.email && (
                  <MenuItem icon={Mail} href={`mailto:${tenant.email}`} onSelect={close} hint={tenant.email}>Email</MenuItem>
                )}
              </>
            )}
          </Menu>
          <Link to="/dashboard/tenants/edit/$tenantId" params={{ tenantId: tenancy.id.toString() }} className="btn btn-secondary">
            <Pencil size={15} /> Edit
          </Link>
          <Menu label="More actions" trigger={<MoreHorizontal size={18} />}>
            {(close) => (
              <>
                <MenuItem icon={FileText} onSelect={() => { close(); setShowAgreement(true); }}>View agreement</MenuItem>
                {canRelease && (
                  <MenuItem
                    icon={Undo2}
                    onSelect={() => {
                      close();
                      openRelease();
                    }}
                  >
                    {releaseState === "DISPUTED" ? "Release deposit again" : "Release deposit"}
                  </MenuItem>
                )}
                {canManageTermination && (
                  <>
                    <div className="my-1 h-px bg-black/[0.06]" />
                    {tenancy.mgtRequestedAt ? (
                      <MenuItem icon={XCircle} onSelect={() => { close(); setConfirmCancelTermination(true); }}>
                        Cancel termination request
                      </MenuItem>
                    ) : (
                      <MenuItem icon={LogOut} destructive onSelect={() => { close(); setConfirmTerminate(true); }}>
                        End tenancy…
                      </MenuItem>
                    )}
                  </>
                )}
              </>
            )}
          </Menu>
          {isActive && (
            <button onClick={goRecordPayment} className="btn btn-primary">
              <Plus size={16} /> Record payment
            </button>
          )}
        </div>
      </header>

      {/* Termination status */}
      {!isActive ? (
        <Banner tone="slate" icon={LogOut} title={`Tenancy ended on ${formattedDate(tenancy.terminatedAt)}`} action={releaseAction}>
          {releaseState && releaseState !== "HELD"
            ? releaseState === "RECEIVED"
              ? `${firstName} confirmed they received their deposit back.`
              : releaseState === "RELEASED"
              ? `You released the deposit. Waiting for ${firstName} to confirm it arrived.`
              : `${firstName} disputed the deposit refund. Adjust the deductions and release it again.`
            : canRelease
            ? `Return ${firstName}'s security deposit, minus any deductions.`
            : undefined}
        </Banner>
      ) : tenantSideAt ? (
        <Banner tone="amber" icon={CalendarClock} title={`Move-out due by ${formattedDate(addDays(tenantSideAt, noticeDays))}`} action={releaseAction}>
          {tenancy.tenantRequestedAt ? `${firstName} asked to end the tenancy` : `${firstName} agreed to end the tenancy`} on{" "}
          {formattedDate(tenantSideAt)}, with a {noticeDays}-day notice period.
        </Banner>
      ) : awaitingTenantApproval ? (
        <Banner
          tone="amber"
          icon={Hourglass}
          title={`Waiting for ${firstName} to accept`}
          action={
            <button onClick={() => setConfirmCancelTermination(true)} className="btn btn-secondary min-h-8 px-3 text-[13px]">
              Withdraw request
            </button>
          }
        >
          You asked to end this tenancy on {formattedDate(tenancy.mgtRequestedAt)}. {firstName} has been notified.
        </Banner>
      ) : null}

      {/* Rent summary */}
      <section className="card overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          <div className="border-b border-black/[0.06] p-6 lg:border-b-0 lg:border-r">
            <p className="text-[13px] font-medium text-slate-500">{owes ? "Balance due" : "Rent"}</p>
            <p
              className={`mt-2 text-[36px] font-semibold leading-none tracking-tight tabular-nums ${
                owes ? "text-[#d70015]" : "text-slate-900"
              }`}
            >
              {owes ? fmtMoney(totalDue) : "Paid up"}
            </p>
            <p className="mt-2.5 text-sm text-slate-500">
              {owes
                ? `${monthsUnpaid} month${monthsUnpaid === 1 ? "" : "s"} behind${lateFees > 0 ? ` · includes ${fmtMoney(lateFees)} in late fees` : ""}`
                : `Nothing owed. Next rent is due on day ${tenancy.paymentDueDay ?? "—"}.`}
            </p>
            {dueRent && dueRent.unpaidMonths.length > 0 && (
              <button
                onClick={() => setShowUnpaid(true)}
                className="mt-4 inline-flex items-center gap-0.5 text-sm font-semibold text-[#3f0ee3] hover:underline"
              >
                View unpaid months
                <ChevronRight size={16} />
              </button>
            )}
          </div>
          <dl className="grid grid-cols-1 divide-y divide-black/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { label: "Monthly rent", value: fmtMoney(monthlyRent), hint: tenancy.paymentDueDay ? `Due on day ${tenancy.paymentDueDay}` : "No due day set" },
              {
                label: "Late fees",
                value: fmtMoney(lateFees),
                hint: dueRent?.late_paymeny_percentage ? `${dueRent.late_paymeny_percentage}% per late month` : `${tenancy.gracePeriodDays ?? 0}-day grace period`,
              },
              { label: "Paid to date", value: fmtMoney(totalPaid), hint: pendingPayments > 0 ? `Confirmed only · ${pendingPayments} pending` : `${payments.length} payment${payments.length === 1 ? "" : "s"} confirmed` },
            ].map((f) => (
              <div key={f.label} className="p-6">
                <dt className="text-[13px] font-medium text-slate-500">{f.label}</dt>
                <dd className="mt-2 text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">{f.value}</dd>
                <dd className="mt-1 text-xs text-slate-500">{f.hint}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Setup checklist */}
      <section aria-label="Tenancy setup">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold text-slate-900">Tenancy setup</h2>
          <span className="text-sm text-slate-500 tabular-nums">
            {stepsDone === setupSteps.length ? "Complete" : `${stepsDone} of ${setupSteps.length} done`}
          </span>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {setupSteps.map((step) => (
            <li
              key={step.label}
              className={`flex items-center gap-3 rounded-2xl p-4 ring-1 ${
                step.done ? "bg-white ring-black/[0.06]" : "border border-dashed border-black/[0.12] ring-0"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-[#34c759] text-white"
                    : step.partial
                    ? "bg-[#ff9500]/15 text-[#c93400]"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.done ? <Check size={16} strokeWidth={3} /> : step.partial ? <Clock size={15} strokeWidth={2.25} /> : <Circle size={14} strokeWidth={2.25} />}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${step.done ? "text-slate-900" : "text-slate-700"}`}>{step.label}</span>
                <span className="block truncate text-[13px] text-slate-500">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="Payments"
            meta={payments.length > 0 && <span className="text-sm text-slate-400 tabular-nums">{payments.length}</span>}
            action={
              isActive && (
                <button onClick={goRecordPayment} className="btn btn-tinted min-h-8 px-3 text-[13px]">
                  <Plus size={15} /> Record
                </button>
              )
            }
          >
            {sortedPayments.length > 0 ? (
              <>
                <ul className="-mx-2 divide-y divide-black/[0.06]">
                  {visiblePayments.map((payment) => {
                    const st = paymentStatus[payment.status] ?? { label: payment.status, tone: "slate" as Tone };
                    return (
                      <li key={payment.id} className="flex items-center justify-between gap-4 px-2 py-3.5">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{monthLabel(payment.monthPaidFor, payment.yearPaidFor)}</p>
                          <p className="text-[13px] text-slate-500">
                            Recorded {formatShort(payment.createdAt)}
                            {payment.paymentReference ? ` · Ref ${payment.paymentReference}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <Badge tone={st.tone}>{st.label}</Badge>
                          <span className="w-32 text-right font-semibold text-slate-900 tabular-nums">
                            {fmtMoney(Number(payment.amount) || 0)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {sortedPayments.length > 5 && (
                  <button
                    onClick={() => setShowAllPayments((v) => !v)}
                    className="mt-3 text-sm font-semibold text-[#3f0ee3] hover:underline"
                  >
                    {showAllPayments ? "Show fewer" : `Show all ${sortedPayments.length} payments`}
                  </button>
                )}
              </>
            ) : (
              <EmptyState
                icon={Banknote}
                title="No payments yet"
                message={`Record ${firstName}'s rent when it arrives to keep their balance accurate.`}
                action={isActive && <button onClick={goRecordPayment} className="btn btn-tinted"><Plus size={15} /> Record payment</button>}
              />
            )}
          </SectionCard>

          <SectionCard title="Inspections">
            {inspections.length > 0 ? (
              <ul className="-mx-2 divide-y divide-black/[0.06]">
                {inspections.map((inspection) => {
                  const done = inspection.status === "COMPLETED" || inspection.status === "APPROVED";
                  return (
                    <li key={inspection.id}>
                      <Link
                        to="/dashboard/inspections/$inspectionId"
                        params={{ inspectionId: inspection.id.toString() }}
                        className="group flex items-center gap-4 rounded-xl px-2 py-3.5 hover:bg-slate-50"
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-[#34c759]/[0.12] text-[#248a3d]" : "bg-slate-100 text-slate-500"}`}>
                          <ClipboardCheck size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-900">
                            {inspection.type === "MOVE_IN" ? "Move-in inspection" : "Move-out inspection"}
                          </span>
                          <span className="block text-[13px] text-slate-500">{formatShort(inspection.createdAt)}</span>
                        </span>
                        <Badge tone={done ? "emerald" : "amber"}>{done ? "Approved" : "Awaiting approval"}</Badge>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No inspections yet"
                message="A move-in inspection records the unit's condition, so deposit deductions are fair at move-out."
              />
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Security deposit"
            action={
              <Link to="/dashboard/securitydeposits" className="text-sm font-semibold text-[#3f0ee3] hover:underline">
                Review
              </Link>
            }
          >
            {deposits.length > 0 ? (
              <ul className="space-y-3">
                {deposits.map((deposit) => {
                  const meta = depositStageMeta[getDepositStage(deposit)];
                  const release = getReleaseState(deposit);
                  return (
                    <li key={deposit.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">
                          {fmtMoney(Number(deposit.amount) || 0)}
                        </p>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>
                      <p className="mt-1 text-[13px] text-slate-500">
                        {isLandlordHeld(deposit) ? "Paid to you" : "Held by est8Ledger"}
                        {deposit.createdAt ? ` · ${formatShort(deposit.createdAt)}` : ""}
                      </p>
                      {release !== "HELD" && (
                        <p className="mt-2 border-t border-black/[0.06] pt-2 text-[13px] text-slate-600">
                          {release === "RECEIVED"
                            ? `Refunded ${fmtMoney(Number(deposit.releasedAmount) || 0)}`
                            : release === "RELEASED"
                            ? `Released ${fmtMoney(Number(deposit.releasedAmount) || 0)}, awaiting confirmation`
                            : `Refund disputed${deposit.releaseDisputeReason ? `: “${deposit.releaseDisputeReason}”` : ""}`}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                {Number(tenancy.securityDeposit) > 0
                  ? `${firstName} hasn't paid their ${fmtMoney(Number(tenancy.securityDeposit))} deposit yet.`
                  : "No security deposit is required for this tenancy."}
              </p>
            )}
          </SectionCard>

          <SectionCard title="Agreement" meta={<Badge tone={agreementSigned ? "emerald" : "amber"}>{agreementSigned ? "Signed" : "Awaiting signature"}</Badge>}>
            <ul className="space-y-3">
              {[
                { label: "You", at: tenancy.mgtSignedAt },
                { label: firstName, at: tenancy.tenantSignedAt },
              ].map(({ label, at }) => (
                <li key={label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-700">
                    {at ? <CheckCircle2 size={17} className="text-[#34c759]" /> : <Clock size={17} className="text-[#ff9500]" />}
                    {label}
                  </span>
                  <span className={at ? "text-slate-900" : "text-slate-400"}>{at ? `Signed ${formatShort(at)}` : "Not signed"}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowAgreement(true)} className="btn btn-secondary mt-5 w-full">
              <FileText size={16} /> View agreement
            </button>
          </SectionCard>

          <SectionCard title="Unit details">
            <div className="-my-3 divide-y divide-black/[0.06]">
              <DetailRow label="Unit">{tenancy.unitName}</DetailRow>
              <DetailRow label="Water meter">{tenancy.waterMeter || "—"}</DetailRow>
              <DetailRow label="YAKA meter">{tenancy.yakaMeter || "—"}</DetailRow>
              <DetailRow label="Waste collection">
                {tenancy.wasteHandledBy === "TENANT" ? "Tenant" : tenancy.wasteHandledBy === "LANDLORD" ? "You" : "—"}
              </DetailRow>
              <DetailRow label="Grace period">{tenancy.gracePeriodDays ?? 0} days</DetailRow>
              <DetailRow label="Notice period">{noticeDays} days</DetailRow>
            </div>
          </SectionCard>
        </div>
      </div>

      <UnpaidMonthsSheet open={showUnpaid} onClose={() => setShowUnpaid(false)} dueRent={dueRent} fmtMoney={fmtMoney} />

      <TenancyAgreementDrawer open={showAgreement} onClose={() => setShowAgreement(false)} tenancy={tenancy} fmtMoney={fmtMoney} />

      {landlordDeposit && (
        <ReleaseDepositSheet
          key={releaseKey}
          open={releasing}
          deposit={{ ...landlordDeposit, currency: landlordDeposit.currency || currency }}
          tenantName={firstName}
          onClose={() => setReleasing(false)}
          onReleased={async () => {
            setReleasing(false);
            await loadTenantData();
          }}
        />
      )}

      <ConfirmDialog
        open={confirmTerminate}
        title="End this tenancy?"
        message={
          <>
            {firstName} will be asked to accept. With the {noticeDays}-day notice period, the tenancy ends by{" "}
            <strong className="text-slate-900">{formattedDate(addDays(new Date().toISOString(), noticeDays))}</strong>.
          </>
        }
        confirmLabel="Send request"
        destructive
        busy={busy}
        onConfirm={handleRequestTermination}
        onClose={() => setConfirmTerminate(false)}
      />

      <ConfirmDialog
        open={confirmCancelTermination}
        title="Withdraw termination request?"
        message={`The tenancy stays active and ${firstName} is no longer asked to move out.`}
        confirmLabel="Withdraw"
        cancelLabel="Keep request"
        busy={busy}
        onConfirm={handleCancelTermination}
        onClose={() => setConfirmCancelTermination(false)}
      />
    </div>
  );
}

const depositStageMeta: Record<DepositStage, { label: string; tone: Tone }> = {
  AWAITING_LANDLORD: { label: "Needs your confirmation", tone: "amber" },
  AWAITING_EST8LEDGER: { label: "With est8Ledger", tone: "blue" },
  COMPLETED: { label: "Approved", tone: "emerald" },
  REJECTED: { label: "Rejected", tone: "red" },
};

function Banner({ tone, icon: Icon, title, action, children }: {
  tone: "amber" | "slate";
  icon: typeof Mail;
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      className={`flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center ${
        tone === "amber" ? "bg-[#ff9500]/[0.09]" : "bg-slate-100"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ${
          tone === "amber" ? "text-[#c93400]" : "text-slate-500"
        }`}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-slate-900">{title}</p>
        {children && <p className="mt-0.5 text-sm text-slate-600">{children}</p>}
      </div>
      {action}
    </div>
  );
}
