import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, X } from "lucide-react";
import { inspectionService } from "../../services/inspectionService";
import { useAppStore } from "../../store";
import type { InspectionItem } from "../../types";

export const Route = createFileRoute("/dashboard/inspections")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) {
      return { inspections: [] };
    }
    const response = await inspectionService.getPropertyInspections(
      activeProperty.id.toString()
    );
    const inspections = (response || []) as InspectionItem[];
    return { inspections };
  },
  component: InspectionsPage,
});

function InspectionsPage() {
  const { inspections } = Route.useLoaderData();
  const [selectedInspection, setSelectedInspection] = useState<InspectionItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const moveInCount = inspections.filter((i: InspectionItem) => i.type === "MOVE_IN").length;
  const moveOutCount = inspections.filter((i: InspectionItem) => i.type === "MOVE_OUT").length;
  const completedCount = inspections.filter((i: InspectionItem) => i.status === "COMPLETED").length;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800";
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "MOVE_IN":
        return "bg-purple-100 text-purple-800";
      case "MOVE_OUT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getApprovalStatus = (inspection: InspectionItem) => {
    if (inspection.tenantApprovedAt && inspection.managerApprovedAt) {
      return <span className="text-emerald-600 text-xs font-semibold">✓ Both Approved</span>;
    }
    if (inspection.tenantApprovedAt) {
      return <span className="text-blue-600 text-xs font-semibold">✓ Tenant Only</span>;
    }
    if (inspection.managerApprovedAt) {
      return <span className="text-blue-600 text-xs font-semibold">✓ Manager Only</span>;
    }
    return <span className="text-slate-400 text-xs">Pending Approval</span>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Total Inspections</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{inspections.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Move-In Inspections</p>
          <p className="mt-2 text-3xl font-bold text-purple-600">{moveInCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Move-Out Inspections</p>
          <p className="mt-2 text-3xl font-bold text-orange-600">{moveOutCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600">Completed</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{completedCount}</p>
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
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Type</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Approval</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Created</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inspections.map((inspection: InspectionItem) => (
                <tr key={inspection.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {inspection.tenancy?.unitName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{inspection.tenancy?.unitName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(inspection.type)}`}>
                      {inspection.type === "MOVE_IN" ? "Move-In" : "Move-Out"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(inspection.status)}`}>
                      {inspection.status || "PENDING"}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getApprovalStatus(inspection)}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(inspection.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedInspection(inspection);
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
      {isDetailOpen && selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Inspection Details</h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Inspection Info */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Inspection Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Type</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getTypeColor(selectedInspection.type)}`}>
                      {selectedInspection.type === "MOVE_IN" ? "Move-In" : "Move-Out"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusColor(selectedInspection.status)}`}>
                      {selectedInspection.status || "PENDING"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Created Date</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedInspection.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Last Updated</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedInspection.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tenant Info */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Tenant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Unit</p>
                    <p className="font-medium text-slate-900">{selectedInspection.tenancy?.unitName}</p>
                  </div>
                </div>
              </div>

              {/* Approval Info */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Approval Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Tenant Approved At</p>
                    <p className="font-medium text-slate-900">
                      {selectedInspection.tenantApprovedAt
                        ? new Date(selectedInspection.tenantApprovedAt).toLocaleDateString()
                        : "Not approved"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Manager Approved At</p>
                    <p className="font-medium text-slate-900">
                      {selectedInspection.managerApprovedAt
                        ? new Date(selectedInspection.managerApprovedAt).toLocaleDateString()
                        : "Not approved"}
                    </p>
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
