import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "../../componennts/dashboard/ui";
import ReportView from "../../componennts/reports/ReportView";
import { parseReportSearch } from "../../utils/reportFormat";
import reportService, { type ReportQuery } from "../../services/reportService";
import { useAppStore } from "../../store";
import { getNetworkError } from "../../utils";

// The property dashboard's reports are always for the active property; /properties/reports covers the portfolio.
export const Route = createFileRoute("/dashboard/reports")({
  validateSearch: (search: Record<string, unknown>): Omit<ReportQuery, "propertyId"> => {
    const { period, year, index } = parseReportSearch(search);
    return { period, year, index };
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) return { report: null, error: "Choose a property first." };
    try {
      return { report: await reportService.get({ ...deps, propertyId: activeProperty.id }), error: null };
    } catch (e) {
      return { report: null, error: getNetworkError(e) };
    }
  },
  component: PropertyReportsPage,
});

function PropertyReportsPage() {
  const { report, error } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeProperty = useAppStore((s) => s.activeProperty);
  const loading = useRouterState({ select: (s) => s.status === "pending" });

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle={`Results for ${activeProperty?.propertyName ?? "this property"}`} />
      <ReportView
        query={{ ...search, propertyId: activeProperty?.id }}
        report={report}
        error={error}
        loading={loading}
        showPropertyPicker={false}
        onChange={({ period, year, index }) => navigate({ search: { period, year, index }, replace: true })}
      />
    </div>
  );
}
