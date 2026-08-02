import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet as WalletIcon, Plus, X, Loader2, Ban, Coins } from "lucide-react";
import { securityDepositService } from "../../services/securityDepositService";
import type { MyTotalBalance } from "../../services/securityDepositService";
import { withdrawalService } from "../../services/withdrawalService";
import type { Withdrawal } from "../../services/withdrawalService";
import { configurationService } from "../../services/config";
import { useAppStore } from "../../store";
import PropertiesLayout from "../../componennts/PropertiesLayout";
import { StatCard, EmptyState } from "../../componennts/dashboard/ui";
import { toast } from "react-toastify";

export const Route = createFileRoute("/properties/wallet")({
  loader: async () => {
    const [balance, withdrawals] = await Promise.all([
      securityDepositService.getMyTotal().catch(() => null),
      withdrawalService.getMyWithdrawals().catch(() => []),
    ]);
    return { balance, withdrawals };
  },
  component: WalletPage,
});

const statusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "CANCELLED":
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

function WalletPage() {
  const { balance: loadedBalance, withdrawals: loadedWithdrawals } = Route.useLoaderData();
  const user = useAppStore((state) => state.user);

  const [balance, setBalance] = useState<MyTotalBalance | null>(loadedBalance);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(loadedWithdrawals);
  const [cashOutMethods, setCashOutMethods] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | string | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    cashOutMethodId: "",
    accountNumber: "",
    accountName: "",
    mtnNumber: "",
  });

  useEffect(() => {
    if (!user?.countryId) return;
    configurationService
      .getCashOutMethods(user.countryId)
      .then((res) => setCashOutMethods(res.data || res || []))
      .catch(() => setCashOutMethods([]));
  }, [user?.countryId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedMethod = cashOutMethods.find(
    (m) => String(m.id) === formData.cashOutMethodId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!formData.cashOutMethodId) {
      toast.error("Please select a cash-out method");
      return;
    }
    if (!formData.accountNumber || !formData.accountName) {
      toast.error("Please fill in account number and account name");
      return;
    }

    setSubmitting(true);
    try {
      const created = await withdrawalService.createWithdrawal({
        amount: parseFloat(formData.amount),
        withdrawerType: balance?.role === "TENANT" ? "TENANT" : "MGT",
        cashOutMethodUsed: selectedMethod?.name || selectedMethod?.label || "",
        cashOutMethodId: parseInt(formData.cashOutMethodId),
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        mtnNumber: formData.mtnNumber || undefined,
      });

      setWithdrawals((prev) => [created, ...prev]);
      toast.success("Withdrawal requested");
      setShowForm(false);
      setFormData({ amount: "", cashOutMethodId: "", accountNumber: "", accountName: "", mtnNumber: "" });

      // Refresh balance since a withdrawal was requested
      securityDepositService.getMyTotal().then(setBalance).catch(() => {});
    } catch (error) {
      console.error(error);
      toast.error("Failed to request withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number | string) => {
    setCancellingId(id);
    try {
      const updated = await withdrawalService.cancelWithdrawal(id);
      setWithdrawals((prev) => prev.map((w) => (w.id === id ? updated : w)));
      toast.success("Withdrawal cancelled");
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel withdrawal");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <PropertiesLayout pageTitle="Wallet" subTitle="Balance and withdrawals">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Cancel" : "Request Withdrawal"}
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={WalletIcon}
            tone="violet"
            label="Total Security Deposit"
            value={
              balance
                ? `${balance.currency} ${new Intl.NumberFormat("en-US").format(balance.totalSecurityDeposit)}`
                : "-"
            }
          />
          <StatCard icon={Coins} tone="slate" label="Deposits Count" value={balance?.count ?? "-"} />
          {balance?.ugeBalance !== undefined && (
            <StatCard
              icon={Coins}
              tone="emerald"
              label="Withdrawable Balance"
              value={new Intl.NumberFormat("en-US").format(balance.ugeBalance)}
            />
          )}
        </div>

        {/* Withdrawal Request Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Request Withdrawal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Cash-out Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.cashOutMethodId}
                    onChange={(e) => handleInputChange("cashOutMethodId", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
                  >
                    <option value="">Select method</option>
                    {cashOutMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name || method.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Jane Doe"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange("accountName", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 0771234567"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    MTN Number <span className="text-slate-400 text-xs">(if applicable)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 0771234567"
                    value={formData.mtnNumber}
                    onChange={(e) => handleInputChange("mtnNumber", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Withdrawal History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {withdrawals.length === 0 ? (
            <EmptyState
              icon={WalletIcon}
              title="No withdrawals yet"
              message="Withdrawal requests will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Method</th>
                    <th className="px-6 py-3 text-right font-semibold">Amount</th>
                    <th className="px-6 py-3 text-right font-semibold">Fee</th>
                    <th className="px-6 py-3 text-right font-semibold">Net</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-[#3f0ee3]/[0.03] transition-colors">
                      <td className="px-6 py-4 text-slate-900 font-medium">{w.cashOutMethodUsed}</td>
                      <td className="px-6 py-4 text-right text-slate-900 tabular-nums">
                        {w.currency} {Number(w.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 tabular-nums">
                        {Number(w.fee).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums">
                        {Number(w.netAmount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor(w.withdrawalStatus)}`}>
                          {w.withdrawalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {w.withdrawalStatus === "PENDING" && (
                          <button
                            onClick={() => handleCancel(w.id)}
                            disabled={cancellingId === w.id}
                            aria-label="Cancel withdrawal"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingId === w.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Ban size={16} />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PropertiesLayout>
  );
}
