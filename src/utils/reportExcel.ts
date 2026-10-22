import type { Worksheet } from "exceljs";
import type { CurrencyGroup, PortfolioReport } from "../services/reportService";
import { saveBlob } from "./download";

/** Excel version of a report: one sheet per section, with a Currency column so mixed-currency portfolios never add up across currencies. */

const BRAND = "FF3F0EE3";
const MUTED = "FF6E6E73";
const MONEY = "#,##0";
const PCT = '0.0"%"';

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

type Col = { header: string; key: string; width: number; numFmt?: string };

function sheet(ws: Worksheet, report: PortfolioReport, title: string, cols: Col[], rows: Record<string, unknown>[]) {
  ws.addRow([title]).font = { bold: true, size: 14, color: { argb: BRAND } };
  ws.addRow([`${report.scope.name} · ${report.period.label} · balances as of ${report.asOf.slice(0, 10)}`]).font = { color: { argb: MUTED } };
  ws.addRow([]);
  const header = ws.addRow(cols.map((c) => c.header));
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
  });
  cols.forEach((c, i) => {
    const column = ws.getColumn(i + 1);
    column.width = c.width;
    if (c.numFmt) column.numFmt = c.numFmt;
  });
  rows.forEach((r) => ws.addRow(cols.map((c) => r[c.key] ?? null)));
  if (rows.length === 0) ws.addRow(["Nothing in this period"]).font = { italic: true, color: { argb: MUTED } };
  ws.views = [{ state: "frozen", ySplit: 4 }];
}

const each = <T>(groups: CurrencyGroup[], f: (g: CurrencyGroup) => T[]) => groups.flatMap(f);

