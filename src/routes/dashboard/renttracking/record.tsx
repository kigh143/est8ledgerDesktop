import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../../store";
import { tenancyService } from "../../../services/tenancyService";
import { rentPaymentsService } from "../../../services/rentPaymentsService";
import { toast } from "react-toastify";
import type { Tenancy } from "../../../types";

type SearchParams = {
  tenancyId?: string;
};

export const Route = createFileRoute("/dashboard/renttracking/record")({
  component: RecordPaymentPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    tenancyId: search.tenancyId as string | undefined,
  }),
});

function RecordPaymentPage() {
  const navigate = useNavigate();
  const { activeProperty } = useAppStore();
  const searchParams = useSearch({ from: "/dashboard/renttracking/record" });
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);

  const [formData, setFormData] = useState({
    tenancyId: searchParams.tenancyId || "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    paymentReference: "",
  });

  useEffect(() => {
    loadData();
  }, [activeProperty?.id]);

  const loadData = async () => {
    try {
      setFormLoading(true);

      if (!activeProperty) {
        toast.error("No property selected");
        return;
      }

      // Fetch tenancies for this property
      const tenanciesResponse = await tenancyService.getPropertyTenancies(
        activeProperty.id.toString()
      );
      const tenanciesData = Array.isArray(tenanciesResponse)
        ? tenanciesResponse
        : tenanciesResponse.data || [];
      setTenancies(tenanciesData);

      // Pre-fill the rent amount when a tenant was pre-selected (e.g. from a tenant profile)
      if (searchParams.tenancyId) {
        const preselected = tenanciesData.find(
          (t: Tenancy) => t.id.toString() === searchParams.tenancyId
        );
        if (preselected?.rentAmount) {
          setFormData((prev) => ({ ...prev, amount: preselected.rentAmount!.toString() }));
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // When the tenant changes, default the amount to their monthly rent
      if (field === "tenancyId") {
        const tenancy = tenancies.find((t) => t.id.toString() === value);
        if (tenancy?.rentAmount) {
          next.amount = tenancy.rentAmount.toString();
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.tenancyId ||
      !formData.amount ||
      !formData.paymentReference
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!activeProperty) {
      toast.error("No property selected");
      return;
    }

    setLoading(true);
    try {
      await rentPaymentsService.createRentPayment({
        tenancyId: parseInt(formData.tenancyId),
        monthPaidFor: formData.month,
        yearPaidFor: formData.year,
        amount: parseFloat(formData.amount),
        currency: activeProperty.currency || "UGX",
        propertyAgreementId: activeProperty.id,
        paymentReference: formData.paymentReference,
      });

      toast.success("Payment recorded successfully");
      navigate({ to: "/dashboard/renttracking" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  if (formLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#3f0ee3]/20 border-t-[#3f0ee3] rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/dashboard/renttracking" })}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Record Rent Payment</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tenant Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tenant <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tenancyId}
              onChange={(e) => handleInputChange("tenancyId", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
            >
              <option value="">Select tenant</option>
              {tenancies.map((tenancy: Tenancy) => (
                <option key={tenancy.id} value={tenancy.id}>
                  {tenancy.tenant?.firstName} {tenancy.tenant?.lastName} - {tenancy.unitName}
                </option>
              ))}
            </select>
          </div>

    
          {/* Payment Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.month}
                onChange={(e) => handleInputChange("month", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.year}
                onChange={(e) => handleInputChange("year", parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
            />
          </div>

          {/* Payment Reference */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Payment Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., TXN123456, MTN Mobile Money ref, etc."
              value={formData.paymentReference}
              onChange={(e) => handleInputChange("paymentReference", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard/renttracking" })}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
