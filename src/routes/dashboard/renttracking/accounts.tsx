import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, Trash2 } from "lucide-react";
import { useAppStore } from "../../../store";
import { rentPaymentsService } from "../../../services/rentPaymentsService";
import { toast } from "react-toastify";

export const Route = createFileRoute("/dashboard/renttracking/accounts")({
  component: ManageAccountsPage,
});

function ManageAccountsPage() {
  const navigate = useNavigate();
  const { activeProperty } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    accountType: "",
    accountName: "",
    accountNumber: "",
    instructions: "",
  });

  useEffect(() => {
    loadAccounts();
  }, [activeProperty?.id]);

  const loadAccounts = async () => {
    try {
      setPageLoading(true);

      if (!activeProperty) {
        toast.error("No property selected");
        return;
      }

      const response = await rentPaymentsService.getRentPaymentAccounts(
        activeProperty.id.toString()
      );
      setAccounts(response || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load accounts");
    } finally {
      setPageLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.accountType ||
      !formData.accountName ||
      !formData.accountNumber ||
      !formData.instructions
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!activeProperty) {
      toast.error("No property selected");
      return;
    }

    setLoading(true);
    try {
      await rentPaymentsService.createRentPaymentAccount({
        propertyAgreementId: activeProperty.id,
        accountType: formData.accountType,
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        instructions: formData.instructions,
      });

      toast.success("Account added successfully");
      setFormData({
        accountType: "",
        accountName: "",
        accountNumber: "",
        instructions: "",
      });
      setShowForm(false);
      await loadAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add account");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: any) => {
    if (!confirm("Are you sure you want to delete this account?")) {
      return;
    }

    setDeleting(accountId);
    try {
      await rentPaymentsService.deleteRentPaymentAccount(accountId);
      toast.success("Account deleted successfully");
      await loadAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account");
    } finally {
      setDeleting(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#3f0ee3]/20 border-t-[#3f0ee3] rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading accounts...</p>
        </div>
      </div>
    );
  }

  const accountTypes = [
    { value: "MTN_MOMO", label: "MTN Mobile Money" },
    { value: "AIRTEL_MONEY", label: "Airtel Money" },
    { value: "BANK_ACCOUNT", label: "Bank Account" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard/renttracking" })}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Payment Accounts</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors"
        >
          {showForm ? (
            <>
              <X size={20} />
              Hide Form
            </>
          ) : (
            <>
              <Plus size={20} />
              Add Account
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts List - Takes 2 columns */}
        <div className="lg:col-span-2">
          {accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account: any) => (
                <div
                  key={account.id}
                  className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[#3f0ee3]/10 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-[#3f0ee3]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {account.accountName}
                          </h3>
                          <p className="text-xs text-slate-500 uppercase font-semibold">
                            {accountTypes.find((t) => t.value === account.accountType)
                              ?.label || account.accountType}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(account.id)}
                      disabled={deleting === account.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete account"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                        Account Number
                      </p>
                      <p className="text-slate-900 font-mono text-sm">
                        {account.accountNumber}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                        Instructions After Payment
                      </p>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">
                        {account.instructions}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No payment accounts yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Add your first account to get started
              </p>
            </div>
          )}
        </div>

        {/* Add Account Form - Sticky on right */}
        {showForm && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-6 shadow-lg">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Add New Account</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => handleInputChange("accountType", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition text-sm"
                  >
                    <option value="">Select type</option>
                    {accountTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., MTN Wallet"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange("accountName", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition text-sm"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 0712345678"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition text-sm"
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Instructions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="What should tenants do after payment?"
                    value={formData.instructions}
                    onChange={(e) => handleInputChange("instructions", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition text-sm resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? "Adding..." : "Add Account"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
