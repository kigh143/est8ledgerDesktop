import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../../../store";
import { Edit, FileText, Printer, Share2, AlignLeft, ScrollText, NotebookText } from "lucide-react";
import { toast } from "react-toastify";
import { PageHeader, EmptyState } from "../../../componennts/dashboard/ui";
import type { PropertyClause } from "../../../types";

export const Route = createFileRoute("/dashboard/agreements/")({
  component: AgreementsListPage,
});

function AgreementsListPage() {
  const navigate = useNavigate();
  const { activeProperty } = useAppStore();
  // "body" shows the full clause text; clicking the toggle shows the shorter description.
  const [clauseView, setClauseView] = useState<"body" | "description">("body");

  const clauses = (activeProperty?.propertyClauses || []) as PropertyClause[];

  const terms = activeProperty
    ? [
        { label: "Security Deposit", value: `${activeProperty.securityDepositMonths} months' rent` },
        { label: "Initial Advance", value: `${activeProperty.initialAdvanceMonths} months' rent` },
        {
          label: "Maximum Security Deposit",
          value: activeProperty.maxSecurityDepositMonths
            ? `${activeProperty.maxSecurityDepositMonths} months' rent`
            : "Not specified",
        },
        { label: "Termination Notice Period", value: `${activeProperty.terminationNoticeDays} days` },
        { label: "Rent Increase Notice Period", value: `${activeProperty.rentIncreaseNoticeDays} days` },
        { label: "Eviction Process", value: String(activeProperty.evictionProcess) },
      ]
    : [];

  const formattedDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const buildPlainText = () => {
    if (!activeProperty) return "";
    const lines: string[] = [];
    lines.push("TENANCY AGREEMENT");
    lines.push(`Agreement Ref. #${activeProperty.id} — Prepared ${formattedDate(activeProperty.updatedAt)}`);
    lines.push("");
    lines.push(
      `This Tenancy Agreement sets out the standard terms and conditions governing all tenancies at the property described below, entered into by and between the Landlord/Management named herein and each Tenant who executes a Tenancy Agreement in respect of a unit within the Property.`
    );
    lines.push("");
    lines.push("1. THE PARTIES");
    lines.push(`   The Landlord / Management: ${activeProperty.owner.firstName} ${activeProperty.owner.lastName} (${activeProperty.owner.email})`);
    lines.push(
      `   The Property: ${activeProperty.propertyName}, ${activeProperty.propertyAddress}, ${activeProperty.city}, ${activeProperty.district} — ${activeProperty.propertyType}, ${activeProperty.numberOfUnits} unit(s)`
    );
    lines.push("");
    lines.push("2. TERM & FINANCIAL PROVISIONS");
    terms.forEach((t, i) => lines.push(`   2.${i + 1} ${t.label}: ${t.value}`));
    if (clauses.length) {
      lines.push("");
      lines.push("3. ADDITIONAL CLAUSES");
      clauses.forEach((pc, i) => {
        lines.push(`   3.${i + 1} ${pc.clause?.title ?? "Clause"}${pc.isCustom ? " (Custom)" : ""}`);
        const text = clauseView === "body" ? pc.clause?.body || pc.clause?.description : pc.clause?.description;
        if (text) lines.push(`      ${text}`);
      });
    }
    lines.push("");
    lines.push(`Landlord/Management Signature: ${activeProperty.owner.firstName} ${activeProperty.owner.lastName}  Date: __________`);
    lines.push("Tenant Signature: _______________________  Date: __________");
    return lines.join("\n");
  };

  const handlePrint = () => {
    if (!activeProperty) return;
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      toast.error("Please allow pop-ups to print the agreement");
      return;
    }

    const esc = (s: unknown) =>
      String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const termRows = terms
      .map(
        (t, i) =>
          `<div class="row"><span class="num">2.${i + 1}</span><span class="lbl">${esc(t.label)}</span><span class="val">${esc(t.value)}</span></div>`
      )
      .join("");

    const clauseBlocks = clauses
      .map((pc, i) => {
        const text = clauseView === "body" ? pc.clause?.body || pc.clause?.description : pc.clause?.description;
        return `<div class="clause">
          <h4>3.${i + 1}&nbsp; ${esc(pc.clause?.title)}${pc.isCustom ? ' <em>(Custom)</em>' : ""}</h4>
          <p>${esc(text)}</p>
        </div>`;
      })
      .join("");

    win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>Tenancy Agreement — ${esc(activeProperty.propertyName)}</title>
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
        .witness { font-style: italic; color: #64748b; margin-bottom: 40px; }
        .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 8px; }
        .sig-line { border-bottom: 1px solid #475569; height: 44px; }
        .sig-script { font-family: 'Dancing Script', cursive; font-size: 30px; color: #1e293b; line-height: 1; border-bottom: 1px solid #475569; padding-bottom: 6px; }
        .sig-printed-name { font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 600; color: #334155; margin-top: 8px; }
        .sig-label { font-family: 'Poppins', sans-serif; font-size: 12px; color: #64748b; margin-top: 8px; }
        .date-line { border-bottom: 1px solid #475569; height: 28px; width: 60%; margin-top: 24px; }
        .date-label { font-family: 'Poppins', sans-serif; font-size: 10px; color: #94a3b8; margin-top: 6px; }
        .foot { font-family: 'Poppins', sans-serif; margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-align: center; }
        @media print { body { padding: 32px; } }
      </style></head><body>
      <div class="letterhead">
        <p class="brand">est8Ledger · Property Management</p>
        <h1>Tenancy Agreement</h1>
        <div class="sub">Agreement Ref. #${esc(activeProperty.id)} &nbsp;·&nbsp; Prepared ${esc(formattedDate(activeProperty.updatedAt))}</div>
      </div>

      <p class="preamble">This Tenancy Agreement (the &ldquo;<strong>Agreement</strong>&rdquo;) sets out the standard terms and conditions governing all tenancies at the property described below. It is entered into by and between the Landlord/Management named herein (the &ldquo;<strong>Landlord</strong>&rdquo;) and each Tenant who executes a Tenancy Agreement in respect of a unit within the Property (each, a &ldquo;<strong>Tenant</strong>&rdquo;).</p>

      <section>
        <h2>1. The Parties</h2>
        <div class="grid2">
          <div>
            <p class="doc-label">The Landlord / Management</p>
            <p class="doc-value-lg">${esc(activeProperty.owner.firstName)} ${esc(activeProperty.owner.lastName)}</p>
            <p class="doc-value">${esc(activeProperty.owner.email)}</p>
          </div>
          <div>
            <p class="doc-label">The Property</p>
            <p class="doc-value-lg">${esc(activeProperty.propertyName)}</p>
            <p class="doc-value">${esc(activeProperty.propertyAddress)}, ${esc(activeProperty.city)}, ${esc(activeProperty.district)}</p>
            <p class="doc-value">${esc(activeProperty.propertyType)} · ${esc(activeProperty.numberOfUnits)} unit(s)</p>
          </div>
        </div>
      </section>

      <section>
        <h2>2. Term &amp; Financial Provisions</h2>
        ${termRows}
      </section>

      ${clauses.length ? `<section><h2>3. Additional Clauses</h2>${clauseBlocks}</section>` : ""}

      <section>
        <p class="witness">IN WITNESS WHEREOF, the parties or their authorized representatives have executed this Agreement as of the dates set out below.</p>
        <div class="sigs">
          <div>
            <p class="sig-script">${esc(activeProperty.owner.firstName)} ${esc(activeProperty.owner.lastName)}</p>
            <p class="sig-printed-name">${esc(activeProperty.owner.firstName)} ${esc(activeProperty.owner.lastName)}</p>
            <p class="sig-label">Landlord / Management Signature</p>
            <div class="date-line"></div>
            <p class="date-label">DATE</p>
          </div>
          <div>
            <div class="sig-line"></div>
            <p class="sig-label">Tenant Signature</p>
            <div class="date-line"></div>
            <p class="date-label">DATE</p>
          </div>
        </div>
      </section>

      <div class="foot">Document generated via est8Ledger &nbsp;·&nbsp; Last updated ${esc(formattedDate(activeProperty.updatedAt))}</div>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const handleShare = async () => {
    const text = buildPlainText();
    const title = `Tenancy Agreement — ${activeProperty?.propertyName ?? ""}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success("Agreement copied to clipboard");
      } else {
        toast.info("Sharing is not supported on this device");
      }
    } catch {
      // User dismissed the share sheet — no action needed.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={NotebookText}
        title="Property Agreement"
        subtitle="Lease terms, conditions, and clauses"
        actions={
          <>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              <Share2 size={18} />
              Share
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={() => navigate({ to: "/dashboard/agreements/edit" })}
              className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors"
            >
              <Edit size={18} />
              Edit Terms
            </button>
          </>
        }
      />

      {activeProperty ? (
        <div className="rounded-2xl bg-slate-100 border border-slate-200 p-3 sm:p-8 lg:p-12">
          {/* The document "page" */}
          <div className="mx-auto max-w-3xl bg-white border border-slate-200 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-12px_rgba(15,23,42,0.18)]">
            <div className="font-document p-6 sm:p-12 lg:p-16">
              {/* Letterhead */}
              <div className="text-center pb-8 mb-8 border-b-2 border-slate-800">
                <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-slate-400 font-semibold mb-3">
                  est8Ledger · Property Management
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-wide">
                  Tenancy Agreement
                </h1>
                <p className="font-sans text-xs text-slate-500 mt-3">
                  Agreement Ref. #{activeProperty.id} &nbsp;·&nbsp; Prepared {formattedDate(activeProperty.updatedAt)}
                </p>
              </div>

              {/* Preamble */}
              <p className="text-slate-700 leading-relaxed mb-10 text-justify">
                This Tenancy Agreement (the &ldquo;<strong>Agreement</strong>&rdquo;) sets out the standard
                terms and conditions governing all tenancies at the property described below. It is entered
                into by and between the Landlord/Management named herein (the &ldquo;<strong>Landlord</strong>
                &rdquo;) and each Tenant who executes a Tenancy Agreement in respect of a unit within the
                Property (each, a &ldquo;<strong>Tenant</strong>&rdquo;).
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
                      {activeProperty.owner.firstName} {activeProperty.owner.lastName}
                    </p>
                    <p className="text-slate-600">{activeProperty.owner.email}</p>
                  </div>
                  <div>
                    <p className="font-sans text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                      The Property
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{activeProperty.propertyName}</p>
                    <p className="text-slate-600">
                      {activeProperty.propertyAddress}, {activeProperty.city}, {activeProperty.district}
                    </p>
                    <p className="text-slate-600">
                      {activeProperty.propertyType} · {activeProperty.numberOfUnits} unit(s)
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. Term & Financial Provisions */}
              <section className="mb-10">
                <h2 className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-slate-900 border-b border-slate-300 pb-2 mb-2">
                  2. Term &amp; Financial Provisions
                </h2>
                <dl className="divide-y divide-slate-200">
                  {terms.map((t, i) => (
                    <div key={t.label} className="flex items-baseline gap-3 py-3">
                      <span className="font-sans text-[11px] text-slate-400 w-8 shrink-0">2.{i + 1}</span>
                      <dt className="text-slate-600 flex-1">{t.label}</dt>
                      <dd className="font-semibold text-slate-900 text-right">{t.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* 3. Additional Clauses */}
              {clauses.length > 0 ? (
                <section className="mb-10">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-5">
                    <h2 className="font-sans text-xs font-bold uppercase tracking-[0.1em] text-slate-900">
                      3. Additional Clauses
                    </h2>
                    <button
                      onClick={() => setClauseView((v) => (v === "body" ? "description" : "body"))}
                      className="font-sans flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {clauseView === "body" ? <AlignLeft size={13} /> : <ScrollText size={13} />}
                      {clauseView === "body" ? "Summaries" : "Full text"}
                    </button>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {clauses.map((pc: PropertyClause, i: number) => {
                      const text =
                        clauseView === "body"
                          ? pc.clause?.body || pc.clause?.description
                          : pc.clause?.description;
                      return (
                        <div key={pc.id} className="py-4">
                          <h3 className="font-semibold text-slate-900 mb-1.5">
                            <span className="font-sans text-[11px] text-slate-400 mr-1.5">3.{i + 1}</span>
                            {pc.clause?.title}
                            {pc.isCustom && (
                              <em className="font-sans not-italic text-slate-400 font-normal text-xs ml-2">
                                (custom)
                              </em>
                            )}
                          </h3>
                          <p className="text-slate-700 whitespace-pre-wrap text-justify leading-relaxed">
                            {text || <span className="italic text-slate-400">No content provided.</span>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <div className="font-sans border border-dashed border-slate-200 rounded-xl mb-10">
                  <EmptyState icon={ScrollText} title="No clauses added" message="Add clauses to this agreement from Edit Terms." />
                </div>
              )}

              {/* 4. Signatures */}
              <section className="pt-8 border-t-2 border-slate-800">
                <p className="italic text-slate-500 mb-10">
                  IN WITNESS WHEREOF, the parties or their authorized representatives have executed this
                  Agreement as of the dates set out below.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div>
                    <div className="border-b border-slate-400 pb-1">
                      <p className="font-signature text-3xl text-slate-800 leading-none">
                        {activeProperty.owner.firstName} {activeProperty.owner.lastName}
                      </p>
                    </div>
                    <p className="font-sans text-xs font-semibold text-slate-700 mt-2">
                      {activeProperty.owner.firstName} {activeProperty.owner.lastName}
                    </p>
                    <p className="font-sans text-xs text-slate-500">Landlord / Management Signature</p>
                    <div className="h-7 border-b border-slate-400 mt-6 w-2/3" />
                    <p className="font-sans text-[10px] uppercase tracking-wide text-slate-400 mt-2">Date</p>
                  </div>
                  <div>
                    <div className="h-11 border-b border-slate-400" />
                    <p className="font-sans text-xs text-slate-500 mt-2">Tenant Signature</p>
                    <div className="h-7 border-b border-slate-400 mt-6 w-2/3" />
                    <p className="font-sans text-[10px] uppercase tracking-wide text-slate-400 mt-2">Date</p>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="font-sans mt-12 pt-6 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-400">
                  Document generated via est8Ledger · Last updated {formattedDate(activeProperty.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState icon={FileText} title="No property selected" message="Select a property to view its lease agreement." />
        </div>
      )}
    </div>
  );
}
