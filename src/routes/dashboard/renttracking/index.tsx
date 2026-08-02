import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Plus, Settings, Check, X, Calendar, Users, RotateCcw, Inbox } from "lucide-react";
import { rentPaymentsService } from "../../../services/rentPaymentsService";
import { useAppStore } from "../../../store";
import SlideOver from "../../../componennts/SlideOver";
import { toast } from "react-toastify";
import type { RentPaymentRecord } from "../../../services/rentPaymentsService";

export const Route = createFileRoute("/dashboard/renttracking/")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) {
      return { rentPayments: [] };
    }
    const rentPayments = await rentPaymentsService.getPropertyRentPayments(
      activeProperty.id.toString()
    );
    return { rentPayments };
  },
  component: RentTrackingPage,
});

function RentTrackingPage() {
  const navigate = useNavigate();
  const { rentPayments } = Route.useLoaderData();
  const [selectedPayment, setSelectedPayment] = useState<RentPaymentRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const now = new Date();
  // Default the view to the current month and year
  const [filterMonth, setFilterMonth] = useState<number | "all">(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number | "all">(now.getFullYear());
  const [filterTenant, setFilterTenant] = useState<string>("all");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Unique tenants present in the records, for the tenant filter dropdown
  const tenantOptions = useMemo(() => {
    const map = new Map<string, string>();
    rentPayments.forEach((p: RentPaymentRecord) => {
      const t = (p as any)?.tenancy?.tenant;
      const id = String(p.tenancyId ?? (p as any)?.tenancy?.id ?? "");
      if (id && t) {
        map.set(id, `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim());
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [rentPayments]);

  // Years present in the records (plus the current year), newest first
  const yearOptions = useMemo(() => {
    const years = new Set<number>(rentPayments.map((p: RentPaymentRecord) => p.yearPaidFor));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [rentPayments]);

  const filteredPayments = useMemo(
    () =>
      rentPayments.filter((p: RentPaymentRecord) => {
        const monthMatch = filterMonth === "all" || p.monthPaidFor === filterMonth;
        const yearMatch = filterYear === "all" || p.yearPaidFor === filterYear;
        const tenantId = String(p.tenancyId ?? (p as any)?.tenancy?.id ?? "");
        const tenantMatch = filterTenant === "all" || tenantId === filterTenant;
        return monthMatch && yearMatch && tenantMatch;
      }),
    [rentPayments, filterMonth, filterYear, filterTenant]
  );

  const isFiltered =
    filterMonth !== "all" || filterYear !== "all" || filterTenant !== "all";
  const isCurrentPeriod =
    filterMonth === now.getMonth() + 1 &&
    filterYear === now.getFullYear() &&
    filterTenant === "all";

  const resetToCurrentPeriod = () => {
    setFilterMonth(now.getMonth() + 1);
    setFilterYear(now.getFullYear());
    setFilterTenant("all");
  };

  const periodLabel =
    filterMonth === "all" && filterYear === "all"
      ? "All time"
      : `${filterMonth === "all" ? "All months" : months[(filterMonth as number) - 1]}${
          filterYear === "all" ? "" : ` ${filterYear}`
        }`;

  const totalRent = filteredPayments.reduce((sum: number, p: RentPaymentRecord) => sum + (+p.amount || 0), 0);
  const confirmedCount = filteredPayments.filter((p: RentPaymentRecord) => p.status === "CONFIRMED").length;
  const pendingCount = filteredPayments.filter((p: RentPaymentRecord) => p.status === "PENDING").length;
  const averageRent = filteredPayments.length > 0 ? totalRent / filteredPayments.length : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-100 text-emerald-800";
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "DISPUTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handleApprovePayment = async () => {
    if (!selectedPayment) return;

    setIsApproving(true);
    try {
      await rentPaymentsService.updatePaymentStatus(selectedPayment.id, {
        paymentStatus: "CONFIRMED",
      });

      toast.success("Payment approved successfully");
      setIsDetailOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve payment");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeclinePayment = async () => {
    if (!selectedPayment) return;

    setIsDeclining(true);
    try {
      await rentPaymentsService.updatePaymentStatus(selectedPayment.id, {
        paymentStatus: "DISPUTED",
      });

      toast.success("Payment declined");
      setIsDetailOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to decline payment");
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Rent Tracking</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/dashboard/renttracking/record" })}
            className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors"
          >
            <Plus size={20} />
            Record Payment
          </button>
          <button
            onClick={() => navigate({ to: "/dashboard/renttracking/accounts" })}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            <Settings size={20} />
            Manage Accounts
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div>
              <label htmlFor="filter-month" className="block text-xs font-medium text-slate-500 mb-1">
                Month
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  id="filter-month"
                  value={filterMonth}
                  onChange={(e) =>
                    setFilterMonth(e.target.value === "all" ? "all" : parseInt(e.target.value))
                  }
                  className="w-full sm:w-44 pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
                >
                  <option value="all">All months</option>
                  {months.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="filter-year" className="block text-xs font-medium text-slate-500 mb-1">
                Year
              </label>
              <select
                id="filter-year"
                value={filterYear}
                onChange={(e) =>
                  setFilterYear(e.target.value === "all" ? "all" : parseInt(e.target.value))
                }
                className="w-full sm:w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
              >
                <option value="all">All years</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-tenant" className="block text-xs font-medium text-slate-500 mb-1">
                Tenant
              </label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  id="filter-tenant"
                  value={filterTenant}
                  onChange={(e) => setFilterTenant(e.target.value)}
                  className="w-full sm:w-56 pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm capitalize focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
                >
                  <option value="all">All tenants</option>
                  {tenantOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!isCurrentPeriod && (
            <button
              onClick={resetToCurrentPeriod}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#3f0ee3] transition-colors self-start lg:self-auto"
            >
              <RotateCcw size={16} />
              Current month
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Rent Collected</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalRent)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{periodLabel}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Average Rent</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(averageRent)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{filteredPayments.length} payment{filteredPayments.length === 1 ? "" : "s"}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Confirmed Payments</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Pending</p>
          <p className="mt-2 text-2xl font-bold text-[#3f0ee3] tabular-nums">{pendingCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-900">
            Payments <span className="text-slate-400 font-normal">· {periodLabel}</span>
          </h2>
          <span className="text-xs text-slate-500">
            {filteredPayments.length} record{filteredPayments.length === 1 ? "" : "s"}
          </span>
        </div>
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-6 py-16">
            <Inbox size={40} className="text-slate-300 mb-3" />
            <p className="font-medium text-slate-900">
              {rentPayments.length === 0 ? "No payments yet" : "No payments for this view"}
            </p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              {rentPayments.length === 0
                ? "No rent payments have been recorded yet. Record the first one to get started."
                : `No rent payments match ${periodLabel}${
                    filterTenant === "all" ? "" : " for this tenant"
                  }. Try a different month, year, or tenant.`}
            </p>
            <div className="flex items-center gap-3 mt-4">
              {isFiltered && !isCurrentPeriod && (
                <button
                  onClick={resetToCurrentPeriod}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw size={16} />
                  Current month
                </button>
              )}
              <button
                onClick={() => navigate({ to: "/dashboard/renttracking/record" })}
                className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg text-sm font-medium hover:bg-[#3f0ee3]/90 transition-colors"
              >
                <Plus size={16} />
                Record Payment
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Tenant</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Unit</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Period</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Reference</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayments.map((payment: RentPaymentRecord) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 capitalize">
                        {(payment as any)?.tenancy?.tenant?.firstName?.toLowerCase() || 'N/A'} {(payment as any)?.tenancy?.tenant?.lastName?.toLowerCase() || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{(payment as any)?.tenancy?.unitName || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatMonth(payment.monthPaidFor, payment.yearPaidFor)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 tabular-nums">
                      {payment.currency} {payment.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{payment.paymentReference}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsDetailOpen(true);
                        }}
                        className="inline-flex items-center gap-2 text-[#3f0ee3] hover:text-[#3f0ee3]/80 font-medium transition-colors"
                        aria-label="View payment details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <SlideOver
        open={isDetailOpen && !!selectedPayment}
        onClose={() => setIsDetailOpen(false)}
        title="Payment Details"
        widthClass="max-w-lg"
        footer={
          selectedPayment && (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              {selectedPayment.status === "PENDING" && (
                <>
                  <button
                    onClick={handleDeclinePayment}
                    disabled={isApproving || isDeclining}
                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={18} />
                    {isDeclining ? "Declining..." : "Decline"}
                  </button>
                  <button
                    onClick={handleApprovePayment}
                    disabled={isApproving || isDeclining}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={18} />
                    {isApproving ? "Approving..." : "Approve Payment"}
                  </button>
                </>
              )}
            </div>
          )
        }
      >
        {selectedPayment && (
          <div className="space-y-6">
            {/* Tenant Info */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Tenant Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="font-medium text-slate-900">
                    {(selectedPayment as any)?.tenancy?.tenant?.firstName || 'N/A'} {(selectedPayment as any)?.tenancy?.tenant?.lastName || ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Unit</p>
                  <p className="font-medium text-slate-900">{(selectedPayment as any)?.tenancy?.unitName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Rent Amount</p>
                  <p className="font-medium text-slate-900">{(selectedPayment as any)?.tenancy?.rentAmount || '-'}</p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-900 mb-3">Payment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Period</p>
                  <p className="font-medium text-slate-900">
                    {formatMonth(selectedPayment.monthPaidFor, selectedPayment.yearPaidFor)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Amount</p>
                  <p className="font-medium text-slate-900">
                    {selectedPayment.currency} {selectedPayment.amount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Payment Date</p>
                  <p className="font-medium text-slate-900">
                    {new Date(selectedPayment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-600">Reference</p>
                  <p className="font-medium text-slate-900">{selectedPayment.paymentReference}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
