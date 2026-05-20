import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import tenancyService from "../../../../services/tenancyService";
import { toast } from "react-toastify";
import type { TenancyAgreement } from "../../../../types";

export const Route = createFileRoute("/dashboard/tenants/edit/$tenantId")({
  component: EditTenantPage,
});

function EditTenantPage() {
  const navigate = useNavigate();
  const { tenantId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenancy, setTenancy] = useState<TenancyAgreement | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryId: "",
    unitName: "",
    rentAmount: "",
    securityDeposit: "",
    waterMeter: "",
    yakaMeter: "",
    wasteHandledBy: "TENANT" as "TENANT" | "LANDLORD",
    day_of_rent_payment: "",
    late_paymeny_percentage: "",
    days_of_late_payment: "",
  });

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const tenancyRes = await tenancyService.getTenancy(tenantId);

      const tenancyData = tenancyRes.data || tenancyRes;
      setTenancy(tenancyData);

      // Populate form with existing data
      setFormData({
        firstName: tenancyData.tenant?.firstName || "",
        lastName: tenancyData.tenant?.lastName || "",
        email: tenancyData.tenant?.email || "",
        phoneNumber: tenancyData.tenant?.phoneNumber || "",
        countryId: tenancyData.propertyAgreement?.countryId?.toString() || "",
        unitName: tenancyData.unitName || "",
        rentAmount: tenancyData.rentAmount?.toString() || "",
        securityDeposit: tenancyData.securityDeposit?.toString() || "",
        waterMeter: tenancyData.waterMeter || "",
        yakaMeter: tenancyData.yakaMeter || "",
        wasteHandledBy: tenancyData.wasteHandledBy || "TENANT",
        day_of_rent_payment: tenancyData.day_of_rent_payment?.toString() || "1",
        late_paymeny_percentage: tenancyData.late_paymeny_percentage?.toString() || "10",
        days_of_late_payment: tenancyData.days_of_late_payment?.toString() || "3",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tenant data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Please enter full name");
      return;
    }

    if (!formData.email.trim() || !formData.phoneNumber.trim()) {
      toast.error("Please enter email and phone number");
      return;
    }

    if (!formData.unitName.trim()) {
      toast.error("Please enter unit name");
      return;
    }

    if (!formData.rentAmount || parseFloat(formData.rentAmount) <= 0) {
      toast.error("Please enter valid rent amount");
      return;
    }

    if (!tenancy) {
      toast.error("Tenancy data not found");
      return;
    }

    setSaving(true);
    try {
      await tenancyService.updateTenancy({
        id:tenancy.id,
        unitName: formData.unitName,
        rentAmount: parseFloat(formData.rentAmount),
        securityDeposit: parseFloat(formData.securityDeposit) || 0,
        waterMeter: formData.waterMeter,
        yakaMeter: formData.yakaMeter,
        wasteHandledBy: formData.wasteHandledBy,
        day_of_rent_payment: parseInt(formData.day_of_rent_payment),
        late_paymeny_percentage: parseFloat(formData.late_paymeny_percentage),
        days_of_late_payment: parseInt(formData.days_of_late_payment),
      });

      toast.success("Tenant updated successfully");
      navigate({ to: `/dashboard/tenants/${tenantId}` });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update tenant");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#3f0ee3]/20 border-t-[#3f0ee3] rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: `/dashboard/tenants/${tenantId}` })}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Edit Tenant</h1>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="John"
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Contact info cannot be changed here</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Doe"
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Contact info cannot be changed here</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Contact info cannot be changed here</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Contact info cannot be changed here</p>
              </div>
            </div>
          </div>

          {/* Tenancy Information */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tenancy Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Unit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.unitName}
                  onChange={(e) => handleInputChange("unitName", e.target.value)}
                  placeholder="Unit A, Floor 1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Monthly Rent <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.rentAmount}
                  onChange={(e) => handleInputChange("rentAmount", e.target.value)}
                  placeholder="500000"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Security Deposit
                </label>
                <input
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => handleInputChange("securityDeposit", e.target.value)}
                  placeholder="1000000"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Waste Management <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.wasteHandledBy}
                  onChange={(e) =>
                    handleInputChange("wasteHandledBy", e.target.value as "TENANT" | "LANDLORD")
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                >
                  <option value="TENANT">Tenant Handles</option>
                  <option value="LANDLORD">Landlord Handles</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Terms</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Day of Rent Payment <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.days_of_late_payment}
                  onChange={(e) => handleInputChange("days_of_late_payment", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day.toString()}>
                      Day {day}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">The day each month when rent is due</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Days Before Late <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.day_of_rent_payment}
                  onChange={(e) => handleInputChange("day_of_rent_payment", e.target.value)}
                  placeholder="3"
                  min="0"
                  max="31"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Days after due date before payment is late</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Late Payment Penalty (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.late_paymeny_percentage}
                  onChange={(e) => handleInputChange("late_paymeny_percentage", e.target.value)}
                  placeholder="10"
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Percentage of rent charged as penalty</p>
              </div>
            </div>
          </div>
          {/* Utilities */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Utilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Water Meter
                </label>
                <input
                  type="text"
                  value={formData.waterMeter}
                  onChange={(e) => handleInputChange("waterMeter", e.target.value)}
                  placeholder="Meter number or N/A"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  YAKA Meter
                </label>
                <input
                  type="text"
                  value={formData.yakaMeter}
                  onChange={(e) => handleInputChange("yakaMeter", e.target.value)}
                  placeholder="Meter number or N/A"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              To change the tenant's personal information (name, email, phone), please contact the tenant directly or
              create a new tenancy agreement.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate({ to: `/dashboard/tenants/${tenantId}` })}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
