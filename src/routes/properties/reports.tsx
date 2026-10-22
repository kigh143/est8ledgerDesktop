import { createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import PropertiesLayout from "../../componennts/PropertiesLayout";
import ReportView from "../../componennts/reports/ReportView";
import { parseReportSearch } from "../../utils/reportFormat";
import reportService, { type ReportQuery } from "../../services/reportService";
import { useAppStore } from "../../store";
import { getNetworkError } from "../../utils";

export const Route = createFileRoute("/properties/reports")({
  beforeLoad: () => {
    const { token } = useAppStore.getState();
    if (!token) throw redirect({ to: "/login" });
  },
  validateSearch: (search: Record<string, unknown>): ReportQuery => parseReportSearch(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      return { report: await reportService.get(deps), error: null };
    } catch (e) {
      return { report: null, error: getNetworkError(e) };
    }
  },
  component: ReportsPage,
});

function ReportsPage() {
  const { report, error } = Route.useLoaderData();
  const query = Route.useSearch();
  const navigate = Route.useNavigate();
  const loading = useRouterState({ select: (s) => s.status === "pending" });

  return (
    <PropertiesLayout pageTitle="Reports" subTitle="Monthly, quarterly and yearly results for each property and your whole portfolio">
      <ReportView
        query={query}
        report={report}
        error={error}
        loading={loading}
        showPropertyPicker
        onChange={(next) => navigate({ search: next, replace: true })}
      />
    </PropertiesLayout>
  );
}