export async function downloadReportExcel(report: PortfolioReport) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "est8Ledger";
  const { groups } = report;

  sheet(
    wb.addWorksheet("Summary", { properties: { tabColor: { argb: BRAND } } }),
    report,
    "Summary",
    [
      { header: "Currency", key: "currency", width: 10 },
      { header: "Measure", key: "measure", width: 30 },
      { header: report.period.label, key: "now", width: 18 },
      { header: report.period.previousLabel, key: "before", width: 18 },
    ],
    each(groups, (g) => [
      { currency: g.currency, measure: "Rent collected", now: g.income.rentCollected, before: g.previous.income },
      { currency: g.currency, measure: "Expenses", now: g.income.totalExpenses, before: g.previous.expenses },
      { currency: g.currency, measure: "Net operating income", now: g.income.netOperatingIncome, before: g.previous.netOperatingIncome },
      { currency: g.currency, measure: "Collection rate (%)", now: g.rent.collectionRate, before: g.previous.collectionRate },
      { currency: g.currency, measure: "Occupancy (%)", now: g.occupancy.occupancyRate, before: g.previous.occupancyRate },
      { currency: g.currency, measure: "Rent in arrears", now: g.rent.arrears, before: g.previous.arrears },
      { currency: g.currency, measure: "Security deposits held", now: g.deposits.heldAtEnd, before: null },
    ]),
  );
  // Money and percentage rows share columns, so format per row.
  wb.getWorksheet("Summary")?.eachRow((row, n) => {
    if (n <= 4) return;
    const fmt = String(row.getCell(2).value ?? "").includes("(%)") ? PCT : MONEY;
    row.getCell(3).numFmt = fmt;
    row.getCell(4).numFmt = fmt;
  });

  sheet(
    wb.addWorksheet("Income & expenses"),
    report,
    "Income & expenses (rent counted in the month it covers; approved expenses only)",
    [
      { header: "Currency", key: "currency", width: 10 },
      { header: "Line", key: "line", width: 34 },
      { header: "Amount", key: "amount", width: 18, numFmt: MONEY },
    ],
    each(groups, (g) => [
      { currency: g.currency, line: "Rent collected", amount: g.income.rentCollected },
      ...g.income.expensesByCategory.map((e) => ({ currency: g.currency, line: `Expense: ${titleCase(e.category)}`, amount: -e.amount })),
      { currency: g.currency, line: "Total expenses", amount: -g.income.totalExpenses },
      { currency: g.currency, line: "Net operating income", amount: g.income.netOperatingIncome },
      { currency: g.currency, line: "Late fees charged (memo)", amount: g.income.lateFeesCharged },
      { currency: g.currency, line: "Expenses awaiting approval (memo)", amount: g.income.pendingExpenses },
    ]),
  );

  sheet(
    wb.addWorksheet("Monthly trend"),
    report,
    "Monthly trend",
    [
      { header: "Currency", key: "currency", width: 10 },
      { header: "Month", key: "label", width: 12 },
      { header: "Rent expected", key: "expected", width: 16, numFmt: MONEY },
      { header: "Rent collected", key: "collected", width: 16, numFmt: MONEY },
      { header: "Expenses", key: "expenses", width: 16, numFmt: MONEY },
      { header: "Net", key: "net", width: 16, numFmt: MONEY },
    ],
    each(groups, (g) => g.trend.map((t) => ({ currency: g.currency, ...t, net: t.collected - t.expenses }))),
  );

  if (report.scope.propertyId === null) {
    sheet(
      wb.addWorksheet("By property"),
      report,
      "By property",
      [
        { header: "Currency", key: "currency", width: 10 },
        { header: "Property", key: "name", width: 28 },
        { header: "Rent collected", key: "income", width: 16, numFmt: MONEY },
        { header: "Expenses", key: "expenses", width: 16, numFmt: MONEY },
        { header: "NOI", key: "netOperatingIncome", width: 16, numFmt: MONEY },
        { header: "Collection rate", key: "collectionRate", width: 15, numFmt: PCT },
        { header: "Occupancy", key: "occupancyRate", width: 12, numFmt: PCT },
        { header: "Arrears", key: "arrears", width: 16, numFmt: MONEY },
      ],
      each(groups, (g) => g.comparison.map((p) => ({ currency: g.currency, ...p }))),
    );
  }

  sheet(
    wb.addWorksheet("Rent roll"),
    report,
    "Rent roll & arrears (arrears include earlier months)",
    [
      { header: "Currency", key: "currency", width: 10 },
      { header: "Property", key: "propertyName", width: 24 },
      { header: "Tenant", key: "tenantName", width: 24 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Monthly rent", key: "monthlyRent", width: 14, numFmt: MONEY },
      { header: "Expected", key: "expected", width: 14, numFmt: MONEY },
      { header: "Collected", key: "collected", width: 14, numFmt: MONEY },
      { header: "Balance for period", key: "balance", width: 18, numFmt: MONEY },
      { header: "Total arrears", key: "arrears", width: 14, numFmt: MONEY },
      { header: "Months unpaid", key: "monthsUnpaid", width: 14 },
      { header: "Days overdue", key: "daysOverdue", width: 13 },
    ],
    each(groups, (g) => g.rent.rows.map((r) => ({ currency: g.currency, ...r }))),
  );

  sheet(
    wb.addWorksheet("Arrears aging"),
    report,
    "Arrears by age",
    [
      { header: "Currency", key: "currency", width: 10 },
      { header: "0–30 days", key: "d0_30", width: 14, numFmt: MONEY },
      { header: "31–60 days", key: "d31_60", width: 14, numFmt: MONEY },
      { header: "61–90 days", key: "d61_90", width: 14, numFmt: MONEY },
      { header: "Over 90 days", key: "d90_plus", width: 14, numFmt: MONEY },
      { header: "Total", key: "total", width: 14, numFmt: MONEY },
    ],
    groups.map((g) => ({ currency: g.currency, ...g.rent.aging, total: g.rent.arrears })),
  );

  sheet(
    wb.addWorksheet("Occupancy"),
    report,
    "Occupancy & tenant movements",
    [
      { header: "Currency", key: "currency", width: 10 },
      { header: "Change", key: "change", width: 14 },
      { header: "Property", key: "propertyName", width: 24 },
      { header: "Tenant", key: "tenantName", width: 24 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Date", key: "date", width: 12 },
    ],
    each(groups, (g) => [
      ...g.occupancy.moveIns.map((m) => ({ currency: g.currency, change: "Moved in", ...m })),
      ...g.occupancy.moveOuts.map((m) => ({ currency: g.currency, change: "Moved out", ...m })),
      ...g.occupancy.notices.map((m) => ({ currency: g.currency, change: "Gave notice", ...m })),
    ]),
  );
  const occ = wb.getWorksheet("Occupancy");
  if (occ) {
    occ.addRow([]);
    groups.forEach((g) =>
      occ.addRow([g.currency, "Units", g.occupancy.units, "Occupied", g.occupancy.occupied, `Occupancy ${g.occupancy.occupancyRate ?? "—"}%`]),
    );
  }

  sheet(
    wb.addWorksheet("Repairs"),
    report,
    "Repairs opened or completed in the period",
    [
      { header: "Currency", key: "currency", width: 10 },
      { header: "Property", key: "propertyName", width: 24 },
      { header: "Repair", key: "title", width: 32 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Status", key: "status", width: 14 },
      { header: "Cost", key: "amount", width: 12, numFmt: MONEY },
      { header: "Opened", key: "openedAt", width: 12 },
    ],
    each(groups, (g) => g.repairs.items.map((r) => ({ currency: g.currency, ...r, priority: titleCase(r.priority), status: titleCase(r.status) }))),
  );

  sheet(
    wb.addWorksheet("Deposits"),
    report,
    "Security deposits",
    [
      { header: "Currency", key: "currency", width: 10 },
      { header: "Held at period end", key: "heldAtEnd", width: 18, numFmt: MONEY },
      { header: "Tenancies", key: "tenanciesWithDeposit", width: 11 },
      { header: "Collected", key: "collected", width: 14, numFmt: MONEY },
      { header: "Returned", key: "settled", width: 14, numFmt: MONEY },
      { header: "Settled", key: "settledCount", width: 10 },
      { header: "Deducted for damage", key: "deductions", width: 20, numFmt: MONEY },
    ],
    groups.map((g) => ({ currency: g.currency, ...g.deposits })),
  );

  const buffer = await wb.xlsx.writeBuffer();
  const slug = (s: string) => s.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase();
  saveBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `est8ledger-report-${slug(report.scope.name)}-${slug(report.period.label)}.xlsx`,
  );
}
