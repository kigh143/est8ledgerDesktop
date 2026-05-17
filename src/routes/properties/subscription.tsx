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
} from "lucide-react";
import PropertiesLayout from "../../componennts/PropertiesLayout";
import { toast } from "react-toastify";
import agreementService from "../../services/agreementService";

export const Route = createFileRoute("/properties/subscription")({
  component: SubscriptionPage,
});

const PRICE_PER_UNIT = 5000;

const features = [
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Automatic Reminders",
    description: "Send automatic payment reminders to tenants via SMS",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: "Background Checks",
    description: "Verify tenant information and conduct background verification",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: <Home className="w-6 h-6" />,
    title: "Auto-Listing Empty Units",
    description: "Automatically list vacant units to attract new tenants",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: "Repair Team Recommendations",
    description: "Get recommended trusted repair and maintenance teams",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Late Fee Automation",
    description: "Automatically calculate and apply late payment fees",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Tenant Portal",
    description: "Provide tenants with a dedicated portal for payments and requests",
    color: "bg-indigo-100 text-indigo-600",
  },
];

const paymentMethods = [
  {
    name: "MTN Mobile Money",
    shortName: "MTN",
    number: "0712 345 678",
    instructions:
      "Dial *165# or use MyMTN app. Select Send Money → Business/Merchant → Enter merchant details",
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    name: "Airtel Money",
    shortName: "Airtel",
    number: "0701 234 567",
    instructions:
      "Dial *185# or use Airtel Money app. Select Send Money → Enter merchant number",
    color: "bg-red-50 border-red-200",
  },
  {
    name: "Bank Transfer",
    shortName: "Bank",
    details: {
      accountName: "est8Ledger Limited",
      accountNumber: "1234567890",
      bankName: "Stanbic Bank Uganda",
      swiftCode: "SBICUGKX",
    },
    instructions:
      "Use your bank mobile app or visit a branch. Provide the account details below.",
    color: "bg-blue-50 border-blue-200",
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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <PropertiesLayout
        pageTitle="Subscription"
        subTitle="Choose your plan and start managing properties efficiently"
      >
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-[#3f0ee3]/20 border-t-[#3f0ee3] rounded-full animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Loading subscription details...</p>
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
        {/* Features Grid */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Premium Features Included
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                >
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Calculation */}
        <div className="bg-gradient-to-r from-[#3f0ee3] to-[#3f0ee3]/80 rounded-lg p-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Pricing Calculation</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-white/20">
                <span className="text-lg">Price per unit (UGX)</span>
                <span className="font-semibold text-xl">
                  {new Intl.NumberFormat("en-US").format(PRICE_PER_UNIT)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-white/20">
                <span className="text-lg">Total units across all properties</span>
                <span className="font-semibold text-xl">{totalUnits}</span>
              </div>

              <div className="flex justify-between items-center text-xl font-bold pt-4">
                <span>Total Amount to Pay</span>
                <span className="text-2xl">
                  UGX {new Intl.NumberFormat("en-US").format(totalPrice)}
                </span>
              </div>
            </div>

            {/* Properties Breakdown */}
            {properties.length > 0 && (
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Breakdown by Property</h3>
                <div className="space-y-2">
                  {properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="flex justify-between text-sm items-center"
                    >
                      <span>{prop.propertyName}</span>
                      <span className="text-right">
                        {prop.numberOfUnits} units × {new Intl.NumberFormat("en-US").format(PRICE_PER_UNIT)} UGX ={" "}
                        <span className="font-semibold">
                          {new Intl.NumberFormat("en-US").format(
                            prop.numberOfUnits * PRICE_PER_UNIT
                          )}{" "}
                          UGX
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Payment Methods
          </h2>

          <div className="space-y-6">
            {paymentMethods.map((method, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPaymentMethod === method.shortName
                    ? "border-[#3f0ee3] bg-[#3f0ee3]/5"
                    : `${method.color} border-slate-200`
                }`}
                onClick={() => setSelectedPaymentMethod(method.shortName)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">
                      {method.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {method.instructions}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedPaymentMethod === method.shortName
                        ? "border-[#3f0ee3] bg-[#3f0ee3]"
                        : "border-slate-300"
                    }`}
                  >
                    {selectedPaymentMethod === method.shortName && (
                      <Check size={16} className="text-white" />
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                {method.details ? (
                  // Bank Transfer Details
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">
                        Account Name
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-slate-900">
                          {method.details.accountName}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(
                              method.details.accountName,
                              "Account name"
                            );
                          }}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          {copiedText === "Account name" ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <Copy size={16} className="text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">
                        Account Number
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-slate-900 font-mono">
                          {method.details.accountNumber}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(
                              method.details.accountNumber,
                              "Account number"
                            );
                          }}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          {copiedText === "Account number" ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <Copy size={16} className="text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">
                        Bank Name
                      </p>
                      <p className="font-medium text-slate-900 mt-1">
                        {method.details.bankName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold">
                        Swift Code
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-slate-900 font-mono">
                          {method.details.swiftCode}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(
                              method.details.swiftCode,
                              "Swift code"
                            );
                          }}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          {copiedText === "Swift code" ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <Copy size={16} className="text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Mobile Money Details
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-600 uppercase font-semibold">
                      Merchant Number
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium text-slate-900 font-mono text-lg">
                        {method.number}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(method.number, `${method.shortName} number`);
                        }}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        {copiedText === `${method.shortName} number` ? (
                          <Check size={16} className="text-emerald-600" />
                        ) : (
                          <Copy size={16} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Payment Instructions</h3>
          <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
            <li>Select your preferred payment method above</li>
            <li>Copy the merchant details using the copy buttons</li>
            <li>
              Initiate the payment using your mobile money app or bank
              application
            </li>
            <li>
              Send proof of payment to info@est8Ledger.com with your name and
              email
            </li>
            <li>
              Your subscription will be activated within 24 hours after payment
              verification
            </li>
          </ol>
        </div>

        {/* Summary Card */}
        {totalPrice > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-900 font-semibold text-lg">
                  Ready to upgrade?
                </p>
                <p className="text-emerald-800 text-sm mt-1">
                  You have {totalUnits} units across {properties.length} properties
                </p>
              </div>
              <div className="text-right">
                <p className="text-emerald-600 text-xs uppercase font-semibold">
                  Total Amount
                </p>
                <p className="text-3xl font-bold text-emerald-900">
                  UGX {new Intl.NumberFormat("en-US").format(totalPrice)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PropertiesLayout>
  );
}
