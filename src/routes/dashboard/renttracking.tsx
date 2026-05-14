import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, X } from "lucide-react";
import { rentPaymentsService } from "../../services/rentPaymentsService";
import { useAppStore } from "../../store";
import type { RentPaymentRecord } from "../../services/rentPaymentsService";

export const Route = createFileRoute("/dashboard/renttracking")({
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
  const { rentPayments } = Route.useLoaderData();
  const [selectedPayment, setSelectedPayment] = useState<RentPaymentRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const totalRent = rentPayments.reduce((sum: number, p: RentPaymentRecord) => sum + (+p.amount || 0), 0);
  const confirmedCount = rentPayments.filter((p: RentPaymentRecord) => p.status === "CONFIRMED").length;
  const pendingCount = rentPayments.filter((p: RentPaymentRecord) => p.status === "PENDING").length;
  const averageRent = rentPayments.length > 0 ? totalRent / rentPayments.length : 0;

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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Total Rent Collected</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalRent)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Average Rent</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(averageRent)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Confirmed Payments</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Pending</p>
          <p className="mt-2 text-3xl font-bold text-[#3f0ee3]">{pendingCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
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
              {rentPayments.map((payment: RentPaymentRecord) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {(payment as any)?.tenancy?.tenant?.firstName || 'N/A'} {(payment as any)?.tenancy?.tenant?.lastName || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{(payment as any)?.tenancy?.unitName || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatMonth(payment.monthPaidFor, payment.yearPaidFor)}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
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
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
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

            <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
