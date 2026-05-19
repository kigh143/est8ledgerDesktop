import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { expenseService } from "../../../services/expenseService";
import { useAppStore } from "../../../store";
import { toast } from "react-toastify";
import type { ExpenseCategory } from "../../../types";

export const Route = createFileRoute("/dashboard/expenses/$expenseId/edit")({
  component: EditExpensePage,
  loader: async ({ params }) => {
    try {
      const expense = await expenseService.getExpense(params.expenseId);
      return { expense: expense.data || expense };
    } catch {
      return { expense: null };
    }
  },
});

function EditExpensePage() {
  const navigate = useNavigate();
  const { activeProperty } = useAppStore();
  const { expense: initialExpense } = Route.useLoaderData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: (initialExpense?.category || "MAINTENANCE") as ExpenseCategory,
    description: initialExpense?.description || "",
    amount: initialExpense?.amount?.toString() || "",
    date: initialExpense?.date?.split("T")[0] || new Date().toISOString().split("T")[0],
    notes: initialExpense?.notes || "",
    isPaid: initialExpense?.isPaid || false,
  });

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

    if (!initialExpense?.id) {
      toast.error("Expense not found");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        notes: formData.notes,
        isPaid: formData.isPaid,
      };

      await expenseService.updateExpense(initialExpense.id.toString(), payload);
      toast.success("Expense updated successfully");
      navigate({ to: "/dashboard/expenses" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  if (!initialExpense) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-slate-600">Expense not found</p>
        <button
          onClick={() => navigate({ to: "/dashboard/expenses" })}
          className="mt-4 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90"
        >
          Back to Expenses
        </button>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-slate-900">Edit Expense</h1>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
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
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="e.g., Roof repair, water tank replacement"
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
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
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
            />
          </div>

          {/* Is Paid */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => handleInputChange("isPaid", e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#3f0ee3] focus:ring-2 focus:ring-[#3f0ee3]"
              />
              <span className="text-sm font-medium text-slate-900">Mark as paid</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              You can only edit expenses with <span className="font-semibold">PENDING</span> status.
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
              className="px-6 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
