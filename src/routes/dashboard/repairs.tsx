import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, X, Wrench } from "lucide-react";
import { repairService } from "../../services/repairService";
import { useAppStore } from "../../store";
import { toast } from "react-toastify";
import type { RepairRequest, RepairStatus } from "../../types";

export const Route = createFileRoute("/dashboard/repairs")({
  loader: async () => {
    // const { activeProperty } = useAppStore.getState();
    // if (!activeProperty) {
    //   return { repairs: [] };
    // }
    // const response = await repairService.getPropertyRepairs(activeProperty.id.toString());
    // const repairs = (response.data || []) as RepairRequest[];
    return { repairs:[] };
  },
  component: RepairsPage,
});

function RepairsPage() {
  const { repairs: initialRepairs } = Route.useLoaderData();
  const [repairs, setRepairs] = useState<RepairRequest[]>(initialRepairs);
  const [selectedRepair, setSelectedRepair] = useState<RepairRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Reported</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{reportedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Completed</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{completedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Est. Total Cost</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalEstimatedCost)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Title</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Priority</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Est. Cost</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Reported Date</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {repairs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No repairs reported yet
                  </td>
                </tr>
              ) : (
                repairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-slate-50 transition-colors">
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
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {repair.estimatedCost
                        ? `${repair.currency} ${repair.estimatedCost}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(repair.reportedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedRepair(repair);
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
      {isDetailOpen && selectedRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wrench size={24} className="text-[#3f0ee3]" />
                <h2 className="text-xl font-bold text-slate-900">Repair Details</h2>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
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
                      value={selectedRepair.status}
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
