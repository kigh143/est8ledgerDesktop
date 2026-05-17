import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, X } from "lucide-react";
import { securityDepositService } from "../../services/securityDepositService";
import { useAppStore } from "../../store";
import type { SecurityDepositRecord } from "../../types";

export const Route = createFileRoute("/dashboard/securitydeposits")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) {
      return { deposits: [] };
    }
    const response = await securityDepositService.getPropertyDeposits(
      activeProperty.id.toString()
    );
    const deposits = (response.data || []) as SecurityDepositRecord[];
    return { deposits };
  },
  component: SecurityDepositsPage,
});

function SecurityDepositsPage() {
  const { deposits } = Route.useLoaderData();
  const [selectedDeposit, setSelectedDeposit] = useState<SecurityDepositRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const totalDeposits = deposits.length;
  const totalAmount = deposits.reduce((sum: number, d: SecurityDepositRecord) => sum + parseFloat(d.amount?.toString() || "0"), 0);
  const paidCount = deposits.filter((d: SecurityDepositRecord) => d.status === "PAID").length;
  const investedCount = deposits.filter((d: SecurityDepositRecord) => d.investedAt !== null).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800";
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800";
      case "DISPUTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getInvestmentStatus = (deposit: SecurityDepositRecord) => {
    if (deposit.investedAt) {
      return <span className="text-emerald-600 text-xs font-semibold">✓ Invested</span>;
    }
    return <span className="text-slate-400 text-xs">Not invested</span>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Total Deposits</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalDeposits}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Total Amount</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalAmount)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Paid Deposits</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{paidCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Invested</p>
          <p className="mt-2 text-3xl font-bold text-[#3f0ee3]">{investedCount}</p>
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
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Investment</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Paid Date</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {deposits.map((deposit: SecurityDepositRecord) => (
                <tr key={deposit.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {deposit.tenancy?.tenant.firstName} {deposit.tenancy?.tenant.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{deposit.tenancy?.tenant.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{deposit.tenancy?.unitName}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {deposit.currency} {deposit.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(deposit.status)}`}>
                      {deposit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getInvestmentStatus(deposit)}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {deposit.createdAt ? new Date(deposit.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedDeposit(deposit);
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
      {isDetailOpen && selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Deposit Details</h2>
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
                      {selectedDeposit.tenancy?.tenant.firstName} {selectedDeposit.tenancy?.tenant.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium text-slate-900">{selectedDeposit.tenancy?.tenant.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Unit</p>
                    <p className="font-medium text-slate-900">{selectedDeposit.tenancy?.unitName}</p>
                  </div>
                </div>
              </div>

              {/* Deposit Info */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Deposit Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Amount</p>
                    <p className="font-medium text-slate-900">
                      {selectedDeposit.currency} {selectedDeposit.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusColor(selectedDeposit.status)}`}>
                      {selectedDeposit.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Created Date</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedDeposit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Reference</p>
                    <p className="font-medium text-slate-900">{selectedDeposit.reference || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Investment Info */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Investment Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Invested At</p>
                    <p className="font-medium text-slate-900">
                      {selectedDeposit.investedAt ? new Date(selectedDeposit.investedAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Tenant Opted In</p>
                    <p className="font-medium text-slate-900">
                      {selectedDeposit.tenantOptedIntoInvestmentAt ? new Date(selectedDeposit.tenantOptedIntoInvestmentAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Mgt Opted In</p>
                    <p className="font-medium text-slate-900">
                      {selectedDeposit.mgtOptedIntoInvestmentAt ? new Date(selectedDeposit.mgtOptedIntoInvestmentAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Tenant Share</p>
                    <p className="font-medium text-slate-900">{selectedDeposit.tenantShare || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Mgt Share</p>
                    <p className="font-medium text-slate-900">{selectedDeposit.mgtShare || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Deposit Fees</p>
                    <p className="font-medium text-slate-900">{selectedDeposit.depositFees || "-"}</p>
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
