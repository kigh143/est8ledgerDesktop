import type { Workbook, Worksheet, CellValue } from "exceljs";
import { saveBlob } from "./download";

/**
 * One definition of the import workbook, used to build the downloadable
 * templates and to read uploaded files. Column keys match the backend
 * (est8ledger_bo apps/api/src/imports/import-rows.ts).
 */
export type SheetKey = "properties" | "tenants" | "rentPayments" | "expenses" | "repairs";

export type ColumnDef = {
  key: string;
  label: string;
  required?: boolean;
  /** Shown on the Instructions sheet. */
  help: string;
  choices?: string[];
  /** Keep as text in Excel (phone numbers lose their leading 0 otherwise). */
  text?: boolean;
  width?: number;
};

export type SheetDef = {
  key: SheetKey;
  name: string;
  summary: string;
  columns: ColumnDef[];
  examples: Record<string, string | number>[];
};

export type ImportRow = Record<string, string | number | null> & { _row: number };
export type ImportPayload = Partial<Record<SheetKey, ImportRow[]>>;

const yesNo = ["Yes", "No"];

export const SHEETS: SheetDef[] = [
  {
    key: "properties",
    name: "Properties",
    summary: "Buildings you manage. Leave out properties that are already in est8Ledger — other sheets can still refer to them by name.",
    columns: [
      { key: "property_name", label: "Property name", required: true, help: "How you refer to the property. Other sheets use this exact name.", width: 24 },
      { key: "address", label: "Address", required: true, help: "Street address or plot number.", width: 30 },
      { key: "city", label: "City", required: true, help: "City or town.", width: 14 },
      { key: "district", label: "District", required: true, help: "District or county.", width: 14 },
      { key: "property_type", label: "Property type", help: "Residential, Commercial or Mixed-Use.", choices: ["Residential", "Commercial", "Mixed-Use"], width: 15 },
      { key: "number_of_units", label: "Number of units", help: "Total lettable units.", width: 16 },
      { key: "currency", label: "Currency", help: "3-letter code, e.g. UGX. Defaults to your country's currency.", width: 11 },
      { key: "termination_notice_days", label: "Termination notice days", help: "Days of notice either side gives to end a tenancy.", width: 24 },
      { key: "security_deposit_months", label: "Security deposit months", help: "Months of rent held as deposit. 0 if none.", width: 24 },
      { key: "rent_increase_notice_days", label: "Rent increase notice days", help: "Days of notice before rent goes up.", width: 24 },
      { key: "advance_months", label: "Advance months", help: "Months of rent paid upfront at move-in.", width: 16 },
      { key: "eviction_process", label: "Eviction process", help: "Court, Tribunal or Other.", choices: ["Court", "Tribunal", "Other"], width: 16 },
    ],
    examples: [
      {
        property_name: "Kololo Heights",
        address: "Plot 14, Acacia Avenue",
        city: "Kampala",
        district: "Kampala",
        property_type: "Residential",
        number_of_units: 8,
        currency: "UGX",
        termination_notice_days: 60,
        security_deposit_months: 2,
        rent_increase_notice_days: 90,
        advance_months: 3,
        eviction_process: "Court",
      },
    ],
  },
  {
    key: "tenants",
    name: "Tenants",
    summary: "People living in your units today. They get a tenant account with no welcome email, and their agreement is marked as signed on the move-in date.",
    columns: [
      { key: "property_name", label: "Property name", required: true, help: "Must match a property on the Properties sheet or one you already have.", width: 22 },
      { key: "unit", label: "Unit", required: true, help: "Unit name or number, e.g. A1. Rent payments and repairs link to this.", width: 9 },
      { key: "first_name", label: "First name", required: true, help: "Tenant's first name.", width: 14 },
      { key: "last_name", label: "Last name", required: true, help: "Tenant's last name.", width: 14 },
      { key: "email", label: "Email", required: true, help: "Used to sign in. If it already has a tenant account, that account is reused.", width: 26 },
      { key: "phone", label: "Phone", required: true, help: "Local (0772 123456) or international (+256 772 123456).", text: true, width: 16 },
      { key: "monthly_rent", label: "Monthly rent", required: true, help: "Amount in the property's currency, numbers only.", width: 14 },
      { key: "rent_due_day", label: "Rent due day", help: "Day of the month rent is due (1–31).", width: 13 },
      { key: "move_in_date", label: "Move in date", required: true, help: "YYYY-MM-DD or DD/MM/YYYY. Rent is tracked from this date.", text: true, width: 14 },
      { key: "security_deposit", label: "Security deposit", help: "Deposit amount agreed.", width: 16 },
      { key: "deposit_paid", label: "Deposit paid", help: "Yes if the deposit has been paid.", choices: yesNo, width: 13 },
      { key: "outstanding_balance", label: "Outstanding balance", help: "Rent owed today from before this import. 0 if paid up.", width: 19 },
      { key: "grace_period_days", label: "Grace period days", help: "Days after the due day before a late fee applies.", width: 17 },
      { key: "late_fee_type", label: "Late fee type", help: "Fixed (an amount) or Percentage (of the rent).", choices: ["Fixed", "Percentage"], width: 14 },
      { key: "late_fee", label: "Late fee", help: "The amount, or the percentage if the type is Percentage.", width: 10 },
      { key: "electricity_meter", label: "Electricity meter", help: "Yaka / prepaid meter number.", text: true, width: 17 },
      { key: "water_meter", label: "Water meter", help: "Water meter number.", text: true, width: 13 },
      { key: "waste_handled_by", label: "Waste handled by", help: "Tenant or Landlord.", choices: ["Tenant", "Landlord"], width: 16 },
    ],
    examples: [
      {
        property_name: "Kololo Heights",
        unit: "A1",
        first_name: "Sarah",
        last_name: "Namuli",
        email: "sarah.namuli@example.com",
        phone: "0772 123456",
        monthly_rent: 1200000,
        rent_due_day: 5,
        move_in_date: "2026-03-01",
        security_deposit: 2400000,
        deposit_paid: "Yes",
        outstanding_balance: 0,
        grace_period_days: 3,
        late_fee_type: "Percentage",
        late_fee: 5,
        electricity_meter: "04271839921",
        water_meter: "NWSC-88213",
        waste_handled_by: "Tenant",
      },
    ],
  },
  {
    key: "rentPayments",
    name: "Rent payments",
    summary: "Rent already received, one row per tenant per month. Recorded as confirmed, with no receipts or messages sent.",
    columns: [
      { key: "property_name", label: "Property name", required: true, help: "The tenant's property.", width: 22 },
      { key: "unit", label: "Unit", required: true, help: "The tenant's unit.", width: 9 },
      { key: "month", label: "Month", required: true, help: "The month the rent covers: 1–12 or a name such as March.", width: 11 },
      { key: "year", label: "Year", required: true, help: "The year the rent covers, e.g. 2026.", width: 9 },
      { key: "amount", label: "Amount", required: true, help: "Amount received for that month.", width: 13 },
      { key: "paid_date", label: "Paid date", help: "When it was paid. Used to work out late days.", text: true, width: 13 },
      { key: "reference", label: "Reference", help: "Mobile money or bank reference.", width: 18 },
    ],
    examples: [
      { property_name: "Kololo Heights", unit: "A1", month: "March", year: 2026, amount: 1200000, paid_date: "2026-03-04", reference: "MP2603041122" },
      { property_name: "Kololo Heights", unit: "A1", month: "April", year: 2026, amount: 1200000, paid_date: "2026-04-05", reference: "MP2604051309" },
    ],
  },
  {
    key: "expenses",
    name: "Expenses",
    summary: "Money spent on a property.",
    columns: [
      { key: "property_name", label: "Property name", required: true, help: "The property the money was spent on.", width: 22 },
      { key: "category", label: "Category", required: true, help: "Maintenance, Repairs, Utilities, Insurance, Cleaning or Other.", choices: ["Maintenance", "Repairs", "Utilities", "Insurance", "Cleaning", "Other"], width: 14 },
      { key: "amount", label: "Amount", required: true, help: "Whole amount, numbers only.", width: 12 },
      { key: "description", label: "Description", help: "What it was for.", width: 30 },
      { key: "date", label: "Date", help: "When it was spent.", text: true, width: 12 },
      { key: "status", label: "Status", help: "Approved (default) or Pending.", choices: ["Approved", "Pending"], width: 11 },
      { key: "paid", label: "Paid", help: "Yes (default) or No.", choices: yesNo, width: 8 },
      { key: "notes", label: "Notes", help: "Anything else worth keeping.", width: 24 },
    ],
    examples: [
      { property_name: "Kololo Heights", category: "Utilities", amount: 180000, description: "Water bill, common areas", date: "2026-04-30", status: "Approved", paid: "Yes", notes: "" },
    ],
  },
  {
    key: "repairs",
    name: "Repairs",
    summary: "Repair and maintenance work, past or ongoing.",
    columns: [
      { key: "property_name", label: "Property name", required: true, help: "The property.", width: 22 },
      { key: "unit", label: "Unit", help: "Leave blank for common areas.", width: 9 },
      { key: "title", label: "Title", help: "Short name, e.g. Leaking kitchen tap.", width: 22 },
      { key: "description", label: "Description", required: true, help: "What was wrong and what was done.", width: 32 },
      { key: "responsible", label: "Responsible", help: "Who pays: Landlord (default) or Tenant.", choices: ["Landlord", "Tenant"], width: 13 },
      { key: "priority", label: "Priority", help: "High, Medium (default) or Low.", choices: ["High", "Medium", "Low"], width: 10 },
      { key: "status", label: "Status", help: "Completed (default), Pending, Assigned or Running.", choices: ["Completed", "Pending", "Assigned", "Running"], width: 12 },
      { key: "cost", label: "Cost", help: "Whole amount spent.", width: 10 },
      { key: "paid", label: "Paid", help: "Yes or No (default).", choices: yesNo, width: 8 },
      { key: "date", label: "Date", help: "When it was reported or done.", text: true, width: 12 },
    ],
    examples: [
      { property_name: "Kololo Heights", unit: "A1", title: "Leaking kitchen tap", description: "Replaced the tap washer and seal.", responsible: "Landlord", priority: "Medium", status: "Completed", cost: 45000, paid: "Yes", date: "2026-04-12" },
    ],
  },
];

