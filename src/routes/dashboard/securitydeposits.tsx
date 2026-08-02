import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Vault, Wallet, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import { securityDepositService } from "../../services/securityDepositService";
import { tenancyService } from "../../services/tenancyService";
import { useAppStore } from "../../store";
import { PageHeader, StatCard, EmptyState } from "../../componennts/dashboard/ui";
import SlideOver from "../../componennts/SlideOver";
import { toast } from "react-toastify";
import type { SecurityDepositRecord } from "../../types";

export const Route = createFileRoute("/dashboard/securitydeposits")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) {
      return { deposits: [] };
    }

    const propertyId = activeProperty.id.toString();
    const [depositsResponse, tenanciesResponse] = await Promise.all([
      securityDepositService.getPropertyDeposits(propertyId),
      tenancyService.getPropertyTenancies(propertyId).catch(() => []),
    ]);

    const rawDeposits = (depositsResponse.data || []) as SecurityDepositRecord[];
    const tenancies = Array.isArray(tenanciesResponse)
      ? tenanciesResponse
      : tenanciesResponse.data || [];
    const tenancyMap = new Map<string, any>(tenancies.map((t: any) => [t.id.toString(), t]));

    // The deposits endpoint doesn't always include the nested tenant/unit info,
    // so cross-reference the property's tenancies to fill it in.
    const deposits: SecurityDepositRecord[] = rawDeposits.map((d) => {
      const tenancy = tenancyMap.get(d.tenancyId?.toString());
      return {
        ...d,
        currency: d.currency || activeProperty.currency || "UGX",
        tenancy:
          d.tenancy ||
          (tenancy
            ? { id: tenancy.id, tenant: tenancy.tenant, unitName: tenancy.unitName }
            : undefined),
      };
    });

    return { deposits };
  },
  component: SecurityDepositsPage,
});

function SecurityDepositsPage() {
  const { deposits } = Route.useLoaderData();
  const [selectedDeposit, setSelectedDeposit] = useState<SecurityDepositRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [optingIn, setOptingIn] = useState(false);

  const handleOptIntoInvestment = async () => {
    if (!selectedDeposit) return;
    setOptingIn(true);
    try {
      await securityDepositService.managementOptIntoInvestment(selectedDeposit.id.toString());
      setSelectedDeposit({ ...selectedDeposit, mgtOptedIntoInvestmentAt: new Date().toISOString() });
      toast.success("Opted into investment");
    } catch (error) {
      console.error(error);
      toast.error("Failed to opt into investment");
    } finally {
      setOptingIn(false);
    }
  };

  const totalDeposits = deposits.length;
  const totalAmount = deposits.reduce((sum: number, d: SecurityDepositRecord) => sum + parseFloat(d.amount?.toString() || "0"), 0);
  const paidCount = deposits.filter((d: SecurityDepositRecord) => d.status === "COMPLETED").length;
  const investedCount = deposits.filter((d: SecurityDepositRecord) => d.investedAt !== null).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800";
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getInvestmentStatus = (deposit: SecurityDepositRecord) => {
    if (deposit.investedAt) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
          <CheckCircle2 size={14} /> Invested
        </span>
      );
    }
    return <span className="text-slate-400 text-xs">Not invested</span>;
  };

  const currency = deposits[0]?.currency || "UGX";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Vault}
        title="Security Deposits"
        subtitle="Tenant deposits, status, and investment tracking"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Vault} tone="violet" label="Total Deposits" value={totalDeposits} />
        <StatCard
          icon={Wallet}
          tone="slate"
          label="Total Amount"
          value={`${currency} ${new Intl.NumberFormat("en-US").format(Math.round(totalAmount))}`}
        />
        <StatCard icon={CheckCircle2} tone="emerald" label="Paid Deposits" value={paidCount} />
        <StatCard icon={TrendingUp} tone="violet" label="Invested" value={investedCount} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {deposits.length === 0 ? (
          <EmptyState
            icon={Vault}
            title="No security deposits yet"
            message="Deposits collected from tenants for this property will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Tenant</th>
                  <th className="px-6 py-3 text-left font-semibold">Unit</th>
                  <th className="px-6 py-3 text-right font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Investment</th>
                  <th className="px-6 py-3 text-left font-semibold">Paid Date</th>
                  <th className="px-6 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deposits.map((deposit: SecurityDepositRecord) => (
                  <tr
                    key={deposit.id}
                    onClick={() => {
                      setSelectedDeposit(deposit);
                      setIsDetailOpen(true);
                    }}
                    className="group hover:bg-[#3f0ee3]/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 capitalize">
                        {deposit.tenancy?.tenant.firstName} {deposit.tenancy?.tenant.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{deposit.tenancy?.tenant.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{deposit.tenancy?.unitName}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {deposit.currency} {Number(deposit.amount).toLocaleString()}
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
                      <span
                        className="inline-flex items-center justify-center text-[#3f0ee3] opacity-70 group-hover:opacity-100 transition-opacity"
                        aria-hidden="true"
                      >
                        <Eye size={16} />
                      </span>
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
        open={isDetailOpen && !!selectedDeposit}
        onClose={() => setIsDetailOpen(false)}
        title="Deposit Details"
        widthClass="max-w-lg"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedDeposit && (
          <div className="space-y-6">
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
                  {selectedDeposit.mgtOptedIntoInvestmentAt ? (
                    <p className="font-medium text-slate-900">
                      {new Date(selectedDeposit.mgtOptedIntoInvestmentAt).toLocaleDateString()}
                    </p>
                  ) : (
                    <button
                      onClick={handleOptIntoInvestment}
                      disabled={optingIn}
                      className="mt-1 flex items-center gap-2 px-3 py-1.5 bg-[#3f0ee3] text-white rounded-lg text-xs font-semibold hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {optingIn ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                      {optingIn ? "Opting in..." : "Opt into Investment"}
                    </button>
                  )}
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
        )}
      </SlideOver>
    </div>
  );
}
