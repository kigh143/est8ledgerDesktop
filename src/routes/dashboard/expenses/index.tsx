import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, X, Plus, DollarSign } from "lucide-react";
import { expenseService } from "../../../services/expenseService";
import { toast } from "react-toastify";
import type { Expense, ExpenseStatus } from "../../../types";

export const Route = createFileRoute("/dashboard/expenses/")({
  loader: async () => {
    // const { activeProperty } = useAppStore.getState();
    // if (!activeProperty) {
    //   return { expenses: [] };
    // }
    // const response = await expenseService.getPropertyExpenses(activeProperty.id.toString());
    // const expenses = (response.data || []) as Expense[];
    return { expenses:[] };
  },
  component: ExpensesPage,
});

function ExpensesPage() {
  const navigate = useNavigate();
  const { expenses: initialExpenses } = Route.useLoaderData();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const pendingCount = expenses.filter((e) => e.status === "PENDING").length;
  const approvedCount = expenses.filter((e) => e.status === "APPROVED").length;
  const paidCount = expenses.filter((e) => e.status === "PAID").length;
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getStatusColor = (status: ExpenseStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "PAID":
        return "bg-emerald-100 text-emerald-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      MAINTENANCE: "text-blue-600",
      REPAIRS: "text-red-600",
      UTILITIES: "text-slate-600",
      INSURANCE: "text-purple-600",
      CLEANING: "text-emerald-600",
      OTHER: "text-slate-400",
    };
    return colors[category] || "text-slate-600";
  };

  const handleApprove = async (expenseId: number) => {
    setUpdatingId(expenseId);
    try {
      await expenseService.approveExpense(expenseId.toString());
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? { ...e, status: "APPROVED" } : e))
      );
      if (selectedExpense?.id === expenseId) {
        setSelectedExpense({ ...selectedExpense, status: "APPROVED" });
      }
      toast.success("Expense approved");
    } catch {
      toast.error("Failed to approve expense");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (expenseId: number) => {
    setUpdatingId(expenseId);
    try {
      await expenseService.rejectExpense(expenseId.toString());
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? { ...e, status: "REJECTED" } : e))
      );
      if (selectedExpense?.id === expenseId) {
        setSelectedExpense({ ...selectedExpense, status: "REJECTED" });
      }
      toast.success("Expense rejected");
    } catch {
      toast.error("Failed to reject expense");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkPaid = async (expenseId: number) => {
    setUpdatingId(expenseId);
    try {
      await expenseService.markAsPaid(expenseId.toString());
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? { ...e, status: "PAID" } : e))
      );
      if (selectedExpense?.id === expenseId) {
        setSelectedExpense({ ...selectedExpense, status: "PAID" });
      }
      toast.success("Marked as paid");
    } catch {
      toast.error("Failed to mark as paid");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
        <button
          onClick={() => navigate({ to: "/dashboard/expenses/add" })}
          className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Approved</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Paid</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{paidCount}</p>
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Category</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Description</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Amount</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Date</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No expenses recorded yet
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <td className={`px-6 py-4 font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 text-slate-900">{expense.description}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {expense.currency} {expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          expense.status
                        )}`}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedExpense(expense);
                          setIsDetailOpen(true);
                        }}
                        className="inline-flex items-center gap-2 text-[#3f0ee3] hover:text-[#3f0ee3]/80 font-medium transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign size={24} className="text-[#3f0ee3]" />
                <h2 className="text-xl font-bold text-slate-900">Expense Details</h2>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Category & Amount */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Overview</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Category</p>
                    <p className={`font-medium mt-1 ${getCategoryColor(selectedExpense.category)}`}>
                      {selectedExpense.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Description</p>
                    <p className="font-medium text-slate-900">{selectedExpense.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Amount</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedExpense.currency} {selectedExpense.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Dates */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Status & Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        selectedExpense.status
                      )}`}
                    >
                      {selectedExpense.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Date</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {new Date(selectedExpense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedExpense.notes && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Notes</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedExpense.notes}</p>
                </div>
              )}

              {/* Created By */}
              {selectedExpense.createdBy && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Created By</h3>
                  <div>
                    <p className="font-medium text-slate-900">
                      {selectedExpense.createdBy.firstName} {selectedExpense.createdBy.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{selectedExpense.createdBy.email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
              {selectedExpense.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleReject(selectedExpense.id)}
                    disabled={updatingId === selectedExpense.id}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedExpense.id)}
                    disabled={updatingId === selectedExpense.id}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                </>
              )}
              {selectedExpense.status === "APPROVED" && (
                <button
                  onClick={() => handleMarkPaid(selectedExpense.id)}
                  disabled={updatingId === selectedExpense.id}
                  className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark as Paid
                </button>
              )}
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