export const sheetByKey = (key: SheetKey) => SHEETS.find((s) => s.key === key)!;

const normalize = (value: string) => value.toLowerCase().replace(/\(.*?\)|\*/g, "").replace(/[^a-z0-9]/g, "");

/** Map a header cell to a column key, accepting the label ("Move in date *") or the key ("move_in_date"). */
const columnForHeader = (sheet: SheetDef, header: string) => {
  const n = normalize(header);
  return sheet.columns.find((c) => normalize(c.key) === n || normalize(c.label) === n)?.key;
};

/** Which sheet a set of CSV headers belongs to, by how many required columns it carries. */
export const detectSheet = (headers: string[]): SheetKey | null => {
  let best: { key: SheetKey; score: number } | null = null;
  for (const sheet of SHEETS) {
    const keys = new Set(headers.map((h) => columnForHeader(sheet, h)).filter(Boolean));
    const required = sheet.columns.filter((c) => c.required);
    const score = required.filter((c) => keys.has(c.key)).length / required.length + keys.size * 0.01;
    if (!best || score > best.score) best = { key: sheet.key, score };
  }
  return best && best.score >= 0.6 ? best.key : null;
};

/** Sheet names in an uploaded workbook, matched loosely ("Rent Payments", "rent_payments"). */
const sheetForName = (name: string) => SHEETS.find((s) => normalize(s.name) === normalize(name) || normalize(s.key) === normalize(name));

