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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Account Information</h2>

          <div className="space-y-6">
            {/* User Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 uppercase font-semibold">First Name</p>
                <p className="text-slate-900 font-medium mt-2">{user?.firstName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 uppercase font-semibold">Last Name</p>
                <p className="text-slate-900 font-medium mt-2">{user?.lastName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 uppercase font-semibold">Email</p>
                <p className="text-slate-900 font-medium mt-2">{user?.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 uppercase font-semibold">Phone</p>
                <p className="text-slate-900 font-medium mt-2">{user?.phoneNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 uppercase font-semibold">Country</p>
                <p className="text-slate-900 font-medium mt-2">{user?.countryId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 uppercase font-semibold">User ID</p>
                <p className="text-slate-900 font-medium mt-2 font-mono text-sm">{user?.id || "N/A"}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <button
                onClick={() => toast.info("Profile editing coming soon")}
                className="px-6 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Shield size={20} />
            Security
          </h2>

          <div className="space-y-4">
            {/* Change PIN Button */}
            <button
              onClick={() => setShowChangePinModal(true)}
              className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#3f0ee3]" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">Change Security PIN</p>
                  <p className="text-sm text-slate-600">Update your 4-digit PIN</p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-slate-600">→</div>
            </button>

            {/* Change Password Button */}
            <button
              onClick={() => toast.info("Password change feature coming soon")}
              className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#3f0ee3]" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">Change Password</p>
                  <p className="text-sm text-slate-600">Update your login password</p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-slate-600">→</div>
            </button>
          </div>
        </div>

        {/* Help & Support Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Help & Support</h2>

          <div className="space-y-4">
            {/* Email */}
            <a
              href="mailto:info@est8Ledger.com"
              className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-[#3f0ee3] transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Email Support</p>
                <p className="text-sm text-slate-600">info@est8Ledger.com</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+447930068728"
              className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-[#3f0ee3] transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Phone Support</p>
                <p className="text-sm text-slate-600">+447930068728</p>
              </div>
            </a>
          </div>
        </div>

        {/* Legal Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <FileText size={20} />
            Legal
          </h2>

          <div className="space-y-4">
            {/* Privacy Policy */}
            <a
              href="https://www.est8ledger.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-[#3f0ee3] transition-colors group"
            >
              <div>
                <p className="font-medium text-slate-900">Privacy Policy</p>
                <p className="text-sm text-slate-600">Read our privacy practices</p>
              </div>
              <div className="text-slate-400 group-hover:text-[#3f0ee3]">↗</div>
            </a>

            {/* Terms of Use */}
            <a
              href="https://www.est8ledger.com/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-[#3f0ee3] transition-colors group"
            >
              <div>
                <p className="font-medium text-slate-900">Terms of Use</p>
                <p className="text-sm text-slate-600">Review our terms and conditions</p>
              </div>
              <div className="text-slate-400 group-hover:text-[#3f0ee3]">↗</div>
            </a>
          </div>
        </div>

        {/* App Info Section */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 uppercase font-semibold">App Version</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">v{appVersion}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Latest version installed</p>
              <p className="text-sm text-emerald-600 font-semibold mt-1">✓ Up to date</p>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
          <p className="text-sm text-red-700 mt-3 text-center">
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
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
                  className="flex-1 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
