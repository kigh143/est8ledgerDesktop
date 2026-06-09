import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { ComponentType } from "react";
import {
  ArrowLeft, MessageCircle, Mail, Phone, AlertCircle, Edit, Trash2, Banknote,
  CheckCircle2, XCircle, Clock, ShieldCheck, FileSignature, ClipboardCheck,
  Wallet, CalendarClock, Coins, CircleDollarSign, Home, Droplets, Zap,
} from "lucide-react";
import tenancyService from "../../../services/tenancyService";
import { securityDepositService } from "../../../services/securityDepositService";
import { rentPaymentsService } from "../../../services/rentPaymentsService";
import { inspectionService } from "../../../services/inspectionService";
import { toast } from "react-toastify";
import type { TenancyAgreement, SecurityDepositRecord, RentPayment, InspectionItem } from "../../../types";

export const Route = createFileRoute("/dashboard/tenants/$tenantId")({
  component: TenantProfilePage,
});

type IconType = ComponentType<{ size?: number; className?: string }>;
type Tone = "violet" | "emerald" | "amber" | "red" | "slate";

const toneChip: Record<Tone, string> = {
  violet: "bg-[#3f0ee3]/10 text-[#3f0ee3]",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

function KpiCard({ icon: Icon, label, value, hint, tone = "slate", valueClass }: {
  icon: IconType;
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  valueClass?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <span className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${toneChip[tone]}`}>
          <Icon size={20} />
        </span>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className={`mt-3 text-2xl font-bold tabular-nums ${valueClass ?? "text-slate-900"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function StatusTile({ icon: Icon, label, value, state }: {
  icon: IconType;
  label: string;
  value: string;
  state: "good" | "warn" | "bad";
}) {
  const styles = {
    good: { ring: "border-emerald-200", chip: "bg-emerald-100 text-emerald-700", mark: "text-emerald-600", Mark: CheckCircle2 },
    warn: { ring: "border-amber-200", chip: "bg-amber-100 text-amber-700", mark: "text-amber-600", Mark: Clock },
    bad: { ring: "border-red-200", chip: "bg-red-100 text-red-700", mark: "text-red-600", Mark: XCircle },
  }[state];
  const Mark = styles.Mark;
  return (
    <div className={`bg-white rounded-xl border ${styles.ring} p-4 flex items-center gap-3`}>
      <span className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${styles.chip}`}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
          <Mark size={15} className={styles.mark} />
          {value}
        </p>
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
  const [loading, setLoading] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textMessage, setTextMessage] = useState("");
  const [sendingText, setSendingText] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      const [tenancyRes, depositsRes, paymentsRes, inspectionsRes] = await Promise.all([
        tenancyService.getTenancy(tenantId),
        securityDepositService.getTenancyDeposit(tenantId),
        rentPaymentsService.getTenancyRentPayments(tenantId),
        inspectionService.getTenancyInspection(tenantId),
      ]);

      setTenancy(tenancyRes.data || tenancyRes);
      setDeposits((depositsRes?.data || []) as SecurityDepositRecord[]);
      setPayments(paymentsRes as any[]);
      setInspections((inspectionsRes?.data || inspectionsRes || []) as InspectionItem[]);
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
  const monthlyRent = Number(tenancy.rentAmount) || 0;
  const outstandingBalance =
    Number(tenancy.outstanding_rent_balance ?? 0) || parseFloat(tenancy.outstandingBalance || "0");
  const totalDeposits = deposits.reduce((sum, d) => sum + parseFloat(d.amount?.toString() || "0"), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // At-a-glance landlord metrics
  const monthsUnpaid =
    monthlyRent > 0 && outstandingBalance > 0 ? Math.ceil(outstandingBalance / monthlyRent) : 0;
  const isUpToDate = outstandingBalance <= 0;
  const depositPaid = !!tenancy.securityDepositPaidAt || deposits.some((d) => d.status === "PAID");
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

      {/* Status overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusTile
          icon={ShieldCheck}
          label="Security Deposit"
          value={depositPaid ? "Paid" : "Not paid"}
          state={depositPaid ? "good" : "bad"}
        />
        <StatusTile
          icon={FileSignature}
          label="Agreement"
          value={agreementSigned ? "Signed" : "Awaiting signature"}
          state={agreementSigned ? "good" : "warn"}
        />
        <StatusTile
          icon={ClipboardCheck}
          label="Inspections"
          value={
            inspections.length === 0
              ? "None yet"
              : inspectionsDone
              ? "Completed"
              : `${completedInspections}/${inspections.length} done`
          }
          state={inspections.length === 0 ? "warn" : inspectionsDone ? "good" : "warn"}
        />
        <StatusTile
          icon={Wallet}
          label="Rent Status"
          value={isUpToDate ? "Up to date" : `${monthsUnpaid} month${monthsUnpaid === 1 ? "" : "s"} behind`}
          state={isUpToDate ? "good" : "bad"}
        />
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Wallet} tone="emerald" label="Total Rent Paid" value={fmtMoney(totalPayments)} hint={`${payments.length} payment${payments.length === 1 ? "" : "s"}`} />
        <KpiCard
          icon={CircleDollarSign}
          tone={outstandingBalance > 0 ? "red" : "emerald"}
          label="Outstanding Balance"
          value={fmtMoney(outstandingBalance)}
          valueClass={outstandingBalance > 0 ? "text-red-600" : "text-emerald-600"}
          hint={isUpToDate ? "All rent settled" : "Overdue"}
        />
        <KpiCard
          icon={CalendarClock}
          tone={monthsUnpaid > 0 ? "amber" : "emerald"}
          label="Months Unpaid"
          value={String(monthsUnpaid)}
          valueClass={monthsUnpaid > 0 ? "text-amber-600" : "text-emerald-600"}
          hint={monthsUnpaid > 0 ? "Based on outstanding rent" : "None"}
        />
        <KpiCard icon={Coins} tone="violet" label="Monthly Rent" value={fmtMoney(monthlyRent)} hint={tenancy.paymentDueDay ? `Due day ${tenancy.paymentDueDay}` : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Payments */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Payments</h2>
                <p className="text-sm text-slate-500">Last 3 of {payments.length} recorded</p>
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
                Record Payment
              </button>
            </div>
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
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
                      className="flex items-center justify-between gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#3f0ee3]/10 text-[#3f0ee3] shrink-0">
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
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg">
                <Banknote size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No payments recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">Record this tenant's first payment to start tracking.</p>
              </div>
            )}
          </div>

          {/* Tenancy Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tenancy Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {[
                { icon: Home, label: "Unit Name", value: tenancy.unitName || "N/A" },
                { icon: Coins, label: "Monthly Rent", value: fmtMoney(monthlyRent) },
                { icon: Droplets, label: "Water Meter", value: tenancy.waterMeter || "N/A" },
                { icon: Zap, label: "YAKA Meter", value: tenancy.yakaMeter || "N/A" },
                { icon: Trash2, label: "Waste Handled By", value: tenancy.wasteHandledBy || "N/A" },
                { icon: CalendarClock, label: "Payment Due Day", value: tenancy.paymentDueDay ? `Day ${tenancy.paymentDueDay}` : "N/A" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-medium text-slate-900 truncate capitalize">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspections */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Inspections</h2>
              {inspections.length > 0 && (
                <span className="text-sm text-slate-500">{completedInspections}/{inspections.length} completed</span>
              )}
            </div>
            {inspections.length > 0 ? (
              <div className="space-y-3">
                {inspections.map((inspection) => {
                  const done = inspection.status === "COMPLETED" || inspection.status === "APPROVED";
                  return (
                    <div
                      key={inspection.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-lg border border-slate-100 bg-slate-50/60"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
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
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg">
                <ClipboardCheck size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No inspections yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Rent Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Rent Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <p className="text-slate-600">Monthly Rent</p>
                <p className="font-medium text-slate-900 tabular-nums">{fmtMoney(monthlyRent)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-slate-600">Total Paid</p>
                <p className="font-medium text-emerald-600 tabular-nums">{fmtMoney(totalPayments)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-slate-600">Months Unpaid</p>
                <p className="font-medium text-slate-900 tabular-nums">{monthsUnpaid}</p>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200">
                <p className="font-medium text-slate-700">Outstanding</p>
                <p className={`font-bold tabular-nums ${outstandingBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {fmtMoney(outstandingBalance)}
                </p>
              </div>
            </div>
          </div>

          {/* Security Deposit */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Security Deposit</h3>
            {deposits.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <p className="text-slate-600">Total Deposits</p>
                  <p className="font-medium text-slate-900 tabular-nums">{fmtMoney(totalDeposits)}</p>
                </div>
                {deposits.map((deposit) => (
                  <div key={deposit.id} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 tabular-nums">
                        {deposit.currency || currency} {Number(deposit.amount).toLocaleString()}
                      </p>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          deposit.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : deposit.status === "REFUNDED"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {deposit.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {deposit.investedAt ? "Invested" : "Not invested"}
                      {deposit.createdAt ? ` · ${new Date(deposit.createdAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle size={16} className="shrink-0" />
                No security deposit on record.
              </div>
            )}
          </div>

          {/* Agreement Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Agreement Status</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "Manager Signed", at: tenancy.mgtSignedAt },
                { label: "Tenant Signed", at: tenancy.tenantSignedAt },
              ].map(({ label, at }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {at ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <Clock size={16} className="text-amber-500" />
                    )}
                    <p className="text-slate-700">{label}</p>
                  </div>
                  <p className="font-medium text-slate-900">
                    {at ? new Date(at).toLocaleDateString() : "Pending"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Send Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Send Text Message</h2>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">To: {tenancy.tenant.phoneNumber}</p>
              </div>
              <textarea
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
              />
              <div className="flex gap-3 justify-end pt-4">
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
            </div>
          </div>
        </div>
      )}

      {/* Terminate Tenancy Modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Terminate Tenancy</h2>
              <button
                onClick={() => setShowTerminateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
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
              <div className="flex gap-3 justify-end pt-4">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