const isExampleRow = (sheet: SheetDef, row: Record<string, string | number | null>) =>
  sheet.examples.some((example) =>
    sheet.columns.every((c) => String(example[c.key] ?? "").trim().toLowerCase() === String(row[c.key] ?? "").trim().toLowerCase())
  );

export type ParsedFile = {
  payload: ImportPayload;
  counts: Partial<Record<SheetKey, number>>;
  skippedExamples: number;
  unknownSheets: string[];
  /** Headers that didn't match any column, per sheet. */
  ignoredColumns: Partial<Record<SheetKey, string[]>>;
};

const collect = (
  sheet: SheetDef,
  headers: string[],
  rows: { row: number; cells: (string | number | null)[] }[],
  out: ParsedFile
) => {
  const keys = headers.map((h) => (h ? columnForHeader(sheet, h) : undefined));
  const ignored = headers.filter((h, i) => h && !keys[i]);
  if (ignored.length) out.ignoredColumns[sheet.key] = ignored;

  const list: ImportRow[] = [];
  for (const { row, cells } of rows) {
    const record: ImportRow = { _row: row };
    let filled = false;
    keys.forEach((key, i) => {
      if (!key) return;
      const value = cells[i];
      record[key] = value === "" ? null : value ?? null;
      if (value !== null && value !== undefined && String(value).trim() !== "") filled = true;
    });
    if (!filled) continue;
    if (isExampleRow(sheet, record)) {
      out.skippedExamples += 1;
      continue;
    }
    list.push(record);
  }
  if (list.length) {
    out.payload[sheet.key] = [...(out.payload[sheet.key] ?? []), ...list];
    out.counts[sheet.key] = (out.counts[sheet.key] ?? 0) + list.length;
  }
};

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

