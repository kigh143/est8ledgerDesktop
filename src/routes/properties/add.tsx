import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Home,
  FileText,
  Scroll,
  Loader,
  Plus,
  X,
  Info,
  Building2,
  ShieldCheck,
  CalendarClock,
  Wallet,
  Gavel,
} from "lucide-react";
import { useAppStore } from "../../store";
import PropertiesLayout from "../../componennts/PropertiesLayout";
import SlideOver from "../../componennts/SlideOver";
import { agreementService } from "../../services/agreementService";
import { configurationService } from "../../services/config";
import { toast } from "react-toastify";

export const Route = createFileRoute("/properties/add")({
  component: AddPropertyPage,
});

interface CustomClause {
  id: string;
  title: string;
  description: string;
  body: string;
}

interface PropertyFormData {
  // Step 1
  propertyType: string;
  propertyName: string;
  district: string;
  city: string;
  propertyAddress: string;
  numberOfUnits: string;

  // Step 2
  currency: string;
  securityDepositMonths: string;
  initialAdvanceMonths: string;
  terminationNoticeDays: string;
  rentIncreaseNoticeDays: string;
  evictionProcess: string;
  maxSecurityDepositMonths: string;

  // Step 3
  selectedClauseIds: number[];
  customClauses: CustomClause[];
}

function AddPropertyPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clausesLoading, setClausesLoading] = useState(false);
  const [countryConfigLoading, setCountryConfigLoading] = useState(true);
  const [clauses, setClauses] = useState<any[]>([]);
  const [countryConfig, setCountryConfig] = useState<any>(null);
  const [showCustomClauseModal, setShowCustomClauseModal] = useState(false);
  const [customClauseForm, setCustomClauseForm] = useState({
    title: "",
    description: "",
    body: "",
  });

  const [formData, setFormData] = useState<PropertyFormData>({
    propertyType: "",
    propertyName: "",
    district: "",
    city: "",
    propertyAddress: "",
    numberOfUnits: "",
    currency: "UGX",
    securityDepositMonths: "",
    initialAdvanceMonths: "",
    terminationNoticeDays: "",
    rentIncreaseNoticeDays: "",
    evictionProcess: "",
    maxSecurityDepositMonths: "",
    selectedClauseIds: [],
    customClauses: [],
  });

  // Load country configuration on mount
  useEffect(() => {
    loadCountryConfiguration();
  }, []);

  // Load clauses when moving to step 3
  useEffect(() => {
    if (currentStep === 3 && clauses.length === 0) {
      loadClauses();
    }
  }, [currentStep]);

  const loadCountryConfiguration = async () => {
    try {
      setCountryConfigLoading(true);
      if (!user?.countryId) {
        toast.error("User country not found");
        return;
      }

      const countryResponse = await configurationService.getCountryById(
        user.countryId
      );
      const country = countryResponse.data || countryResponse;
      setCountryConfig(country);

      // Pre-fill Step 2 with country defaults
      setFormData((prev) => ({
        ...prev,
        currency: country.currency || "UGX",
        securityDepositMonths: country.securityDepositMonths?.toString() || "",
        initialAdvanceMonths: country.initialAdvanceMonths?.toString() || "",
        terminationNoticeDays: country.terminationNoticeDays?.toString() || "",
        rentIncreaseNoticeDays: country.rentIncreaseNoticeDays?.toString() || "",
        evictionProcess: country.evictionProcess || "",
        maxSecurityDepositMonths:
          country.maxSecurityDepositMonths?.toString() || "",
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load country configuration");
    } finally {
      setCountryConfigLoading(false);
    }
  };

  const loadClauses = async () => {
    try {
      setClausesLoading(true);
      if (!user?.countryId) {
        toast.error("User country not found");
        return;
      }

      const countryResponse = await configurationService.getCountryById(
        user.countryId
      );
      const country = countryResponse.data || countryResponse;
      const countryClausesList: any[] = country.CountryClause?.map(
        (cc: any) => cc.clause
      ) || [];
      setClauses(countryClausesList);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load clauses");
    } finally {
      setClausesLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleClause = (clauseId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedClauseIds: prev.selectedClauseIds.includes(clauseId)
        ? prev.selectedClauseIds.filter((id) => id !== clauseId)
        : [...prev.selectedClauseIds, clauseId],
    }));
  };

  const handleAddCustomClause = () => {
    if (!customClauseForm.title.trim() || !customClauseForm.description.trim() || !customClauseForm.body.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const newCustomClause: CustomClause = {
      id: `custom-${Date.now()}`,
      title: customClauseForm.title,
      description: customClauseForm.description,
      body: customClauseForm.body,
    };

    setFormData((prev) => ({
      ...prev,
      customClauses: [...prev.customClauses, newCustomClause],
    }));

    setCustomClauseForm({ title: "", description: "", body: "" });
    setShowCustomClauseModal(false);
    toast.success("Custom clause added!");
  };

  const removeCustomClause = (clauseId: string) => {
    setFormData((prev) => ({
      ...prev,
      customClauses: prev.customClauses.filter((c) => c.id !== clauseId),
    }));
    toast.success("Custom clause removed");
  };

  const validateStep1 = () => {
    if (
      !formData.propertyType ||
      !formData.propertyName ||
      !formData.district ||
      !formData.city ||
      !formData.propertyAddress ||
      !formData.numberOfUnits
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (
      !formData.currency ||
      !formData.securityDepositMonths ||
      !formData.initialAdvanceMonths ||
      !formData.terminationNoticeDays ||
      !formData.rentIncreaseNoticeDays ||
      !formData.evictionProcess
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (!user) {
        toast.error("User not found");
        return;
      }

      const propertyData = {
        propertyType: formData.propertyType,
        propertyName: formData.propertyName,
        district: formData.district,
        city: formData.city,
        propertyAddress: formData.propertyAddress,
        numberOfUnits: parseInt(formData.numberOfUnits),
        currency: formData.currency,
        securityDepositMonths: parseInt(formData.securityDepositMonths),
        initialAdvanceMonths: parseInt(formData.initialAdvanceMonths),
        terminationNoticeDays: parseInt(formData.terminationNoticeDays),
        rentIncreaseNoticeDays: parseInt(formData.rentIncreaseNoticeDays),
        evictionProcess: formData.evictionProcess,
        maxSecurityDepositMonths: formData.maxSecurityDepositMonths
          ? parseInt(formData.maxSecurityDepositMonths)
          : null,
        ownerId: user.id,
        selectedClauseIds: formData.selectedClauseIds,
        customClauses: formData.customClauses,
        countryId: user.countryId
      };

      await agreementService.createPropertyAgreement(propertyData);
      toast.success("Property added successfully!");
      navigate({ to: "/properties" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to add property");
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = ["Residential", "Commercial", "Mixed-Use"];

  if (countryConfigLoading) {
    return (
      <PropertiesLayout
        pageTitle="Add Property"
        subTitle="Create a new property and configure its agreement terms"
      >
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader className="w-12 h-12 text-[#552ae7] animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading country configuration...</p>
          </div>
        </div>
      </PropertiesLayout>
    );
  }

  return (
    <PropertiesLayout
      pageTitle="Add Property"
      subTitle="Create a new property and configure its agreement terms"
    >
      <div className="space-y-8">
        {/* Enhanced Progress Steps */}
        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center">
            {[
              { step: 1, title: "Basic Info", icon: Home },
              { step: 2, title: "Terms", icon: FileText },
              { step: 3, title: "Clauses", icon: Scroll },
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      currentStep > step
                        ? "bg-gradient-to-br from-[#7fe502] to-[#65c200] text-white shadow-md shadow-[#7fe502]/30"
                        : currentStep === step
                          ? "bg-gradient-to-br from-[#552ae7] to-[#3f0ee3] text-white shadow-lg shadow-[#552ae7]/40 ring-4 ring-[#552ae7]/15"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {currentStep > step ? (
                      <Check size={22} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <span
                    className={`hidden sm:block text-xs font-semibold uppercase tracking-wide transition-colors ${
                      currentStep >= step ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {title}
                  </span>
                </div>
                {step < 3 && (
                  <div className="flex-1 h-1 mx-2 sm:mx-4 mb-6 sm:mb-5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentStep > step ? "w-full bg-[#7fe502]" : "w-0 bg-[#552ae7]"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10">
            {/* Step 1: Basic Property Info */}
            {currentStep === 1 && (
              <div className="space-y-7">
                <div className="mb-8 flex items-start gap-4">
                  <span className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-[#552ae7]/10 text-[#552ae7] shrink-0">
                    <Building2 size={22} />
                  </span>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                      Basic Property Information
                    </h2>
                    <p className="text-slate-500">
                      Tell us about your property's location and size
                    </p>
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) =>
                      handleInputChange("propertyType", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400 bg-white"
                  >
                    <option value="">Select property type</option>
                    {propertyTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Property Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Property Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Downtown Apartments, Green Valley Estate"
                    value={formData.propertyName}
                    onChange={(e) =>
                      handleInputChange("propertyName", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400"
                  />
                </div>

                {/* City and District */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Kampala"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Central, Nakasero"
                      value={formData.district}
                      onChange={(e) =>
                        handleInputChange("district", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 123 Main Street, Plot 45 Kampala Road"
                    value={formData.propertyAddress}
                    onChange={(e) =>
                      handleInputChange("propertyAddress", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400"
                  />
                </div>

                {/* Number of Units */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Total Units <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="How many units/apartments/rooms?"
                    min="1"
                    value={formData.numberOfUnits}
                    onChange={(e) =>
                      handleInputChange("numberOfUnits", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Terms & Conditions */}
            {currentStep === 2 && (
              <div className="space-y-7">
                <div className="mb-8 flex items-start gap-4">
                  <span className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-[#552ae7]/10 text-[#552ae7] shrink-0">
                    <FileText size={22} />
                  </span>
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                      Terms & Conditions
                    </h2>
                    <p className="text-slate-500">
                      Configure legal and financial terms for this property
                    </p>
                    {countryConfig && (
                      <div className="mt-4 flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl">
                        <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-sky-900">
                          <span className="font-semibold">Country Defaults:</span> Fields below are pre-filled with your country's standard configuration. You can customize them as needed.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      handleInputChange("currency", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400 bg-white"
                  >
                    <option value="UGX">UGX — Ugandan Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </select>
                </div>

                {/* Security Deposit Section */}
                <div className="rounded-xl p-6 border border-violet-200 bg-violet-50/60">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                    <ShieldCheck size={18} className="text-violet-600" />
                    Security Deposit (months)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Security Deposit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 1"
                        min="0"
                        value={formData.securityDepositMonths}
                        onChange={(e) =>
                          handleInputChange("securityDepositMonths", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Max Security Deposit
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 3"
                        min="0"
                        value={formData.maxSecurityDepositMonths}
                        onChange={(e) =>
                          handleInputChange("maxSecurityDepositMonths", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Notice Periods Section */}
                <div className="rounded-xl p-6 border border-amber-200 bg-amber-50/60">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                    <CalendarClock size={18} className="text-amber-600" />
                    Notice Periods (Days)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Termination Notice <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 30"
                        min="0"
                        value={formData.terminationNoticeDays}
                        onChange={(e) =>
                          handleInputChange("terminationNoticeDays", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Rent Increase Notice <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 30"
                        min="0"
                        value={formData.rentIncreaseNoticeDays}
                        onChange={(e) =>
                          handleInputChange("rentIncreaseNoticeDays", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Advance Payment Section */}
                <div className="rounded-xl p-6 border border-emerald-200 bg-emerald-50/60">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                    <Wallet size={18} className="text-emerald-600" />
                    Initial Advance (months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 1"
                    min="0"
                    value={formData.initialAdvanceMonths}
                    onChange={(e) =>
                      handleInputChange("initialAdvanceMonths", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400 bg-white"
                  />
                </div>

                {/* Eviction Process */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                    <Gavel size={18} className="text-slate-500" />
                    Eviction Process <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Describe the eviction process and steps involved..."
                    rows={5}
                    value={formData.evictionProcess}
                    onChange={(e) =>
                      handleInputChange("evictionProcess", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Select Clauses */}
            {currentStep === 3 && (
              <div className="space-y-7">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-[#552ae7]/10 text-[#552ae7] shrink-0">
                      <Scroll size={22} />
                    </span>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                        Select Agreement Clauses
                      </h2>
                      <p className="text-slate-500">
                        Choose the clauses you want to include in this property agreement
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCustomClauseModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#552ae7] to-[#3f0ee3] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#552ae7]/30 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
                  >
                    <Plus size={18} />
                    Add Custom Clause
                  </button>
                </div>

                {clausesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center">
                      <Loader className="w-10 h-10 text-[#552ae7] animate-spin mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Loading clauses...</p>
                    </div>
                  </div>
                ) : clauses.length > 0 || formData.customClauses.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {/* Standard Clauses */}
                    {clauses.map((clause: any) => (
                      <div
                        key={clause.id}
                        onClick={() => toggleClause(clause.id)}
                        className={`p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                          formData.selectedClauseIds.includes(clause.id)
                            ? "border-[#552ae7] bg-[#552ae7]/5 shadow-sm shadow-[#552ae7]/10"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-1 shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                              formData.selectedClauseIds.includes(clause.id)
                                ? "border-[#552ae7] bg-[#552ae7]"
                                : "border-slate-300"
                            }`}
                          >
                            {formData.selectedClauseIds.includes(clause.id) && (
                              <Check size={18} className="text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 text-base">
                              {clause.title}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {clause.description}
                            </p>
                            {clause.body && (
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                {clause.body}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Custom Clauses */}
                    {formData.customClauses.map((clause) => (
                      <div
                        key={clause.id}
                        className="p-5 border-2 border-emerald-300 bg-emerald-50 rounded-xl transition-all hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1 shrink-0 w-6 h-6 rounded border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center">
                            <Check size={18} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-slate-900 text-base">
                                  {clause.title}
                                </h3>
                                <p className="text-xs text-emerald-700 font-medium mt-1">Custom Clause</p>
                              </div>
                              <button
                                onClick={() => removeCustomClause(clause.id)}
                                className="p-1 hover:bg-emerald-200 rounded text-emerald-700 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">
                              {clause.description}
                            </p>
                            {clause.body && (
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                {clause.body}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-600">No clauses available. Try adding a custom clause!</p>
                  </div>
                )}

                {/* Summary */}
                {(clauses.length > 0 || formData.customClauses.length > 0) && (
                  <div className="bg-gradient-to-r from-[#552ae7]/5 to-[#3f0ee3]/5 border-2 border-[#552ae7]/20 rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-2">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">Standard Clauses:</span>{" "}
                      <span className="text-lg font-bold text-[#552ae7]">{formData.selectedClauseIds.length}</span> selected
                    </p>
                    {formData.customClauses.length > 0 && (
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Custom Clauses:</span>{" "}
                        <span className="text-lg font-bold text-emerald-600">{formData.customClauses.length}</span> added
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Custom Clause Modal */}
            <SlideOver
              open={showCustomClauseModal}
              onClose={() => {
                setShowCustomClauseModal(false);
                setCustomClauseForm({ title: "", description: "", body: "" });
              }}
              title="Add Custom Clause"
              widthClass="max-w-lg"
              footer={
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCustomClauseModal(false);
                      setCustomClauseForm({ title: "", description: "", body: "" });
                    }}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomClause}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#552ae7] to-[#3f0ee3] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#552ae7]/30 active:scale-[0.98] transition-all"
                  >
                    Add Clause
                  </button>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Clause Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Late Payment Penalty"
                    value={customClauseForm.title}
                    onChange={(e) =>
                      setCustomClauseForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of the clause"
                    value={customClauseForm.description}
                    onChange={(e) =>
                      setCustomClauseForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Full Clause Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Enter the complete clause text..."
                    rows={6}
                    value={customClauseForm.body}
                    onChange={(e) =>
                      setCustomClauseForm((prev) => ({
                        ...prev,
                        body: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#552ae7]/30 focus:border-[#552ae7] outline-none transition-colors hover:border-slate-400 resize-none"
                  />
                </div>
              </div>
            </SlideOver>

            {/* Navigation Buttons */}
            <div className="mt-10 flex gap-3 justify-between border-t border-slate-200 pt-8">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 sm:px-7 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                <span className="hidden sm:inline">Previous Step</span>
                <span className="sm:hidden">Back</span>
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-[#552ae7] to-[#3f0ee3] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#552ae7]/30 active:scale-[0.98] transition-all"
                >
                  Next Step
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader size={20} className="animate-spin" />
                  ) : (
                    <Check size={20} />
                  )}
                  {loading ? "Creating Property..." : "Create Property"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PropertiesLayout>
  );
}
