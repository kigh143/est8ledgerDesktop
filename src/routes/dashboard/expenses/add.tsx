import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../../store";
import { toast } from "react-toastify";
import { createExpenseFromPayload } from "../../../utils/expenseUtils";
import type { ExpenseCategory } from "../../../types";

type SearchParams = {
  amount?: string;
  category?: string;
  description?: string;
  notes?: string;
  isPaid?: boolean;
};

export const Route = createFileRoute("/dashboard/expenses/add")({
  component: AddExpensePage,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    amount: search.amount as string | undefined,
    category: search.category as string | undefined,
    description: search.description as string | undefined,
    notes: search.notes as string | undefined,
    isPaid: search.isPaid as boolean | undefined,
  }),
});

function AddExpensePage() {
  const navigate = useNavigate();
  const { activeProperty } = useAppStore();
  const searchParams = useSearch({ from: "/dashboard/expenses/add" });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: (searchParams.category as ExpenseCategory) || ("MAINTENANCE" as ExpenseCategory),
    description: searchParams.description || "",
    amount: searchParams.amount || "",
    date: new Date().toISOString().split("T")[0],
    notes: searchParams.notes || "",
    isPaid: searchParams.isPaid || false,
  });

  useEffect(() => {
    if (searchParams.category) {
      setFormData((prev) => ({
        ...prev,
        category: searchParams.category as ExpenseCategory,
      }));
    }
  }, [searchParams]);

  const categories: { value: ExpenseCategory; label: string }[] = [
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "REPAIRS", label: "Repairs" },
    { value: "UTILITIES", label: "Utilities" },
    { value: "INSURANCE", label: "Insurance" },
    { value: "CLEANING", label: "Cleaning" },
    { value: "OTHER", label: "Other" },
  ];

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    handleInputChange("category", value as ExpenseCategory);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!activeProperty) {
      toast.error("No property selected");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        status: "PENDING" as const,
        category: formData.category,
        description: formData.description,
        notes: formData.notes,
        propertyAgreementId: activeProperty.id,
        isPaid: formData.isPaid,
        date: formData.date,
        currency: activeProperty?.currency || "UGX",
      };

      await createExpenseFromPayload(payload);
      toast.success("Expense added successfully");
      navigate({ to: "/dashboard/expenses" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: "/dashboard/expenses" })}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Add Expense</h1>
      </div>

      {/* Form Card */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label className="label">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#3f0ee3]/12 focus:border-[#3f0ee3]"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="e.g., Roof repair, water tank replacement"
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#3f0ee3]/12 focus:border-[#3f0ee3]"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="label">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <span className="flex items-center px-4 py-2 bg-slate-100 rounded-lg text-slate-900 font-medium">
                {activeProperty?.currency || "UGX"}
              </span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#3f0ee3]/12 focus:border-[#3f0ee3]"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="label">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#3f0ee3]/12 focus:border-[#3f0ee3]"
            />
          </div>

          {/* Is Paid */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => handleInputChange("isPaid", e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#3f0ee3] focus:ring-4 focus:ring-[#3f0ee3]/12"
              />
              <span className="text-sm font-medium text-slate-900">Mark as paid</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#3f0ee3]/12 focus:border-[#3f0ee3]"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              This expense will be created with status <span className="font-semibold">PENDING</span> and will require
              approval before payment.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard/expenses" })}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3409c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