const cellToValue = (value: CellValue): string | number | null => {
  if (value == null) return null;
  if (value instanceof Date) {
    // Excel dates carry no zone; exceljs builds them at UTC midnight.
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  if (typeof value === "number" || typeof value === "string") return typeof value === "string" ? value.trim() : value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((t) => t.text).join("").trim();
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value) return cellToValue(value.result as CellValue);
    if ("error" in value) return null;
  }
  return String(value);
};

const readWorksheet = (ws: Worksheet) => {
  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = String(cellToValue(cell.value) ?? "");
  });
  const rows: { row: number; cells: (string | number | null)[] }[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const cells = headers.map((_, i) => cellToValue(row.getCell(i + 1).value));
    rows.push({ row: rowNumber, cells });
  });
  return { headers, rows };
};

/** RFC 4180 CSV: quoted fields, escaped quotes, commas and newlines inside quotes. */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

export class ImportFileError extends Error {}

/** Read an .xlsx workbook (any of the five sheets) or a single-sheet .csv. */
export async function readImportFile(file: File, csvSheet?: SheetKey): Promise<ParsedFile & { csvSheet?: SheetKey | null }> {
  const out: ParsedFile = { payload: {}, counts: {}, skippedExamples: 0, unknownSheets: [], ignoredColumns: {} };
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const table = parseCsv(await file.text());
    if (table.length < 2) throw new ImportFileError("The CSV has no rows under the header.");
    const [headers, ...body] = table;
    const key = csvSheet ?? detectSheet(headers);
    if (!key) return { ...out, csvSheet: null };
    collect(
      sheetByKey(key),
      headers,
      body.map((cells, i) => ({ row: i + 2, cells: cells.map((c) => c.trim()) })),
      out
    );
    return { ...out, csvSheet: key };
  }

  if (!name.endsWith(".xlsx")) throw new ImportFileError("Upload the Excel template (.xlsx) or a .csv file.");
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new ImportFileError("This file couldn't be opened. Save it as an Excel workbook (.xlsx) and try again.");
  }
  workbook.eachSheet((ws) => {
    const sheet = sheetForName(ws.name);
    if (!sheet) {
      if (normalize(ws.name) !== "instructions") out.unknownSheets.push(ws.name);
      return;
    }
    const { headers, rows } = readWorksheet(ws);
    collect(sheet, headers, rows, out);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

const BRAND = "FF3F0EE3";
const TEMPLATE_ROWS = 500;
const MUTED = "FF86868B";

const addInstructions = (workbook: Workbook) => {
  const ws = workbook.addWorksheet("Instructions", { properties: { tabColor: { argb: BRAND } } });
  ws.columns = [{ width: 26 }, { width: 12 }, { width: 90 }];
  ws.addRow(["est8Ledger import template"]).font = { bold: true, size: 16 };
  ws.addRow([]);
  const intro = [
    "1. Fill in the sheets you need and leave the rest empty. Only Properties and Tenants depend on each other.",
    "2. Rows are linked by Property name and Unit, so spell them the same way on every sheet.",
    "3. Grey rows are examples. Replace them with your own records; any example left unchanged is skipped.",
    "4. Columns marked * are required. Dates can be YYYY-MM-DD or DD/MM/YYYY.",
    "5. Upload the file in est8Ledger under Import data. Nothing is saved until every row checks out.",
  ];
  intro.forEach((line) => (ws.addRow([line]).getCell(1).alignment = { wrapText: false }));

  for (const sheet of SHEETS) {
    ws.addRow([]);
    const title = ws.addRow([sheet.name]);
    title.font = { bold: true, size: 13, color: { argb: BRAND } };
    ws.addRow([sheet.summary]).font = { italic: true, color: { argb: MUTED } };
    const head = ws.addRow(["Column", "Required", "What to enter"]);
    head.font = { bold: true };
    for (const col of sheet.columns) {
      ws.addRow([col.label, col.required ? "Yes" : "", col.help]);
    }
  }
};

const addDataSheet = (workbook: Workbook, sheet: SheetDef) => {
  const ws = workbook.addWorksheet(sheet.name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = sheet.columns.map((c) => ({
    header: c.required ? `${c.label} *` : c.label,
    key: c.key,
    width: c.width ?? Math.max(12, c.label.length + 4),
    style: c.text ? { numFmt: "@" } : undefined,
  }));

  const header = ws.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
    cell.alignment = { vertical: "middle" };
  });
  sheet.columns.forEach((c, i) => {
    header.getCell(i + 1).note = c.help;
  });

  for (const example of sheet.examples) {
    const row = ws.addRow(sheet.columns.map((c) => (c.text ? String(example[c.key] ?? "") : example[c.key] ?? "")));
    row.font = { italic: true, color: { argb: MUTED } };
  }

  // Dropdowns for the first rows people realistically fill in.
  sheet.columns.forEach((c, i) => {
    if (!c.choices) return;
    for (let r = 2; r <= TEMPLATE_ROWS; r++) {
      ws.getCell(r, i + 1).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${c.choices.join(",")}"`],
        showErrorMessage: true,
        errorTitle: c.label,
        error: `Choose one of: ${c.choices.join(", ")}`,
      };
    }
  });
};

export async function downloadExcelTemplate() {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "est8Ledger";
  addInstructions(workbook);
  SHEETS.forEach((sheet) => addDataSheet(workbook, sheet));
  const buffer = await workbook.xlsx.writeBuffer();
  saveBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    "est8ledger-import-template.xlsx"
  );
}

const csvCell = (value: string | number | undefined) => {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsvTemplate(key: SheetKey) {
  const sheet = sheetByKey(key);
  const lines = [
    sheet.columns.map((c) => csvCell(c.required ? `${c.label} *` : c.label)).join(","),
    ...sheet.examples.map((ex) => sheet.columns.map((c) => csvCell(ex[c.key])).join(",")),
  ];
  // BOM so Excel opens UTF-8 names correctly.
  saveBlob(new Blob(["\uFEFF" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }), `est8ledger-${sheet.name.toLowerCase().replace(/\s+/g, "-")}.csv`);
}
