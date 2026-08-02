import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  Home,
  Wrench,
  DollarSign,
  Users,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Landmark,
  Mail,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import PropertiesLayout from "../../componennts/PropertiesLayout";
import { toast } from "react-toastify";
import agreementService from "../../services/agreementService";

export const Route = createFileRoute("/properties/subscription")({
  component: SubscriptionPage,
});

const PRICE_PER_UNIT = 5000;
const SUPPORT_EMAIL = "info@est8Ledger.com";

const features = [
  {
    icon: <Bell className="w-5 h-5" />,
    title: "Automatic Reminders",
    description: "Send automatic payment reminders to tenants via SMS",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: "Background Checks",
    description: "Verify tenant information and conduct background verification",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: <Home className="w-5 h-5" />,
    title: "Auto-Listing Empty Units",
    description: "Automatically list vacant units to attract new tenants",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: <Wrench className="w-5 h-5" />,
    title: "Repair Team Recommendations",
    description: "Get recommended trusted repair and maintenance teams",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    title: "Late Fee Automation",
    description: "Automatically calculate and apply late payment fees",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Tenant Portal",
    description: "Provide tenants with a dedicated portal for payments and requests",
    color: "bg-indigo-100 text-indigo-600",
  },
];

const paymentMethods = [
  {
    shortName: "MTN",
    name: "MTN Mobile Money",
    shortNote: "Dial *165# or use the MyMTN app",
    number: "0712 345 678",
    instructions:
      "Dial *165# or use MyMTN app. Select Send Money → Business/Merchant → Enter merchant details",
    icon: <Smartphone size={20} />,
    tint: "bg-amber-100 text-amber-700",
  },
  {
    shortName: "Airtel",
    name: "Airtel Money",
    shortNote: "Dial *185# or use the Airtel Money app",
    number: "0701 234 567",
    instructions:
      "Dial *185# or use Airtel Money app. Select Send Money → Enter merchant number",
    icon: <Smartphone size={20} />,
    tint: "bg-red-100 text-red-700",
  },
  {
    shortName: "Bank",
    name: "Bank Transfer",
    shortNote: "Transfer via mobile banking or in-branch",
    details: {
      accountName: "est8Ledger Limited",
      accountNumber: "1234567890",
      bankName: "Stanbic Bank Uganda",
      swiftCode: "SBICUGKX",
    },
    instructions:
      "Use your bank mobile app or visit a branch. Provide the account details below.",
    icon: <Landmark size={20} />,
    tint: "bg-sky-100 text-sky-700",
  },
];

function SubscriptionPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await agreementService.getPropertyAgreements();
      const propsData = Array.isArray(response)
        ? response
        : response.data || [];
      setProperties(propsData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const totalUnits = properties.reduce(
    (sum, prop) => sum + (prop.numberOfUnits || 0),
    0
  );
  const totalPrice = totalUnits * PRICE_PER_UNIT;
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    toast.success(`${label} copied!`);
  };

  const CopyField = ({
    label,
    value,
    mono = false,
  }: {
    label: string;
    value: string;
    mono?: boolean;
  }) => (
    <div>
      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <p className={`font-medium text-slate-900 ${mono ? "font-mono tabular-nums" : ""}`}>{value}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy(value, label);
          }}
          className="p-1.5 hover:bg-slate-200 rounded-md transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copiedText === label ? (
            <Check size={15} className="text-emerald-600" />
          ) : (
            <Copy size={15} className="text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <PropertiesLayout
        pageTitle="Subscription"
        subTitle="Choose your plan and start managing properties efficiently"
      >
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-slate-200 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </PropertiesLayout>
    );
  }

  return (
    <PropertiesLayout
      pageTitle="Subscription"
      subTitle="Choose your plan and start managing properties efficiently"
    >
      <div className="space-y-8">
        {/* Plan Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3f0ee3] via-[#552ae7] to-[#3f0ee3] p-8 sm:p-10 text-white shadow-xl shadow-[#3f0ee3]/25">
          <div className="pointer-events-none absolute -top-20 -right-10 w-64 h-64 rounded-full bg-[#7fe502]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wide">
                <Sparkles size={13} />
                Premium Plan
              </span>
              <h1 className="mt-4 text-2xl sm:text-3xl font-bold">
                Unlock the full est8Ledger toolkit
              </h1>
              <p className="mt-2 text-white/70">
                Simple usage-based pricing — pay only for the units you manage across all your properties.
              </p>
              {totalUnits > 0 && (
                <a
                  href="#payment"
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#3f0ee3] rounded-xl font-semibold hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  Complete Payment
                  <ArrowRight size={16} />
                </a>
              )}
            </div>
            <div className="text-left lg:text-right shrink-0">
              <p className="text-xs uppercase tracking-wide text-white/60 font-semibold">Total Due</p>
              <p className="text-4xl sm:text-5xl font-bold tabular-nums mt-1">
                UGX {fmt(totalPrice)}
              </p>
              <p className="text-sm text-white/70 mt-1">
                {totalUnits} unit{totalUnits !== 1 ? "s" : ""} × UGX {fmt(PRICE_PER_UNIT)}/unit
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Everything included in your plan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center shrink-0`}
                >
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">{feature.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment + Order Summary */}
        <div id="payment" className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Choose a payment method</h2>

            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const active = selectedPaymentMethod === method.shortName;
                return (
                  <div
                    key={method.shortName}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${
                      active ? "border-[#3f0ee3] shadow-sm shadow-[#3f0ee3]/10" : "border-slate-200"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setSelectedPaymentMethod(active ? null : method.shortName)
                      }
                      className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${method.tint}`}
                        >
                          {method.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{method.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{method.shortNote}</p>
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                          active ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {active && (
                      <div className="border-t border-slate-200 bg-slate-50/60 p-5 space-y-4">
                        {method.details ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CopyField label="Account Name" value={method.details.accountName} />
                            <CopyField label="Account Number" value={method.details.accountNumber} mono />
                            <div>
                              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                                Bank Name
                              </p>
                              <p className="font-medium text-slate-900 mt-1">{method.details.bankName}</p>
                            </div>
                            <CopyField label="Swift Code" value={method.details.swiftCode} mono />
                          </div>
                        ) : (
                          <CopyField label="Merchant Number" value={method.number} mono />
                        )}
                        <p className="text-sm text-slate-600 pt-3 border-t border-slate-200">
                          {method.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary (sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Price per unit</span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      UGX {fmt(PRICE_PER_UNIT)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total units</span>
                    <span className="font-medium text-slate-900 tabular-nums">{totalUnits}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline border-t border-slate-200 mt-4 pt-4">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-[#3f0ee3] tabular-nums">
                    UGX {fmt(totalPrice)}
                  </span>
                </div>

                {properties.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                      Breakdown by property
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {properties.map((prop) => (
                        <div key={prop.id} className="flex justify-between gap-2 text-xs">
                          <span className="text-slate-600 truncate">{prop.propertyName}</span>
                          <span className="text-slate-900 font-medium tabular-nums shrink-0">
                            {prop.numberOfUnits} × {fmt(PRICE_PER_UNIT)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <p className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                  <Mail size={16} />
                  Next step
                </p>
                <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                  After paying, email your proof of payment with your name and property details. Your subscription activates within 24 hours of verification.
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                  {SUPPORT_EMAIL}
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PropertiesLayout>
  );
}
