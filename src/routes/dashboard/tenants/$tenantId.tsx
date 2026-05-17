import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, MessageCircle, Mail, Phone, AlertCircle, Edit, Trash2 } from "lucide-react";
import tenancyService from "../../../services/tenancyService";
import { securityDepositService } from "../../../services/securityDepositService";
import { rentPaymentsService } from "../../../services/rentPaymentsService";
import { inspectionService } from "../../../services/inspectionService";
import { toast } from "react-toastify";
import type { TenancyAgreement, SecurityDepositRecord, RentPayment, InspectionItem } from "../../../types";

export const Route = createFileRoute("/dashboard/tenants/$tenantId")({
  component: TenantProfilePage,
});

function TenantProfilePage() {
  const navigate = useNavigate();
  const { tenantId } = Route.useParams();
  const [tenancy, setTenancy] = useState<TenancyAgreement | null>(null);
  const [deposits, setDeposits] = useState<SecurityDepositRecord[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textMessage, setTextMessage] = useState("");
  const [sendingText, setSendingText] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  const loadTenantData = async () => {
    try {
      setLoading(true);
      const [tenancyRes, depositsRes, paymentsRes, inspectionsRes] = await Promise.all([
        tenancyService.getTenancy(tenantId),
        securityDepositService.getTenancyDeposit(tenantId),
        rentPaymentsService.getTenancyRentPayments(tenantId),
        inspectionService.getTenancyInspection(tenantId),
      ]);

      setTenancy(tenancyRes.data || tenancyRes);
      setDeposits((depositsRes?.data || []) as SecurityDepositRecord[]);
      setPayments(paymentsRes as any[]);
      setInspections((inspectionsRes?.data || inspectionsRes || []) as InspectionItem[]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tenant data");
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!textMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSendingText(true);
    try {
      // Mock SMS service - replace with actual service when available
      console.log(`Sending SMS to ${tenancy?.tenant.phoneNumber}: ${textMessage}`);
      toast.success("Text sent successfully");
      setShowTextModal(false);
      setTextMessage("");
    } catch (error) {
      toast.error("Failed to send text");
    } finally {
      setSendingText(false);
    }
  };

  const handleTerminateTenancy = async () => {
    if (!tenancy) return;

    setTerminatingId(tenancy.id.toString());
    try {
      await tenancyService.mgtRequestTenancyTermiantion(tenancy.id.toString());
      toast.success("Termination request sent successfully");
      setShowTerminateModal(false);
      // Reload the data
      setTimeout(() => {
        loadTenantData();
      }, 500);
    } catch (error) {
      console.error(error);
      toast.error("Failed to terminate tenancy");
    } finally {
      setTerminatingId(null);
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

  if (!tenancy) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Tenant not found</p>
        </div>
      </div>
    );
  }

  const outstandingBalance = parseFloat(tenancy.outstandingBalance || "0");
  const totalDeposits = deposits.reduce((sum, d) => sum + parseFloat(d.amount?.toString() || "0"), 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: "/dashboard/tenants" })}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {tenancy.tenant.firstName} {tenancy.tenant.lastName}
          </h1>
          <p className="text-slate-500 text-sm">{tenancy.unitName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate({ to: `/dashboard/tenants/edit/${tenancy.id}` })}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            <Edit size={20} />
            Edit
          </button>
          <button
            onClick={() => setShowTextModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors"
          >
            <MessageCircle size={20} />
            Send Text
          </button>
          <button
            onClick={() => setShowTerminateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
          >
            <Trash2 size={20} />
            Terminate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Full Name</p>
                <p className="font-medium text-slate-900">
                  {tenancy.tenant.firstName} {tenancy.tenant.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Email</p>
                <a
                  href={`mailto:${tenancy.tenant.email}`}
                  className="font-medium text-[#3f0ee3] hover:underline flex items-center gap-2"
                >
                  <Mail size={16} />
                  {tenancy.tenant.email}
                </a>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Phone Number</p>
                <a
                  href={`tel:${tenancy.tenant.phoneNumber}`}
                  className="font-medium text-[#3f0ee3] hover:underline flex items-center gap-2"
                >
                  <Phone size={16} />
                  {tenancy.tenant.phoneNumber}
                </a>
              </div>
            </div>
          </div>

          {/* Tenancy Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tenancy Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Unit Name</p>
                <p className="font-medium text-slate-900">{tenancy.unitName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Monthly Rent</p>
                <p className="font-medium text-slate-900">
                  UGX {Number(tenancy.rentAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Water Meter</p>
                <p className="font-medium text-slate-900">{tenancy.waterMeter || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">YAKA Meter</p>
                <p className="font-medium text-slate-900">{tenancy.yakaMeter || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Waste Management</p>
                <p className="font-medium text-slate-900">{tenancy.wasteHandledBy}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Payment Due Day</p>
                <p className="font-medium text-slate-900">{tenancy.paymentDueDay || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Security Deposit */}
          {deposits.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Security Deposit</h2>
              <div className="space-y-4">
                {deposits.map((deposit) => (
                  <div key={deposit.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-slate-600">Amount</p>
                        <p className="font-semibold text-slate-900">
                          {deposit.currency} {deposit.amount}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          deposit.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {deposit.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Paid Date</p>
                        <p className="font-medium text-slate-900">
                          {deposit.createdAt ? new Date(deposit.createdAt).toLocaleDateString() : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Investment Status</p>
                        <p className="font-medium text-slate-900">
                          {deposit.investedAt ? "Invested" : "Not Invested"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Payments */}
          {payments.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Payments</h2>
              <div className="space-y-3">
                {payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(payment.createdAt).getFullYear()}-
                        {String(new Date(payment.createdAt).getMonth() + 1).padStart(2, "0")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        UGX {Number(payment.amount).toLocaleString()}
                      </p>
                      <span
                        className={`text-xs font-semibold ${
                          payment.status === "CONFIRMED"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inspections */}
          {inspections.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Inspections</h2>
              <div className="space-y-3">
                {inspections.map((inspection) => (
                  <div key={inspection.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{inspection.type}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(inspection.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          inspection.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {inspection.status || "PENDING"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Outstanding Balance */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Outstanding Balance</p>
            <p
              className={`text-3xl font-bold ${
                outstandingBalance > 0 ? "text-red-600" : "text-emerald-600"
              }`}
            >
              UGX {Number(outstandingBalance).toLocaleString()}
            </p>
            {outstandingBalance > 0 && (
              <p className="text-xs text-red-600 mt-2">⚠️ Rent overdue</p>
            )}
          </div>

          {/* Rent Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Rent Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <p className="text-slate-600">Monthly Rent</p>
                <p className="font-medium text-slate-900">
                  UGX {Number(tenancy.rentAmount).toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-slate-600">Total Paid</p>
                <p className="font-medium text-slate-900">
                  UGX {Number(totalPayments).toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200">
                <p className="text-slate-600">Outstanding</p>
                <p className="font-medium text-red-600">
                  UGX {Number(outstandingBalance).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Security Deposit Summary */}
          {deposits.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Security Deposit</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <p className="text-slate-600">Total Deposits</p>
                  <p className="font-medium text-slate-900">
                    UGX {Number(totalDeposits).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-slate-600">Deposits Paid</p>
                  <p className="font-medium text-emerald-600">
                    {deposits.filter((d) => d.status === "PAID").length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Agreement Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Agreement Status</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600">Manager Signed</p>
                <p className="font-medium text-slate-900">
                  {tenancy.mgtSignedAt ? new Date(tenancy.mgtSignedAt).toLocaleDateString() : "Not signed"}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Tenant Signed</p>
                <p className="font-medium text-slate-900">
                  {tenancy.tenantSignedAt ? new Date(tenancy.tenantSignedAt).toLocaleDateString() : "Not signed"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Send Text Message</h2>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">To: {tenancy.tenant.phoneNumber}</p>
              </div>
              <textarea
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent"
              />
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowTextModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendText}
                  disabled={sendingText}
                  className="px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingText ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Tenancy Modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Terminate Tenancy</h2>
              <button
                onClick={() => setShowTerminateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900">
                  <strong>Warning:</strong> This will send a termination request for this tenancy. The tenant will be notified and the request will require confirmation.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Tenant Name:</p>
                <p className="font-medium text-slate-900">
                  {tenancy.tenant.firstName} {tenancy.tenant.lastName}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Unit:</p>
                <p className="font-medium text-slate-900">{tenancy.unitName}</p>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowTerminateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTerminateTenancy}
                  disabled={terminatingId !== null}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {terminatingId ? "Terminating..." : "Confirm Termination"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
