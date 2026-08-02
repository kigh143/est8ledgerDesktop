import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Wrench, CheckCircle, Clock, AlertTriangle, Loader, CircleCheck, Coins } from "lucide-react";
import { repairService } from "../../services/repairService";
import { useAppStore } from "../../store";
import { toast } from "react-toastify";
import { PageHeader, StatCard, EmptyState } from "../../componennts/dashboard/ui";
import SlideOver from "../../componennts/SlideOver";
import type { RepairRequest, RepairStatus } from "../../types";

type RepairRequestDetail = RepairRequest & {
  notes?: string;
  estimatedAmount?: number;
  applications?: Array<{
    id: number;
    contractorId: number;
    quotedAmount: number;
    comment: string;
    status: string;
    contractor?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
};

export const Route = createFileRoute("/dashboard/repairs")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) {
      return { repairs: [] };
    }
    try {
      const response = await repairService.getManagementRepairs(activeProperty.id.toString());
      return { repairs: (response.data || response || []) as RepairRequestDetail[] };
    } catch {
      return { repairs: [] };
    }
  },
  component: RepairsPage,
});

function RepairsPage() {
  const { repairs: initialRepairs } = Route.useLoaderData();
  const [repairs, setRepairs] = useState<RepairRequestDetail[]>(initialRepairs);
  const [selectedRepair, setSelectedRepair] = useState<RepairRequestDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [assignMode, setAssignMode] = useState(false);
  const [applyMode, setApplyMode] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [contractorId, setContractorId] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [quotedAmount, setQuotedAmount] = useState("");
  const [comment, setComment] = useState("");

  const reportedCount = repairs.filter((r) => r.status === "REPORTED").length;
  const inProgressCount = repairs.filter((r) => r.status === "IN_PROGRESS").length;
  const completedCount = repairs.filter((r) => r.status === "COMPLETED").length;
  const totalEstimatedCost = repairs.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);

  const getStatusColor = (status: RepairStatus) => {
    switch (status) {
      case "REPORTED":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800";
      case "CANCELLED":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600 font-semibold";
      case "HIGH":
        return "text-orange-600 font-semibold";
      case "MEDIUM":
        return "text-amber-600";
      case "LOW":
        return "text-slate-600";
      default:
        return "text-slate-600";
    }
  };

  const handleStatusUpdate = async (repairId: number, newStatus: RepairStatus) => {
    setUpdatingId(repairId);
    try {
      await repairService.updateRepairStatus(repairId.toString(), newStatus);
      setRepairs((prevRepairs) =>
        prevRepairs.map((r) => (r.id === repairId ? { ...r, status: newStatus } : r))
      );
      if (selectedRepair?.id === repairId) {
        setSelectedRepair({ ...selectedRepair, status: newStatus });
      }
      toast.success("Status updated successfully");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReviewRepair = async () => {
    if (!selectedRepair?.id || !reviewNotes.trim()) {
      toast.error("Please enter review notes");
      return;
    }
    setUpdatingId(selectedRepair.id);
    try {
      await repairService.reviewRepairRequest(selectedRepair.id.toString(), {
        status: "MGT_REVIEWED",
        notes: reviewNotes,
      });
      setRepairs((prev) =>
        prev.map((r) =>
          r.id === selectedRepair.id
            ? { ...r, status: "MGT_REVIEWED", notes: reviewNotes }
            : r
        )
      );
      setSelectedRepair({ ...selectedRepair, status: "MGT_REVIEWED", notes: reviewNotes });
      setReviewMode(false);
      setReviewNotes("");
      toast.success("Repair request reviewed successfully");
    } catch {
      toast.error("Failed to review repair request");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignContractor = async () => {
    if (!selectedRepair?.id || !contractorId || !estimatedAmount) {
      toast.error("Please fill in all fields");
      return;
    }
    setUpdatingId(selectedRepair.id);
    try {
      await repairService.assignContractor(selectedRepair.id.toString(), {
        contractorId: parseInt(contractorId),
        estimatedAmount: parseFloat(estimatedAmount),
      });
      setRepairs((prev) =>
        prev.map((r) =>
          r.id === selectedRepair.id
            ? {
                ...r,
                estimatedAmount: parseFloat(estimatedAmount),
                status: "ASSIGNED",
              }
            : r
        )
      );
      setSelectedRepair({
        ...selectedRepair,
        estimatedAmount: parseFloat(estimatedAmount),
        status: "ASSIGNED",
      });
      setAssignMode(false);
      setContractorId("");
      setEstimatedAmount("");
      toast.success("Contractor assigned successfully");
    } catch {
      toast.error("Failed to assign contractor");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyForRepair = async () => {
    if (!selectedRepair?.id || !quotedAmount || !comment.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setUpdatingId(selectedRepair.id);
    try {
      await repairService.applyForRepair(selectedRepair.id.toString(), {
        quotedAmount: parseFloat(quotedAmount),
        comment,
      });
      setApplyMode(false);
      setQuotedAmount("");
      setComment("");
      toast.success("Application submitted successfully");
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setUpdatingId(null);
    }
  };

  const currency = repairs[0]?.currency || "UGX";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title="Repairs"
        subtitle="Maintenance requests and contractor assignments"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} tone="red" label="Reported" value={reportedCount} valueClass="text-red-600" />
        <StatCard icon={Loader} tone="blue" label="In Progress" value={inProgressCount} valueClass="text-blue-600" />
        <StatCard icon={CircleCheck} tone="emerald" label="Completed" value={completedCount} valueClass="text-emerald-600" />
        <StatCard
          icon={Coins}
          tone="slate"
          label="Est. Total Cost"
          value={`${currency} ${new Intl.NumberFormat("en-US").format(Math.round(totalEstimatedCost))}`}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {repairs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No repairs reported"
            message="Maintenance requests for this property will show up here as tenants report them."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Title</th>
                  <th className="px-6 py-3 text-left font-semibold">Priority</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Est. Cost</th>
                  <th className="px-6 py-3 text-left font-semibold">Reported Date</th>
                  <th className="px-6 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repairs.map((repair) => (
                  <tr
                    key={repair.id}
                    onClick={() => {
                      setSelectedRepair(repair);
                      setIsDetailOpen(true);
                    }}
                    className="group hover:bg-[#3f0ee3]/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{repair.title}</td>
                    <td className={`px-6 py-4 ${getPriorityColor(repair.priority)}`}>
                      {repair.priority}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          repair.status
                        )}`}
                      >
                        {repair.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {repair.estimatedCost
                        ? `${repair.currency} ${Number(repair.estimatedCost).toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(repair.reportedDate).toLocaleDateString()}
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
        open={isDetailOpen && !!selectedRepair}
        onClose={() => {
          setIsDetailOpen(false);
          setReviewMode(false);
          setAssignMode(false);
          setApplyMode(false);
        }}
        title="Repair Details"
        widthClass="max-w-xl"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => {
                setIsDetailOpen(false);
                setReviewMode(false);
                setAssignMode(false);
                setApplyMode(false);
              }}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedRepair && (
            <div className="space-y-6">
              {/* Title & Description */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Title</p>
                    <p className="font-medium text-slate-900">{selectedRepair.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Description</p>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {selectedRepair.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Status & Priority</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Status</p>
                    <select
                      value={(selectedRepair.status as RepairStatus) || "REPORTED"}
                      onChange={(e) =>
                        handleStatusUpdate(selectedRepair.id, e.target.value as RepairStatus)
                      }
                      disabled={updatingId === selectedRepair.id}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="REPORTED">Reported</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Priority</p>
                    <p className={`font-medium mt-2 ${getPriorityColor(selectedRepair.priority)}`}>
                      {selectedRepair.priority}
                    </p>
                  </div>
                </div>
              </div>

              {/* Costs */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Costs</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Estimated Cost</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {selectedRepair.estimatedCost
                        ? `${selectedRepair.currency} ${selectedRepair.estimatedCost}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Actual Cost</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {selectedRepair.actualCost
                        ? `${selectedRepair.currency} ${selectedRepair.actualCost}`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Reported Date</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {new Date(selectedRepair.reportedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Completion Date</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {selectedRepair.completionDate
                        ? new Date(selectedRepair.completionDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned To & Reported By */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Personnel</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Reported By</p>
                    <div className="mt-1">
                      {selectedRepair.reportedBy ? (
                        <>
                          <p className="font-medium text-slate-900">
                            {selectedRepair.reportedBy.firstName}{" "}
                            {selectedRepair.reportedBy.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedRepair.reportedBy.email}
                          </p>
                        </>
                      ) : (
                        <p className="text-slate-500">-</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Assigned To</p>
                    <div className="mt-1">
                      {selectedRepair.assignedTo ? (
                        <>
                          <p className="font-medium text-slate-900">
                            {selectedRepair.assignedTo.firstName}{" "}
                            {selectedRepair.assignedTo.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedRepair.assignedTo.email}
                          </p>
                        </>
                      ) : (
                        <p className="text-slate-500">Not assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manager Review Section */}
              {selectedRepair.status === "REPORTED" && !reviewMode && (
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Manager Review</h3>
                    <button
                      onClick={() => setReviewMode(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <CheckCircle size={16} />
                      Review
                    </button>
                  </div>
                </div>
              )}

              {/* Review Form */}
              {reviewMode && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Manager Review</h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter review notes..."
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleReviewRepair}
                      disabled={updatingId === selectedRepair.id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => {
                        setReviewMode(false);
                        setReviewNotes("");
                      }}
                      className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Contractor Assignment Section */}
              {selectedRepair.status === "MGT_REVIEWED" && !assignMode && (
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Assign Contractor</h3>
                    <button
                      onClick={() => setAssignMode(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                    >
                      <Clock size={16} />
                      Assign
                    </button>
                  </div>
                </div>
              )}

              {/* Assignment Form */}
              {assignMode && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Assign Contractor</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Contractor ID
                      </label>
                      <input
                        type="number"
                        value={contractorId}
                        onChange={(e) => setContractorId(e.target.value)}
                        placeholder="Enter contractor ID"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Estimated Amount
                      </label>
                      <input
                        type="number"
                        value={estimatedAmount}
                        onChange={(e) => setEstimatedAmount(e.target.value)}
                        placeholder="Enter estimated amount"
                        step="0.01"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleAssignContractor}
                      disabled={updatingId === selectedRepair.id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => {
                        setAssignMode(false);
                        setContractorId("");
                        setEstimatedAmount("");
                      }}
                      className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Contractor Applications */}
              {selectedRepair.applications && selectedRepair.applications.length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Contractor Applications</h3>
                  <div className="space-y-3">
                    {selectedRepair.applications.map((app) => (
                      <div
                        key={app.id}
                        className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-slate-900">
                              {app.contractor?.firstName} {app.contractor?.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{app.contractor?.email}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              app.status === "APPROVED"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Quoted: </span>
                            {app.quotedAmount}
                          </p>
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Comment: </span>
                            {app.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contractor Apply Section */}
              {selectedRepair.status === "ASSIGNED" && !applyMode && (
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Submit Application</h3>
                    <button
                      onClick={() => setApplyMode(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                    >
                      <CheckCircle size={16} />
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Apply Form */}
              {applyMode && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Submit Application</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Quoted Amount
                      </label>
                      <input
                        type="number"
                        value={quotedAmount}
                        onChange={(e) => setQuotedAmount(e.target.value)}
                        placeholder="Enter your quote"
                        step="0.01"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Comment
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add your comment..."
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleApplyForRepair}
                      disabled={updatingId === selectedRepair.id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Application
                    </button>
                    <button
                      onClick={() => {
                        setApplyMode(false);
                        setQuotedAmount("");
                        setComment("");
                      }}
                      className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
        )}
      </SlideOver>
    </div>
  );
}
