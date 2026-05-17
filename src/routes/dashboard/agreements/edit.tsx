import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useAppStore } from "../../../store";
import { agreementService } from "../../../services/agreementService";
import { configurationService } from "../../../services/config";
import { toast } from "react-toastify";
import type { PropertyAgreement, Clause } from "../../../types";

export const Route = createFileRoute("/dashboard/agreements/edit")({
  component: EditAgreementPage,
});

function EditAgreementPage() {
  const navigate = useNavigate();
  const { activeProperty, user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableClauses, setAvailableClauses] = useState<Clause[]>([]);
  const [selectedClauseIds, setSelectedClauseIds] = useState<number[]>([]);
  const [property, setProperty] = useState<PropertyAgreement | null>(null);

  useEffect(() => {
    loadData();
  }, [activeProperty?.id, user?.countryId]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (!activeProperty) {
        toast.error("No property selected");
        return;
      }

      if (!user) {
        toast.error("User not found");
        return;
      }

      // Load country-specific clauses
      const countryResponse = await configurationService.getCountryById(user.countryId);
      const country = countryResponse.data || countryResponse;

      // Extract clauses from country object
      const clauses: Clause[] = country.CountryClause?.map((cc: any) => cc.clause) || [];
      setAvailableClauses(clauses);

      // Load current property agreement
      const agreementResponse = await agreementService.getPropertyAgreement(
        activeProperty.id.toString()
      );
      const agreement = agreementResponse.data || agreementResponse;
      setProperty(agreement);

      // Get selected clause IDs
      const selected = agreement.propertyClauses?.map((pc: any) => pc.clauseId) || [];
      setSelectedClauseIds(selected);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load agreement data");
    } finally {
      setLoading(false);
    }
  };

  const toggleClause = (clauseId: number) => {
    setSelectedClauseIds((prev) =>
      prev.includes(clauseId) ? prev.filter((id) => id !== clauseId) : [...prev, clauseId]
    );
  };

  const handleSave = async () => {
    if (!property) {
      toast.error("Property not found");
      return;
    }

    setSaving(true);
    try {
      // Get current selected clause IDs
      const currentSelectedIds = property.propertyClauses?.map((pc: any) => pc.clauseId) || [];

      // Find clauses to add (in selectedClauseIds but not in currentSelectedIds)
      const clausesToAdd = selectedClauseIds.filter((id) => !currentSelectedIds.includes(id));

      // Find clauses to remove (in currentSelectedIds but not in selectedClauseIds)
      const clausesToRemove = currentSelectedIds.filter((id) => !selectedClauseIds.includes(id));

      // Add new clauses
      for (const clauseId of clausesToAdd) {
        await agreementService.createPropertyClause({
          propertyAgreementId: property.id,
          clauseId,
        });
      }

      // Remove clauses
      for (const clauseId of clausesToRemove) {
        await agreementService.deletePropertyClause({
          propertyAgreementId: property.id,
          clauseId,
        });
      }

      toast.success("Agreement updated successfully");
      navigate({ to: "/dashboard/agreements" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save agreement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#3f0ee3]/20 border-t-[#3f0ee3] rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading agreement data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/dashboard/agreements" })}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Edit Property Agreement</h1>
      </div>

      {/* Property Info */}
      {property && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
          <div>
            <p className="text-sm text-slate-600 uppercase mb-1">Property</p>
            <p className="text-lg font-semibold text-slate-900">{property.propertyName}</p>
            <p className="text-sm text-slate-600">{property.propertyAddress}</p>
          </div>
        </div>
      )}

      {/* Clauses Selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Select Agreement Clauses</h2>
        <p className="text-sm text-slate-600 mb-6">
          Check the clauses you want to include in this property agreement.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableClauses.map((clause: Clause) => (
            <div
              key={clause.id}
              onClick={() => toggleClause(clause.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedClauseIds.includes(clause.id)
                  ? "border-[#3f0ee3] bg-[#3f0ee3]/5"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedClauseIds.includes(clause.id)
                      ? "border-[#3f0ee3] bg-[#3f0ee3]"
                      : "border-slate-300"
                  }`}
                >
                  {selectedClauseIds.includes(clause.id) && (
                    <Check size={16} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{clause.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{clause.description}</p>
                  {clause.body && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{clause.body}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {availableClauses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600">No clauses available</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>{selectedClauseIds.length}</strong> clause{selectedClauseIds.length !== 1 ? "s" : ""}{" "}
          selected for this agreement
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => navigate({ to: "/dashboard/agreements" })}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
