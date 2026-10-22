import { Link } from "@tanstack/react-router";
import { Building2, UserRound } from "lucide-react";
import type { TaxpayerType } from "../../types";

const CHOICES: { type: TaxpayerType; icon: typeof UserRound; title: string; detail: string }[] = [
  {
    type: "INDIVIDUAL",
    icon: UserRound,
    title: "Solo landlord",
    detail: "You own the property yourself. URA charges 12% on rent above UGX 2,820,000 a year, with no expenses deducted.",
  },
  {
    type: "COMPANY",
    icon: Building2,
    title: "Business",
    detail: "A company owns the property. URA charges 30% after expenses, which can cut taxable rent by up to half.",
  },
];

/** Asks whether the landlord lets property as an individual or a company; the tax maths depends on it. */
export default function TaxpayerTypePrompt({ onChoose }: { onChoose: (type: TaxpayerType) => void }) {
  return (
    <div className="card p-6 sm:p-8 animate-fade-up">
      <p className="eyebrow">One question first</p>
      <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-slate-900">
        Do you let property as a solo landlord or a business?
      </h2>
      <p className="mt-1 text-sm text-slate-500">Rental income tax is worked out differently for each.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {CHOICES.map(({ type, icon: Icon, title, detail }) => (
          <button
            key={type}
            onClick={() => onChoose(type)}
            className="group rounded-2xl border border-black/[0.08] bg-white p-5 text-left transition-all duration-200 hover:border-[#3f0ee3]/40 hover:shadow-[0_4px_16px_rgb(63_14_227/0.08)] focus-visible:outline-2 focus-visible:outline-[#3f0ee3]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3f0ee3]/[0.08] text-[#3f0ee3]">
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{detail}</p>
          </button>
        ))}
      </div>

      <p className="mt-5 text-xs text-slate-500">
        To stop being asked, add a tax config in{" "}
        <Link to="/properties/tax-compliance" className="font-medium text-[#3f0ee3] hover:underline">
          Tax compliance
        </Link>
        .
      </p>
    </div>
  );
}
