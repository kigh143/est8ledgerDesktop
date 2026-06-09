import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, ClipboardCheck, LogIn, LogOut, CheckCircle2, ShieldCheck } from "lucide-react";
import { inspectionService } from "../../services/inspectionService";
import { useAppStore } from "../../store";
import { PageHeader, StatCard, EmptyState } from "../../componennts/dashboard/ui";
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
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
          <CheckCircle2 size={14} /> Both approved
        </span>
      );
    }
    if (inspection.tenantApprovedAt) {
      return (
        <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold">
          <CheckCircle2 size={14} /> Tenant only
        </span>
      );
    }
    if (inspection.managerApprovedAt) {
      return (
        <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold">
          <CheckCircle2 size={14} /> Manager only
        </span>
      );
    }
    return <span className="text-slate-400 text-xs">Pending approval</span>;
  };

  const tenantName = (i: InspectionItem) =>
    i.tenancy?.tenant
      ? `${i.tenancy.tenant.firstName ?? ""} ${i.tenancy.tenant.lastName ?? ""}`.trim()
      : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardCheck}
        title="Inspections"
        subtitle="Move-in and move-out inspection records"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} tone="violet" label="Total Inspections" value={inspections.length} />
        <StatCard icon={LogIn} tone="purple" label="Move-In" value={moveInCount} />
        <StatCard icon={LogOut} tone="orange" label="Move-Out" value={moveOutCount} />
        <StatCard icon={ShieldCheck} tone="emerald" label="Completed" value={completedCount} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {inspections.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No inspections yet"
            message="Move-in and move-out inspections for this property will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Tenant</th>
                  <th className="px-6 py-3 text-left font-semibold">Unit</th>
                  <th className="px-6 py-3 text-left font-semibold">Type</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Approval</th>
                  <th className="px-6 py-3 text-left font-semibold">Created</th>
                  <th className="px-6 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.map((inspection: InspectionItem) => (
                  <tr
                    key={inspection.id}
                    onClick={() =>
                      navigate({
                        to: "/dashboard/inspections/$inspectionId",
                        params: { inspectionId: inspection.id.toString() },
                      })
                    }
                    className="group hover:bg-[#3f0ee3]/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 capitalize">
                      {tenantName(inspection)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{inspection.tenancy?.unitName || "—"}</td>
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
    </div>
  );
}
