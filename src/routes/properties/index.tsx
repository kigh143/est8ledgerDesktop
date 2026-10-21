import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Building2, Search, MapPin, ArrowRight, HousePlus, FileUp } from 'lucide-react'
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
  pct >= 75 ? "bg-[#34c759]" : pct >= 40 ? "bg-[#ff9500]" : "bg-[#ff3b30]";

/** Inline summary figure: big number, quiet label. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[22px] font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
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
  const avgOccupancy = properties.length > 0
    ? Math.round(properties.reduce((a: number, p: PropertyAgreement) => a + occupancyOf(p), 0) / properties.length)
    : 0;

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
    <PropertiesLayout
      pageTitle="Your properties"
      subTitle={`${properties.length} ${properties.length === 1 ? "property" : "properties"} under management`}
      action={
        <>
          <Link to="/properties/import" className="btn btn-secondary">
            <FileUp size={16} />
            Import
          </Link>
          <Link to="/properties/add" className="btn btn-primary">
            <HousePlus size={16} />
            Add property
          </Link>
        </>
      }
    >
      <div className="space-y-10">
        {/* Portfolio summary, one quiet strip */}
        <div className="card grid grid-cols-2 gap-6 px-6 py-5 sm:grid-cols-4 sm:divide-x sm:divide-black/[0.06] sm:gap-0 [&>*]:sm:px-6 [&>*:first-child]:sm:pl-0">
          <Figure label="Monthly rent roll" value={`${currency} ${fmt(totalRevenue)}`} />
          <Figure label="Average occupancy" value={`${avgOccupancy}%`} />
          <Figure label="Units" value={fmt(totalUnits)} />
          <Figure label="Tenants" value={fmt(totalTenants)} />
        </div>

        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">
              {query ? `${filtered.length} of ${properties.length}` : "All properties"}
            </h2>
            <div className="relative sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or location"
                aria-label="Search properties"
                className="field rounded-full pl-10 bg-white"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Building2 size={26} strokeWidth={1.5} />
              </span>
              <p className="text-[17px] font-semibold text-slate-900">
                {properties.length === 0 ? "Add your first property" : "No properties match your search"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {properties.length === 0
                  ? "Then invite tenants, sign agreements and track rent, all from here."
                  : "Try a different name, address or city."}
              </p>
              {properties.length === 0 && (
                <Link to="/properties/add" className="btn btn-primary mt-5">
                  <HousePlus size={16} />
                  Add property
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((property: PropertyAgreement, i: number) => {
                const occupancy = occupancyOf(property);
                return (
                  <button
                    key={property.id}
                    onClick={() => handlePropertyClicked(property)}
                    className="group text-left animate-fade-up"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                      <img
                        src={property.propertyImage || placeholder}
                        alt={property.propertyName}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold capitalize text-slate-900 shadow-sm backdrop-blur">
                        {String(property.propertyType).toLowerCase().replace(/_/g, " ")}
                      </span>
                      <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur tabular-nums">
                        Open
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>

                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-slate-900">{property.propertyName}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-500">
                          <MapPin size={13} className="shrink-0" />
                          <span className="truncate">{property.propertyAddress || property.city || "No address"}</span>
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-700 tabular-nums" title="Occupancy">
                        <span className={`h-2 w-2 rounded-full ${occupancyTone(occupancy)}`} />
                        {occupancy}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {property.tenancies.length} of {property.numberOfUnits} units let
                    </p>
                    <p className="mt-1.5 text-[15px] text-slate-900">
                      <span className="font-semibold tabular-nums">
                        {property.currency || currency} {fmt(revenueOf(property))}
                      </span>{" "}
                      <span className="text-slate-500">/ month</span>
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PropertiesLayout>
  );
}
