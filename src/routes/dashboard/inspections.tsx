import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye } from "lucide-react";
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
  const navigate = useNavigate();
  const { inspections } = Route.useLoaderData();

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
                        navigate({
                          to: "/dashboard/inspections/$inspectionId",
                          params: { inspectionId: inspection.id.toString() },
                        });
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

    </div>
  );
}
