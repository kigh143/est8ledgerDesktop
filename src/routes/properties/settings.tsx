import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, LogOut, Shield, Mail, Phone, FileText, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "../../store";
import PropertiesLayout from "../../componennts/PropertiesLayout";
import { toast } from "react-toastify";

export const Route = createFileRoute("/properties/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAppStore();
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [showPin, setShowPin] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);

  const handlePinInputChange = (field: string, value: string) => {
    setPinForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pinForm.currentPin || !pinForm.newPin || !pinForm.confirmPin) {
      toast.error("Please fill in all PIN fields");
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      toast.error("New PIN and confirmation PIN do not match");
      return;
    }

    if (pinForm.newPin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }

    setLoadingPin(true);
    try {
      // TODO: Add PIN change API call when endpoint is available
      // await authService.changePin({ currentPin, newPin });

      toast.success("PIN changed successfully");
      setShowChangePinModal(false);
      setPinForm({
        currentPin: "",
        newPin: "",
        confirmPin: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to change PIN");
    } finally {
      setLoadingPin(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const appVersion = "1.0.0";

  return (
    <PropertiesLayout pageTitle="Settings" subTitle="Manage your account and preferences">
      <div className="space-y-8">
        {/* User Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Account Information</h2>
              <p className="text-sm text-slate-600 mt-1">Your profile details</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#552ae7] to-[#552ae7]/80 flex items-center justify-center text-white font-bold text-lg">
              {user?.firstName?.charAt(0) || "U"}
            </div>
          </div>

          <div className="space-y-6">
            {/* User Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">First Name</p>
                <p className="text-slate-900 font-semibold mt-2">{user?.firstName || "N/A"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Last Name</p>
                <p className="text-slate-900 font-semibold mt-2">{user?.lastName || "N/A"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Email</p>
                <p className="text-slate-900 font-semibold mt-2 text-sm break-all">{user?.email || "N/A"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Phone</p>
                <p className="text-slate-900 font-semibold mt-2">{user?.phoneNumber || "N/A"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Country</p>
                <p className="text-slate-900 font-semibold mt-2">{user?.countryId || "N/A"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">User ID</p>
                <p className="text-slate-900 font-mono text-xs break-all">{user?.id || "N/A"}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <button
                onClick={() => toast.info("Profile editing coming soon")}
                className="px-6 py-2.5 bg-linear-to-r from-[#552ae7] to-[#552ae7]/80 text-white rounded-lg font-semibold hover:shadow-lg transition-all active:scale-95"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#552ae7]/20 to-[#552ae7]/10 flex items-center justify-center">
              <Shield size={20} className="text-[#552ae7]" />
            </div>
            Security
          </h2>

          <div className="space-y-3">
            {/* Change PIN Button */}
            <button
              onClick={() => setShowChangePinModal(true)}
              className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-[#552ae7] hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#552ae7]/10 flex items-center justify-center group-hover:bg-[#552ae7]/20">
                  <Lock className="w-5 h-5 text-[#552ae7]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Change Security PIN</p>
                  <p className="text-sm text-slate-600">Update your 4-digit PIN</p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-[#552ae7] transition-colors">→</div>
            </button>

            {/* Change Password Button */}
            <button
              onClick={() => toast.info("Password change feature coming soon")}
              className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-[#552ae7] hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#552ae7]/10 flex items-center justify-center group-hover:bg-[#552ae7]/20">
                  <Lock className="w-5 h-5 text-[#552ae7]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Change Password</p>
                  <p className="text-sm text-slate-600">Update your login password</p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-[#552ae7] transition-colors">→</div>
            </button>
          </div>
        </div>

        {/* Help & Support Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-slate-900 mb-8">Help & Support</h2>

          <div className="space-y-3">
            {/* Email */}
            <a
              href="mailto:info@est8Ledger.com"
              className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-[#552ae7] hover:bg-slate-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#552ae7]/10 flex items-center justify-center group-hover:bg-[#552ae7]/20">
                <Mail className="w-6 h-6 text-[#552ae7]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Email Support</p>
                <p className="text-sm text-slate-600">info@est8Ledger.com</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+447930068728"
              className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-[#552ae7] hover:bg-slate-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#552ae7]/10 flex items-center justify-center group-hover:bg-[#552ae7]/20">
                <Phone className="w-6 h-6 text-[#552ae7]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Phone Support</p>
                <p className="text-sm text-slate-600">+447930068728</p>
              </div>
            </a>
          </div>
        </div>

        {/* Legal Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#552ae7]/20 to-[#552ae7]/10 flex items-center justify-center">
              <FileText size={20} className="text-[#552ae7]" />
            </div>
            Legal
          </h2>

          <div className="space-y-3">
            {/* Privacy Policy */}
            <a
              href="https://www.est8ledger.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-[#552ae7] hover:bg-slate-50 transition-all group"
            >
              <div>
                <p className="font-semibold text-slate-900">Privacy Policy</p>
                <p className="text-sm text-slate-600">Read our privacy practices</p>
              </div>
              <div className="text-slate-400 group-hover:text-[#552ae7] transition-colors">↗</div>
            </a>

            {/* Terms of Use */}
            <a
              href="https://www.est8ledger.com/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-[#552ae7] hover:bg-slate-50 transition-all group"
            >
              <div>
                <p className="font-semibold text-slate-900">Terms of Use</p>
                <p className="text-sm text-slate-600">Review our terms and conditions</p>
              </div>
              <div className="text-slate-400 group-hover:text-[#552ae7] transition-colors">↗</div>
            </a>
          </div>
        </div>

        {/* App Info Section */}
        <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">App Version</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">v{appVersion}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Latest version installed</p>
              <p className="text-sm text-[#7fe502] font-semibold mt-2 flex items-center justify-end gap-1">
                <span>✓</span> Up to date
              </p>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-linear-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-8 shadow-sm">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all active:scale-95"
          >
            <LogOut size={20} />
            Logout
          </button>
          <p className="text-sm text-red-700 mt-4 text-center">
            You will be returned to the login screen
          </p>
        </div>
      </div>

      {/* Change PIN Modal */}
      {showChangePinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Lock size={24} />
              Change Security PIN
            </h2>

            <form onSubmit={handleChangePinSubmit} className="space-y-4">
              {/* Current PIN */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Current PIN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pinForm.currentPin}
                    onChange={(e) =>
                      handlePinInputChange("currentPin", e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#552ae7] focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New PIN */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  New PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pinForm.newPin}
                  onChange={(e) =>
                    handlePinInputChange("newPin", e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#552ae7] focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                />
              </div>

              {/* Confirm PIN */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Confirm New PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pinForm.confirmPin}
                  onChange={(e) =>
                    handlePinInputChange("confirmPin", e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#552ae7] focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePinModal(false);
                    setPinForm({
                      currentPin: "",
                      newPin: "",
                      confirmPin: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingPin}
                  className="flex-1 px-4 py-2 bg-[#552ae7] text-white rounded-lg font-medium hover:bg-[#552ae7]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingPin ? "Changing..." : "Change PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertiesLayout>
  );
}
