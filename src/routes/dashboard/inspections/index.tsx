import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, ClipboardCheck, Images } from "lucide-react";
import { inspectionService } from "../../../services/inspectionService";
import { useAppStore } from "../../../store";
import { Badge, EmptyState, PageHeader, Segmented } from "../../../componennts/dashboard/ui";
import type { InspectionItem } from "../../../types";

export const Route = createFileRoute("/dashboard/inspections/")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) return { inspections: [] as InspectionItem[] };
    const response = await inspectionService.getPropertyInspections(activeProperty.id.toString());
    const list = (Array.isArray(response) ? response : response?.data ?? []) as InspectionItem[];
    return { inspections: list };
  },
  component: InspectionsPage,
});

type Filter = "all" | "review" | "MOVE_IN" | "MOVE_OUT";

const tenantNameOf = (i: InspectionItem) =>
  `${i.tenancy?.tenant?.firstName ?? ""} ${i.tenancy?.tenant?.lastName ?? ""}`.trim() || "Tenant";

const photoCount = (i: InspectionItem) =>
  (i.inspectionSections ?? []).reduce((sum, s) => sum + (s.photos?.length ?? 0), 0);

/** Who still has to sign off, in the words a landlord would use. */
function approvalBadge(i: Pick<InspectionItem, "tenantApprovedAt" | "managerApprovedAt">) {
  if (i.tenantApprovedAt && i.managerApprovedAt) return <Badge tone="emerald">Approved</Badge>;
  if (!i.managerApprovedAt) return <Badge tone="amber">Needs your approval</Badge>;
  return <Badge tone="blue">Waiting on tenant</Badge>;
}

function InspectionsPage() {
  const { inspections } = Route.useLoaderData();
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = useMemo(
    () => [...inspections].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [inspections]
  );
  const needsReview = sorted.filter((i) => !i.managerApprovedAt);
  const visible = sorted.filter((i) =>
    filter === "all" ? true : filter === "review" ? !i.managerApprovedAt : i.type === filter
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspections"
        subtitle={
          needsReview.length > 0
            ? `${needsReview.length} waiting for your approval`
            : "Move-in and move-out condition records"
        }
      />

      {inspections.length > 0 && (
        <Segmented
          ariaLabel="Filter inspections"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: inspections.length },
            { value: "review", label: "To approve", count: needsReview.length },
            { value: "MOVE_IN", label: "Move-in" },
            { value: "MOVE_OUT", label: "Move-out" },
          ]}
        />
      )}

      <div className="card overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={inspections.length === 0 ? "No inspections yet" : "Nothing here"}
            message={
              inspections.length === 0
                ? "Inspections recorded in the est8Ledger mobile app at move-in and move-out show up here."
                : filter === "review"
                ? "You've approved every inspection."
                : "No inspections of this type."
            }
          />
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {visible.map((inspection) => {
              const photos = photoCount(inspection);
              return (
                <li key={inspection.id}>
                  <Link
                    to="/dashboard/inspections/$inspectionId"
                    params={{ inspectionId: inspection.id.toString() }}
                    className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50 sm:px-6"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-wide ${
                        inspection.type === "MOVE_OUT"
                          ? "bg-[#ff9500]/[0.12] text-[#c93400]"
                          : "bg-[#3f0ee3]/[0.08] text-[#3f0ee3]"
                      }`}
                      aria-hidden="true"
                    >
                      {inspection.type === "MOVE_OUT" ? "OUT" : "IN"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-slate-900 capitalize">
                        {tenantNameOf(inspection)}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-slate-500">
                        {inspection.type === "MOVE_OUT" ? "Move-out" : "Move-in"}
                        {inspection.tenancy?.unitName && ` · Unit ${inspection.tenancy.unitName}`}
                        {" · "}
                        {new Date(inspection.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {photos > 0 && (
                      <span className="hidden items-center gap-1.5 text-[13px] text-slate-500 tabular-nums sm:inline-flex">
                        <Images size={14} strokeWidth={1.75} />
                        {photos}
                      </span>
                    )}
                    <span className="hidden sm:block">{approvalBadge(inspection)}</span>
                    <ChevronRight size={16} className="shrink-0 text-slate-300 group-hover:text-slate-500" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
