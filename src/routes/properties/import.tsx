import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useRef, useState, type DragEvent } from "react";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import PropertiesLayout from "../../componennts/PropertiesLayout";
import { Badge } from "../../componennts/dashboard/ui";
import importService, { type ImportIssue, type ImportReport } from "../../services/importService";
import { useAppStore } from "../../store";
import { getNetworkError } from "../../utils";
import {
  downloadCsvTemplate,
  downloadExcelTemplate,
  ImportFileError,
  readImportFile,
  SHEETS,
  sheetByKey,
  type ParsedFile,
  type SheetKey,
} from "../../utils/importTemplate";

export const Route = createFileRoute("/properties/import")({
  component: ImportPage,
  beforeLoad: () => {
    if (!useAppStore.getState().token) throw redirect({ to: "/login" });
  },
});

type Stage =
  | { name: "idle" }
  | { name: "reading" | "checking"; file: File }
  | { name: "pickSheet"; file: File }
  | { name: "checked"; file: File; parsed: ParsedFile; report: ImportReport }
  | { name: "importing"; file: File; parsed: ParsedFile; report: ImportReport }
  | { name: "done"; report: ImportReport };

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

const columnLabel = (sheet: SheetKey, key?: string) =>
  key ? sheetByKey(sheet).columns.find((c) => c.key === key)?.label ?? key : undefined;

