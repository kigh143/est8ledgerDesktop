import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "../../../store";
import { Edit, FileText, Printer, Share2, Building2, UserRound, ScrollText, AlignLeft, NotebookText } from "lucide-react";
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
        { label: "Eviction Process", value: String(activeProperty.evictionProcess) },
        { label: "Termination Notice", value: `${activeProperty.terminationNoticeDays} days` },
        { label: "Security Deposit", value: `${activeProperty.securityDepositMonths} months rent` },
        { label: "Rent Increase Notice", value: `${activeProperty.rentIncreaseNoticeDays} days` },
        { label: "Initial Advance", value: `${activeProperty.initialAdvanceMonths} months` },
        {
          label: "Max Security Deposit",
          value: activeProperty.maxSecurityDepositMonths
            ? `${activeProperty.maxSecurityDepositMonths} months`
            : "Not specified",
        },
      ]
    : [];

  const buildPlainText = () => {
    if (!activeProperty) return "";
    const lines: string[] = [];
    lines.push(`PROPERTY LEASE AGREEMENT`);
    lines.push(`Agreement ID: #${activeProperty.id}`);
    lines.push("");
    lines.push(`PROPERTY`);
    lines.push(`  Name: ${activeProperty.propertyName}`);
    lines.push(`  Address: ${activeProperty.propertyAddress}, ${activeProperty.city}, ${activeProperty.district}`);
    lines.push(`  Type: ${activeProperty.propertyType}`);
    lines.push(`  Units: ${activeProperty.numberOfUnits}`);
    lines.push("");
    lines.push(`LANDLORD / MANAGEMENT`);
    lines.push(`  Name: ${activeProperty.owner.firstName} ${activeProperty.owner.lastName}`);
    lines.push(`  Email: ${activeProperty.owner.email}`);
    lines.push(`  Currency: ${activeProperty.currency}`);
    lines.push("");
    lines.push(`TERMS & CONDITIONS`);
    terms.forEach((t) => lines.push(`  ${t.label}: ${t.value}`));
    if (clauses.length) {
      lines.push("");
      lines.push(`CLAUSES`);
      clauses.forEach((pc, i) => {
        lines.push(`  ${i + 1}. ${pc.clause?.title ?? "Clause"}${pc.isCustom ? " (Custom)" : ""}`);
        const text = clauseView === "body" ? pc.clause?.body || pc.clause?.description : pc.clause?.description;
        if (text) lines.push(`     ${text}`);
      });
    }
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
      .map((t) => `<tr><td class="label">${esc(t.label)}</td><td>${esc(t.value)}</td></tr>`)
      .join("");

    const clauseBlocks = clauses
      .map((pc, i) => {
        const text = clauseView === "body" ? pc.clause?.body || pc.clause?.description : pc.clause?.description;
        return `<div class="clause">
          <h4>${i + 1}. ${esc(pc.clause?.title)}${pc.isCustom ? ' <span class="tag">Custom</span>' : ""}</h4>
          <p>${esc(text)}</p>
        </div>`;
      })
      .join("");

    win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>Lease Agreement — ${esc(activeProperty.propertyName)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 40px; line-height: 1.6; }
        .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid #3f0ee3; padding-bottom: 16px; margin-bottom: 24px; }
        .head h1 { margin: 0; font-size: 26px; }
        .head .sub { color:#64748b; font-size: 13px; margin-top: 4px; }
        .brand { color:#3f0ee3; font-weight: 800; font-size: 18px; }
        h3 { text-transform: uppercase; letter-spacing: .05em; font-size: 12px; color:#64748b; margin: 24px 0 10px; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        table { width:100%; border-collapse: collapse; }
        td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; vertical-align: top; }
        td.label { color:#64748b; width: 50%; }
        .clause { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .clause h4 { margin: 0 0 4px; font-size: 15px; }
        .clause p { margin: 0; color:#334155; font-size: 14px; white-space: pre-wrap; }
        .tag { background:#ede9fe; color:#6d28d9; font-size: 10px; padding: 2px 6px; border-radius: 4px; vertical-align: middle; }
        .foot { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color:#94a3b8; font-size: 12px; text-align:center; }
        @media print { body { margin: 24px; } }
      </style></head><body>
      <div class="head">
        <div>
          <h1>Property Lease Agreement</h1>
          <div class="sub">Agreement ID: #${esc(activeProperty.id)} · Generated ${new Date().toLocaleDateString()}</div>
        </div>
        <div class="brand">est8Ledger</div>
      </div>
      <div class="grid">
        <div>
          <h3>Property Details</h3>
          <table>
            <tr><td class="label">Property Name</td><td>${esc(activeProperty.propertyName)}</td></tr>
            <tr><td class="label">Address</td><td>${esc(activeProperty.propertyAddress)}, ${esc(activeProperty.city)}, ${esc(activeProperty.district)}</td></tr>
            <tr><td class="label">Property Type</td><td>${esc(activeProperty.propertyType)}</td></tr>
            <tr><td class="label">Number of Units</td><td>${esc(activeProperty.numberOfUnits)}</td></tr>
          </table>
        </div>
        <div>
          <h3>Landlord / Management</h3>
          <table>
            <tr><td class="label">Name</td><td>${esc(activeProperty.owner.firstName)} ${esc(activeProperty.owner.lastName)}</td></tr>
            <tr><td class="label">Email</td><td>${esc(activeProperty.owner.email)}</td></tr>
            <tr><td class="label">Currency</td><td>${esc(activeProperty.currency)}</td></tr>
          </table>
        </div>
      </div>
      <h3>Terms &amp; Conditions</h3>
      <table>${termRows}</table>
      ${clauses.length ? `<h3>Clauses</h3>${clauseBlocks}` : ""}
      <div class="foot">Last updated: ${new Date(activeProperty.updatedAt).toLocaleDateString()}</div>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const handleShare = async () => {
    const text = buildPlainText();
    const title = `Lease Agreement — ${activeProperty?.propertyName ?? ""}`;
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Document banner */}
          <div className="bg-gradient-to-r from-[#3f0ee3] to-indigo-600 px-8 py-7 text-white flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Property Lease Agreement</h2>
              <p className="text-white/80 text-sm mt-1">
                Agreement ID: #{activeProperty.id} · Updated {new Date(activeProperty.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <FileText size={44} className="text-white/40" />
          </div>

          <div className="p-8">
            {/* Property & landlord */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                  <Building2 size={16} className="text-[#3f0ee3]" /> Property Details
                </h3>
                <div className="space-y-3">
                  <Field label="Property Name" value={activeProperty.propertyName} emphasize />
                  <Field
                    label="Address"
                    value={`${activeProperty.propertyAddress}, ${activeProperty.city}, ${activeProperty.district}`}
                  />
                  <Field label="Property Type" value={activeProperty.propertyType} />
                  <Field label="Number of Units" value={activeProperty.numberOfUnits} />
                </div>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                  <UserRound size={16} className="text-[#3f0ee3]" /> Landlord / Management
                </h3>
                <div className="space-y-3">
                  <Field
                    label="Name"
                    value={`${activeProperty.owner.firstName} ${activeProperty.owner.lastName}`}
                    emphasize
                  />
                  <Field label="Email" value={activeProperty.owner.email} />
                  <Field label="Currency" value={activeProperty.currency} />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="mb-8 pb-8 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-6">Terms &amp; Conditions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {terms.map((t) => (
                  <div key={t.label} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t.label}</p>
                    <p className="font-semibold text-slate-900">{t.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Clauses */}
            {clauses.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    Clauses <span className="text-slate-400 normal-case font-normal">· {clauses.length}</span>
                  </h3>
                  <button
                    onClick={() => setClauseView((v) => (v === "body" ? "description" : "body"))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    {clauseView === "body" ? <AlignLeft size={16} /> : <ScrollText size={16} />}
                    {clauseView === "body" ? "Show summaries" : "Show full text"}
                  </button>
                </div>
                <div className="space-y-3">
                  {clauses.map((pc: PropertyClause) => {
                    const text =
                      clauseView === "body"
                        ? pc.clause?.body || pc.clause?.description
                        : pc.clause?.description;
                    return (
                      <div key={pc.id} className="border border-slate-200 rounded-xl p-4 hover:border-[#3f0ee3]/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <h4 className="font-semibold text-slate-900">{pc.clause?.title}</h4>
                          {pc.isCustom && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded shrink-0">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm whitespace-pre-wrap">
                          {text || <span className="italic text-slate-400">No content provided.</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-xl">
                <EmptyState icon={ScrollText} title="No clauses added" message="Add clauses to this agreement from Edit Terms." />
              </div>
            )}

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-400 text-center">
                Last updated: {new Date(activeProperty.updatedAt).toLocaleDateString()}
              </p>
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

function Field({ label, value, emphasize }: { label: string; value: React.ReactNode; emphasize?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={emphasize ? "text-lg font-semibold text-slate-900" : "text-slate-700"}>{value}</p>
    </div>
  );
}
