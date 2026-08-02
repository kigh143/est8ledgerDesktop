import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Plus, Edit2, Trash2, BarChart3, HandCoins, Clock, CircleCheck, Wallet, Coins } from "lucide-react";
import { expenseService } from "../../../services/expenseService";
import { useAppStore } from "../../../store";
import { toast } from "react-toastify";
import { PageHeader, StatCard } from "../../../componennts/dashboard/ui";
import SlideOver from "../../../componennts/SlideOver";
import type { Expense, ExpenseStatus, ExpenseCategory } from "../../../types";

interface ExpenseSummary {
  totalExpenses: number;
  totalAmount: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

export const Route = createFileRoute("/dashboard/expenses/")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) {
      return { expenses: [], summary: null };
    }
    try {
      const [expensesRes, summaryRes] = await Promise.all([
        expenseService.getPropertyExpenses(activeProperty.id.toString()),
        expenseService.getExpenseSummary(activeProperty.id.toString()),
      ]);
      return {
        expenses: (expensesRes.data || expensesRes || []) as Expense[],
        summary: (summaryRes.data || summaryRes) as ExpenseSummary,
      };
    } catch {
      return { expenses: [], summary: null };
    }
  },
  component: ExpensesPage,
});

function ExpensesPage() {
  const navigate = useNavigate();
  const { activeProperty } = useAppStore();
  const { expenses: initialExpenses, summary } = Route.useLoaderData();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "">("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const filteredExpenses = expenses.filter((e) => {
    if (statusFilter && e.status !== statusFilter) return false;
    if (categoryFilter && e.category !== categoryFilter) return false;
    return true;
  });

  const pendingCount = filteredExpenses.filter((e) => e.status === "PENDING").length;
  const approvedCount = filteredExpenses.filter((e) => e.status === "APPROVED").length;
  const paidCount = filteredExpenses.filter((e) => e.status === "PAID").length;
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const loadFilteredExpenses = async (status: ExpenseStatus | null, category: ExpenseCategory | null) => {
    if (!activeProperty) return;
    try {
      if (status) {
        const res = await expenseService.getExpensesByStatus(activeProperty.id.toString(), status);
        setExpenses(res.data || res || []);
      } else if (category) {
        const res = await expenseService.getExpensesByCategory(activeProperty.id.toString(), category);
        setExpenses(res.data || res || []);
      }
    } catch {
      toast.error("Failed to load filtered expenses");
    }
  };

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

  const handleDelete = async (expenseId: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    setUpdatingId(expenseId);
    try {
      await expenseService.deleteExpense(expenseId.toString());
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      setIsDetailOpen(false);
      toast.success("Expense deleted successfully");
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEdit = (expenseId: number) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (expense) {
      navigate({
        to: "/dashboard/expenses/$expenseId/edit",
        params: { expenseId: expenseId.toString() },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <PageHeader
        icon={HandCoins}
        title="Expenses"
        subtitle="Track, approve, and pay property expenses"
        actions={
          <>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              aria-pressed={showAnalytics}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showAnalytics
                  ? "bg-[#3f0ee3]/10 text-[#3f0ee3]"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <BarChart3 size={20} />
              Analytics
            </button>
            <button
              onClick={() => navigate({ to: "/dashboard/expenses/add" })}
              className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </>
        }
      />

      {/* Analytics Section */}
      {showAnalytics && summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Expense Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-600">Total Expenses</p>
              <p className="text-2xl font-bold text-slate-900">{summary.totalExpenses}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Amount</p>
              <p className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(summary.totalAmount)}
              </p>
            </div>
            {summary.byStatus && Object.entries(summary.byStatus).map(([status, count]) => (
              <div key={status}>
                <p className="text-sm text-slate-600">{status}</p>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
              </div>
            ))}
          </div>
          {summary.byCategory && (
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">By Category</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(summary.byCategory).map(([category, count]) => (
                  <div key={category} className="bg-white rounded p-3 border border-slate-200">
                    <p className="text-xs text-slate-600">{category}</p>
                    <p className="text-lg font-semibold text-slate-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value as ExpenseStatus | "";
            setStatusFilter(value);
            if (value) loadFilteredExpenses(value, null);
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            const value = e.target.value as ExpenseCategory | "";
            setCategoryFilter(value);
            if (value) loadFilteredExpenses(null, value);
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="REPAIRS">Repairs</option>
          <option value="UTILITIES">Utilities</option>
          <option value="INSURANCE">Insurance</option>
          <option value="CLEANING">Cleaning</option>
          <option value="OTHER">Other</option>
        </select>
        {(statusFilter || categoryFilter) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setCategoryFilter("");
              setExpenses(initialExpenses);
            }}
            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} tone="amber" label="Pending" value={pendingCount} valueClass="text-amber-600" />
        <StatCard icon={CircleCheck} tone="blue" label="Approved" value={approvedCount} valueClass="text-blue-600" />
        <StatCard icon={Wallet} tone="emerald" label="Paid" value={paidCount} valueClass="text-emerald-600" />
        <StatCard
          icon={Coins}
          tone="slate"
          label="Total Amount"
          value={new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(totalAmount)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Category</th>
                <th className="px-6 py-3 text-left font-semibold">Description</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
                <th className="px-6 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    {expenses.length === 0 ? "No expenses recorded yet" : "No expenses match the selected filters"}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <td className={`px-6 py-4 font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 text-slate-900">{expense.description}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">
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
                    <td className="px-6 py-4 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          setSelectedExpense(expense);
                          setIsDetailOpen(true);
                        }}
                        className="inline-flex items-center gap-2 text-[#3f0ee3] hover:text-[#3f0ee3]/80 font-medium transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      {expense.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleEdit(expense.id)}
                            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            disabled={updatingId === expense.id}
                            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <SlideOver
        open={isDetailOpen && !!selectedExpense}
        onClose={() => setIsDetailOpen(false)}
        title="Expense Details"
        widthClass="max-w-lg"
        footer={
          selectedExpense && (
            <div className="flex gap-3 justify-between">
              <div className="flex gap-3">
                {selectedExpense.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleDelete(selectedExpense.id)}
                      disabled={updatingId === selectedExpense.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        handleEdit(selectedExpense.id);
                        setIsDetailOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3">
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
          )
        }
      >
        {selectedExpense && (
          <div className="space-y-6">
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
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
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
        )}
      </SlideOver>
    </div>
  );
}
