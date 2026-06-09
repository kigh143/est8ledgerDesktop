import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Building2, DoorOpen, Users, Percent, TrendingUp, Search, MapPin, ArrowRight, HousePlus } from 'lucide-react'
import { useAppStore } from '../../store';
import PropertiesLayout from '../../componennts/PropertiesLayout';
import type { PropertyAgreement } from '../../types';
import agreementService from '../../services/agreementService';
import placeholder from "../../assets/placeholder.jpeg"

export const Route = createFileRoute('/properties/')({
  component: RouteComponent,
  beforeLoad: () => {
    const { token } = useAppStore.getState();
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  loader: async () => {
    const response = await agreementService.getPropertyAgreements();
    return {
      properties: response.data
    }
  }
})

const occupancyOf = (p: PropertyAgreement) =>
  p.numberOfUnits > 0 ? Math.round((p.tenancies.length / p.numberOfUnits) * 100) : 0;
const revenueOf = (p: PropertyAgreement) =>
  p.tenancies.reduce((acc, t) => acc + (+t.rentAmount || 0), 0);

const occupancyTone = (pct: number) =>
  pct >= 75
    ? { bar: "bg-emerald-500", text: "text-emerald-700" }
    : pct >= 40
    ? { bar: "bg-amber-500", text: "text-amber-700" }
    : { bar: "bg-red-500", text: "text-red-700" };

function KpiCard({ icon: Icon, label, value, tint }: {
  icon: typeof Building2;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${tint}`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const { properties } = Route.useLoaderData();
  const state = useAppStore();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState("");

  const handlePropertyClicked = (property: PropertyAgreement) => {
    state.setActiveProperty(property);
    navigate({ to: '/dashboard/home' });
  }

  // Aggregate analytics across all properties
  const currency = properties[0]?.currency || "UGX";
  const totalUnits = properties.reduce((a: number, p: PropertyAgreement) => a + p.numberOfUnits, 0);
  const totalTenants = properties.reduce((a: number, p: PropertyAgreement) => a + p.tenancies.length, 0);
  const totalRevenue = properties.reduce((a: number, p: PropertyAgreement) => a + revenueOf(p), 0);
  const avgOccupancy = totalUnits > 0 ? Math.round((totalTenants / totalUnits) * 100) : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p: PropertyAgreement) =>
      [p.propertyName, p.propertyAddress, p.city, p.district]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [properties, query]);

  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  return (
    <PropertiesLayout pageTitle={`${properties.length} Properties`} subTitle='All properties with agreement details'>
      <div className="space-y-6 pb-4">
        {/* Aggregate analytics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard icon={Building2} label="Properties" value={fmt(properties.length)} tint="bg-[#3f0ee3]/10 text-[#3f0ee3]" />
          <KpiCard icon={DoorOpen} label="Total Units" value={fmt(totalUnits)} tint="bg-sky-100 text-sky-700" />
          <KpiCard icon={Users} label="Total Tenants" value={fmt(totalTenants)} tint="bg-violet-100 text-violet-700" />
          {/* <KpiCard icon={Percent} label="Avg. Occupancy" value={`${avgOccupancy}%`} tint="bg-emerald-100 text-emerald-700" /> */}
          <KpiCard icon={TrendingUp} label="Monthly Revenue" value={`${currency} ${fmt(totalRevenue)}`} tint="bg-amber-100 text-amber-700" />
        </div>

        {/* Properties table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">All Properties</h2>
              <p className="text-xs text-slate-500">{filtered.length} of {properties.length} shown</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search properties..."
                  aria-label="Search properties"
                  className="w-full sm:w-64 pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3f0ee3] focus:border-transparent outline-none transition"
                />
              </div>
              <Link
                to="/properties/add"
                className="flex items-center gap-2 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg text-sm font-semibold hover:bg-[#3f0ee3]/90 transition-colors shrink-0"
              >
                <HousePlus size={18} />
                <span className="hidden sm:inline">Add Property</span>
              </Link>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-6 py-16">
              <Building2 size={40} className="text-slate-300 mb-3" />
              <p className="font-medium text-slate-900">
                {properties.length === 0 ? "No properties yet" : "No properties match your search"}
              </p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                {properties.length === 0
                  ? "Add your first property to start managing tenants, rent, and agreements."
                  : "Try a different name, address, or location."}
              </p>
              {properties.length === 0 && (
                <Link
                  to="/properties/add"
                  className="flex items-center gap-2 mt-4 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg text-sm font-semibold hover:bg-[#3f0ee3]/90 transition-colors"
                >
                  <HousePlus size={18} />
                  Add Property
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 sm:px-6 py-3">Property</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Type</th>
                    <th className="px-4 py-3 text-right">Units</th>
                    <th className="px-4 py-3 text-right">Tenants</th>
                    <th className="px-4 py-3 w-44">Occupancy</th>
                    <th className="px-4 py-3 text-right hidden md:table-cell">Clauses</th>
                    <th className="px-4 py-3 text-right">Monthly Revenue</th>
                    <th className="px-4 sm:px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((property: PropertyAgreement) => {
                    const occupancy = occupancyOf(property);
                    const tone = occupancyTone(occupancy);
                    return (
                      <tr
                        key={property.id}
                        onClick={() => handlePropertyClicked(property)}
                        className="group hover:bg-[#3f0ee3]/[0.03] cursor-pointer transition-colors"
                      >
                        {/* Property identity */}
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={property.propertyImage || placeholder}
                              alt={property.propertyName}
                              loading="lazy"
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate group-hover:text-[#3f0ee3] transition-colors">
                                {property.propertyName}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                                <MapPin size={12} className="shrink-0" />
                                <span className="truncate">{property.propertyAddress || property.city || "—"}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                            {String(property.propertyType).toLowerCase().replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Units */}
                        <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                          {property.numberOfUnits}
                        </td>

                        {/* Tenants */}
                        <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                          {property.tenancies.length}
                        </td>

                        {/* Occupancy */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${tone.bar} transition-all`}
                                style={{ width: `${occupancy}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums ${tone.text}`}>{occupancy}%</span>
                          </div>
                        </td>

                        {/* Clauses */}
                        <td className="px-4 py-3 text-right text-slate-600 tabular-nums hidden md:table-cell">
                          {property.propertyClauses.length}
                        </td>

                        {/* Revenue */}
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {property.currency || currency} {fmt(revenueOf(property))}
                        </td>

                        {/* Action */}
                        <td className="px-4 sm:px-6 py-3 text-right">
                          <span
                            className="inline-flex items-center gap-1 text-[#3f0ee3] font-medium opacity-70 group-hover:opacity-100 transition-opacity"
                            aria-hidden="true"
                          >
                            View
                            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PropertiesLayout>
  );
}
