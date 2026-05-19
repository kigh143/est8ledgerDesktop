import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "../../../store";
import tenancyService from "../../../services/tenancyService";
import configurationService from "../../../services/config";
import { toast } from "react-toastify";
import type { Country } from "../../../types";

export const Route = createFileRoute("/dashboard/tenants/add")({
  component: AddTenantPage,
});

function AddTenantPage() {
  const navigate = useNavigate();
  const { activeProperty } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);

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
  });

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const response = await configurationService.getCountries();
      const countryList = Array.isArray(response) ? response : response.data || [];
      setCountries(countryList);
    } catch (error) {
      toast.error("Failed to load countries");
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

    if (!activeProperty) {
      toast.error("No property selected");
      return;
    }

    setLoading(true);
    try {
      const selectedCountry = countries.find((val: any) => +val.id === +formData.countryId);
      // return;
      const dialCode = selectedCountry?.dialingCode || '';
      const phoneWithoutDialCode = dialCode ? formData.phoneNumber.replace(dialCode, '').trim() : formData.phoneNumber.trim();
      const fullPhoneNumber = formData.phoneNumber.startsWith(dialCode) ? formData.phoneNumber : `${dialCode}${phoneWithoutDialCode}`;

      // Prepare tenancy data with tenant information
      const tenancyPayload = {
        tenant: {
          tenantName: `${formData.lastName} ${formData.lastName}`,
          tenantEmail: formData.email.toLowerCase().trim(),
          tenantPhone: fullPhoneNumber.replace(/\s/g, ''),
        },
        tenancy: {
          rentAmount: parseFloat(formData.rentAmount),
          securityDeposit: parseInt(formData.securityDeposit.replace(/[^0-9.]/g, '')),
          unitName: formData.unitName,
          yakaMeter: formData.yakaMeter || '',
          waterMeter: formData.waterMeter || '',
          wasteHandledBy: formData.wasteHandledBy,
          propertyAgreementId: activeProperty.id
        }
      };

      // Create tenancy agreement
      await tenancyService.createTenancy(tenancyPayload);

      toast.success("Tenant added successfully");
      navigate({ to: "/dashboard/tenants" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to add tenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: "/dashboard/tenants" })}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Add New Tenant</h1>
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="+256700000000"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.countryId}
                  onChange={(e) => handleInputChange("countryId", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id.toString()}>
                      {country.name}
                    </option>
                  ))}
                </select>
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

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard/tenants" })}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