function ImportPage() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const [dragging, setDragging] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);

  const check = async (file: File, csvSheet?: SheetKey) => {
    setStage({ name: "reading", file });
    let parsed: Awaited<ReturnType<typeof readImportFile>>;
    try {
      parsed = await readImportFile(file, csvSheet);
    } catch (error) {
      toast.error(error instanceof ImportFileError ? error.message : "This file couldn't be read.");
      setStage({ name: "idle" });
      return;
    }
    if (parsed.csvSheet === null) {
      setStage({ name: "pickSheet", file });
      return;
    }
    if (Object.keys(parsed.payload).length === 0) {
      toast.error(
        parsed.skippedExamples > 0
          ? "Only the example rows are filled in. Add your own records and upload again."
          : "No records found. Fill in at least one sheet of the template."
      );
      setStage({ name: "idle" });
      return;
    }
    setStage({ name: "checking", file });
    try {
      const report = await importService.validate(parsed.payload);
      setStage({ name: "checked", file, parsed, report });
    } catch (error) {
      toast.error(getNetworkError(error));
      setStage({ name: "idle" });
    }
  };

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) check(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onFiles(e.dataTransfer.files);
  };

  const runImport = async () => {
    if (stage.name !== "checked") return;
    setStage({ ...stage, name: "importing" });
    try {
      const report = await importService.commit(stage.parsed.payload);
      setStage({ name: "done", report });
      router.invalidate();
    } catch (error) {
      // The server re-checks before writing; a 400 carries a fresh report.
      const report = isAxiosError(error) ? (error.response?.data?.report as ImportReport | undefined) : undefined;
      if (report) {
        setStage({ ...stage, name: "checked", report });
        toast.error("Some rows changed since the check. Nothing was imported.");
      } else {
        setStage({ ...stage, name: "checked" });
        toast.error(getNetworkError(error));
      }
    }
  };

  const getTemplate = async () => {
    setTemplateBusy(true);
    try {
      await downloadExcelTemplate();
    } catch {
      toast.error("The template couldn't be created. Try again.");
    } finally {
      setTemplateBusy(false);
    }
  };

  const busy = stage.name === "reading" || stage.name === "checking";

  return (
    <PropertiesLayout
      pageTitle="Import data"
      subTitle="Bring your existing properties, tenants and records into est8Ledger in one go."
      action={
        <Link to="/properties/import-agreement" className="btn btn-secondary">
          <FileText size={16} />
          From an agreement PDF
        </Link>
      }
    >
      <input
        ref={input}
        type="file"
        accept=".xlsx,.csv"
        hidden
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {stage.name === "done" ? (
        <Done report={stage.report} onAgain={() => setStage({ name: "idle" })} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            {stage.name === "checked" || stage.name === "importing" ? (
              <Review
                fileName={stage.file.name}
                parsed={stage.parsed}
                report={stage.report}
                importing={stage.name === "importing"}
                onImport={runImport}
                onReplace={() => input.current?.click()}
              />
            ) : stage.name === "pickSheet" ? (
              <PickSheet file={stage.file} onPick={(key) => check(stage.file, key)} onCancel={() => setStage({ name: "idle" })} />
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
                disabled={busy}
                className={`card flex w-full flex-col items-center justify-center gap-3 px-6 py-16 text-center transition-colors ${
                  dragging ? "bg-[#3f0ee3]/[0.04] ring-2 ring-[#3f0ee3]" : "hover:bg-slate-50"
                }`}
              >
                {busy ? (
                  <>
                    <Loader2 size={30} className="animate-spin text-[#3f0ee3]" />
                    <p className="text-[17px] font-semibold text-slate-900">
                      {stage.name === "reading" ? "Reading your file…" : "Checking every row…"}
                    </p>
                    <p className="text-sm text-slate-500">{stage.file.name}</p>
                  </>
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3f0ee3]/[0.08] text-[#3f0ee3]">
                      <Upload size={24} strokeWidth={1.75} />
                    </span>
                    <p className="text-[17px] font-semibold text-slate-900">Drop your filled-in template here</p>
                    <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                      Excel workbook (.xlsx) with any of the five sheets, or a CSV for one of them. Nothing is saved until
                      you've reviewed the check.
                    </p>
                    <span className="btn btn-primary mt-2">Choose file</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Templates */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section className="card p-5">
              <h2 className="text-[15px] font-semibold text-slate-900">Start from the template</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                One workbook with a sheet for each kind of record, example rows and an Instructions sheet. Rows link by
                property name and unit.
              </p>
              <button onClick={getTemplate} disabled={templateBusy} className="btn btn-tinted mt-4 w-full">
                {templateBusy ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                Download Excel template
              </button>
              <p className="mt-5 text-xs font-medium text-slate-500">Or one CSV per sheet</p>
              <ul className="mt-1.5 divide-y divide-black/[0.06]">
                {SHEETS.map((sheet) => (
                  <li key={sheet.key}>
                    <button
                      onClick={() => downloadCsvTemplate(sheet.key)}
                      className="group flex w-full items-center justify-between gap-3 py-2.5 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900">{sheet.name}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {sheet.columns.filter((c) => c.required).map((c) => c.label).join(", ")}
                        </span>
                      </span>
                      <Download size={15} className="shrink-0 text-slate-400 group-hover:text-[#3f0ee3]" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl bg-slate-100/80 p-5 text-[13px] leading-relaxed text-slate-600">
              <p className="font-semibold text-slate-900">What happens to imported tenants</p>
              <p className="mt-1">
                They get a tenant account but no welcome email, and their agreement is marked as signed on the move-in
                date. Rent history is recorded as confirmed, with no receipts or messages sent.
              </p>
            </section>
          </aside>
        </div>
      )}
    </PropertiesLayout>
  );
}

function PickSheet({ file, onPick, onCancel }: { file: File; onPick: (key: SheetKey) => void; onCancel: () => void }) {
  return (
    <section className="card p-6">
      <h2 className="text-[17px] font-semibold text-slate-900">What's in {file.name}?</h2>
      <p className="mt-1 text-sm text-slate-500">The column headings don't match a template sheet. Pick the kind of records it holds.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {SHEETS.map((sheet) => (
          <button key={sheet.key} onClick={() => onPick(sheet.key)} className="rounded-xl p-4 text-left ring-1 ring-black/[0.08] hover:bg-slate-50 hover:ring-[#3f0ee3]/40">
            <span className="block text-sm font-semibold text-slate-900">{sheet.name}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{sheet.columns.filter((c) => c.required).map((c) => c.label).join(", ")}</span>
          </button>
        ))}
      </div>
      <button onClick={onCancel} className="btn btn-secondary mt-5">
        Choose another file
      </button>
    </section>
  );
}

function Review({
  fileName,
  parsed,
  report,
  importing,
  onImport,
  onReplace,
}: {
  fileName: string;
  parsed: ParsedFile;
  report: ImportReport;
  importing: boolean;
  onImport: () => void;
  onReplace: () => void;
}) {
  const sheets = SHEETS.filter((s) => (report.sheets[s.key]?.total ?? 0) > 0);
  const errorCount = sheets.reduce((n, s) => n + report.sheets[s.key].errors.length, 0);
  const warningCount = sheets.reduce((n, s) => n + report.sheets[s.key].warnings.length, 0);
  const total = sheets.reduce((n, s) => n + report.sheets[s.key].total, 0);
  const { summary } = report;

  return (
    <>
      {/* File + verdict */}
      <section className="card overflow-hidden">
        <div className="flex items-center gap-3.5 px-6 py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#34c759]/[0.12] text-[#248a3d]">
            <FileSpreadsheet size={22} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-slate-900">{fileName}</p>
            <p className="text-[13px] text-slate-500">
              {plural(total, "row")} across {plural(sheets.length, "sheet")}
              {parsed.skippedExamples > 0 && ` · ${plural(parsed.skippedExamples, "example row")} skipped`}
            </p>
          </div>
          <button onClick={onReplace} disabled={importing} className="btn btn-secondary">
            <RotateCcw size={15} />
            Replace file
          </button>
        </div>
        <div
          className={`flex items-start gap-3 border-t px-6 py-4 text-sm ${
            report.ok ? "border-[#34c759]/20 bg-[#34c759]/[0.06] text-[#1d6b30]" : "border-[#ff3b30]/15 bg-[#ff3b30]/[0.05] text-[#a5000f]"
          }`}
        >
          {report.ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <XCircle size={18} className="mt-0.5 shrink-0" />}
          <p>
            {report.ok
              ? "Every row checks out. Review what will be created, then import."
              : `${plural(errorCount, "problem")} to fix. Nothing has been imported — correct the file and upload it again.`}
          </p>
        </div>
      </section>

      {/* Per sheet */}
      <section className="card divide-y divide-black/[0.06]">
        {sheets.map((sheet) => {
          const r = report.sheets[sheet.key];
          return (
            <div key={sheet.key} className="px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[15px] font-semibold text-slate-900">{sheet.name}</p>
                {r.errors.length > 0 ? (
                  <Badge tone="red">{plural(r.errors.length, "problem")}</Badge>
                ) : (
                  <Badge tone="emerald">{plural(r.total, "row")} ready</Badge>
                )}
              </div>
              {parsed.ignoredColumns[sheet.key] && (
                <p className="mt-1 text-xs text-slate-500">
                  Ignored columns: {parsed.ignoredColumns[sheet.key]!.join(", ")}
                </p>
              )}
              {(r.errors.length > 0 || r.warnings.length > 0) && (
                <IssueTable sheet={sheet.key} errors={r.errors} warnings={r.warnings} />
              )}
            </div>
          );
        })}
      </section>

      {report.ok && (
        <section className="card p-6">
          <h2 className="text-[17px] font-semibold text-slate-900">What will be created</h2>
          <ul className="mt-3 space-y-2 text-[15px] text-slate-700">
            {summary.properties > 0 && <li>{plural(summary.properties, "property", "properties")}</li>}
            {summary.tenants > 0 && (
              <li>
                {plural(summary.tenants, "tenancy", "tenancies")}
                <span className="text-slate-500">
                  {" "}
                  — {plural(summary.newTenantAccounts, "new tenant account")}
                  {summary.existingTenantAccounts > 0 && `, ${plural(summary.existingTenantAccounts, "existing account")} reused`}. No
                  emails are sent.
                </span>
              </li>
            )}
            {summary.rentPayments > 0 && (
              <li>
                {plural(summary.rentPayments, "rent payment")} <span className="text-slate-500">recorded as confirmed</span>
              </li>
            )}
            {summary.expenses > 0 && <li>{plural(summary.expenses, "expense")}</li>}
            {summary.repairs > 0 && <li>{plural(summary.repairs, "repair record")}</li>}
          </ul>
          {warningCount > 0 && (
            <p className="mt-4 flex items-start gap-2 text-sm text-[#b25000]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {plural(warningCount, "row")} flagged above will still be imported. Check they're right first.
            </p>
          )}
          <button onClick={onImport} disabled={importing} className="btn btn-primary btn-lg mt-6 w-full sm:w-auto">
            {importing && <Loader2 size={17} className="animate-spin" />}
            {importing ? "Importing…" : `Import ${plural(total, "record")}`}
          </button>
        </section>
      )}
    </>
  );
}

function IssueTable({ sheet, errors, warnings }: { sheet: SheetKey; errors: ImportIssue[]; warnings: ImportIssue[] }) {
  const [showAll, setShowAll] = useState(false);
  const issues = [
    ...errors.map((e) => ({ ...e, kind: "error" as const })),
    ...warnings.map((w) => ({ ...w, kind: "warning" as const })),
  ].sort((a, b) => a.row - b.row || (a.kind === "error" ? -1 : 1));
  const visible = showAll ? issues : issues.slice(0, 8);

  return (
    <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-black/[0.06]">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="w-16 px-3 py-2 font-medium">Row</th>
            <th className="w-40 px-3 py-2 font-medium">Column</th>
            <th className="px-3 py-2 font-medium">Problem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.05]">
          {visible.map((issue, i) => (
            <tr key={i}>
              <td className="px-3 py-2 tabular-nums text-slate-900">{issue.row}</td>
              <td className="px-3 py-2 text-slate-600">{columnLabel(sheet, issue.column) ?? "—"}</td>
              <td className={`px-3 py-2 ${issue.kind === "error" ? "text-[#d70015]" : "text-[#b25000]"}`}>
                {issue.kind === "warning" && "Check: "}
                {issue.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {issues.length > 8 && (
        <button onClick={() => setShowAll((v) => !v)} className="w-full border-t border-black/[0.06] py-2 text-[13px] font-medium text-[#3f0ee3] hover:bg-slate-50">
          {showAll ? "Show fewer" : `Show all ${issues.length}`}
        </button>
      )}
    </div>
  );
}

function Done({ report, onAgain }: { report: ImportReport; onAgain: () => void }) {
  const { summary } = report;
  const lines = [
    summary.properties && plural(summary.properties, "property", "properties"),
    summary.tenants && plural(summary.tenants, "tenant"),
    summary.rentPayments && plural(summary.rentPayments, "rent payment"),
    summary.expenses && plural(summary.expenses, "expense"),
    summary.repairs && plural(summary.repairs, "repair record"),
  ].filter(Boolean);

  return (
    <section className="card mx-auto max-w-xl px-6 py-14 text-center animate-fade-up">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#34c759]/[0.12] text-[#248a3d]">
        <CheckCircle2 size={32} strokeWidth={1.75} />
      </span>
      <h2 className="mt-5 text-[22px] font-semibold text-slate-900">Import complete</h2>
      <p className="mt-2 text-[15px] text-slate-600">{lines.join(" · ")}</p>
      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        <Link to="/properties" className="btn btn-primary">
          Go to properties
        </Link>
        <button onClick={onAgain} className="btn btn-secondary">
          Import another file
        </button>
      </div>
    </section>
  );
}
