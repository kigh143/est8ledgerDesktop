import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../../../store";
import { Edit, FileText } from "lucide-react";
import type { PropertyClause } from "../../../types";

export const Route = createFileRoute("/dashboard/agreements/")({
  component: AgreementsListPage,
});

function AgreementsListPage() {
  const navigate = useNavigate();
  const { activeProperty } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Property Agreement</h1>
        <button
          onClick={() => navigate({ to: "/dashboard/agreements/edit" })}
          className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors"
        >
          <Edit size={20} />
          Edit Terms
        </button>
      </div>

      {/* Agreement Card */}
      {activeProperty ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          {/* Document Header */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Property Lease Agreement</h2>
              <p className="text-slate-600">Agreement ID: #{activeProperty.id}</p>
            </div>
            <FileText size={48} className="text-[#3f0ee3]/30" />
          </div>

          {/* Property Information */}
          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Property Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Property Name</p>
                  <p className="text-lg font-semibold text-slate-900">{activeProperty.propertyName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Address</p>
                  <p className="text-slate-700">
                    {activeProperty.propertyAddress}, {activeProperty.city}, {activeProperty.district}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Property Type</p>
                  <p className="font-medium text-slate-900">{activeProperty.propertyType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Number of Units</p>
                  <p className="font-medium text-slate-900">{activeProperty.numberOfUnits}</p>
                </div>
              </div>
            </div>

            {/* Landlord Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Landlord/Management</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Name</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {activeProperty.owner.firstName} {activeProperty.owner.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Email</p>
                  <p className="text-slate-700">{activeProperty.owner.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Currency</p>
                  <p className="font-medium text-slate-900">{activeProperty.currency}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Terms */}
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 uppercase mb-6">Terms & Conditions</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase mb-2">Eviction Process</p>
                <p className="font-medium text-slate-900">{activeProperty.evictionProcess}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase mb-2">Termination Notice</p>
                <p className="font-medium text-slate-900">{activeProperty.terminationNoticeDays} days</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase mb-2">Security Deposit</p>
                <p className="font-medium text-slate-900">{activeProperty.securityDepositMonths} months rent</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase mb-2">Rent Increase Notice</p>
                <p className="font-medium text-slate-900">{activeProperty.rentIncreaseNoticeDays} days</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase mb-2">Initial Advance Months</p>
                <p className="font-medium text-slate-900">{activeProperty.initialAdvanceMonths} months</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase mb-2">Max Security Deposit</p>
                <p className="font-medium text-slate-900">
                  {activeProperty.maxSecurityDepositMonths
                    ? `${activeProperty.maxSecurityDepositMonths} months`
                    : "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Clauses */}
          {activeProperty.propertyClauses && activeProperty.propertyClauses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase mb-6">Clauses</h3>
              <div className="space-y-4">
                {activeProperty.propertyClauses.map((pc: PropertyClause) => (
                  <div key={pc.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{pc.clause?.title}</h4>
                      {pc.isCustom && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm">{pc.clause?.description}</p>
                    {pc.clause?.body && (
                      <p className="text-slate-500 text-sm mt-2 whitespace-pre-wrap">{pc.clause.body}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Last updated: {new Date(activeProperty.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-600">No property selected</p>
        </div>
      )}
    </div>
  );
}
