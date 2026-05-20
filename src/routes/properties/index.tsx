import { createFileRoute, redirect, } from '@tanstack/react-router'
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

function RouteComponent() {
  const { properties } = Route.useLoaderData();
  const state = useAppStore();
  const navigate = Route.useNavigate();


  const handlePropertyClicked = (property: PropertyAgreement) => {
    state.setActiveProperty(property);
    navigate({ to: '/dashboard/home' });
  }

  return <PropertiesLayout pageTitle={`${properties.length} Properties`} subTitle='All properties with agreement details'>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
      {properties.map((property: PropertyAgreement) => {
        const occupancy = property.numberOfUnits > 0
          ? Math.round((property.tenancies.length / property.numberOfUnits) * 100)
          : 0;
        const monthlyRevenue = property.tenancies.reduce((acc, current) => acc + +current.rentAmount, 0);

        return (
          <div
            key={property.id}
            onClick={() => handlePropertyClicked(property)}
            className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#552ae7]/25 transition-all duration-300 cursor-pointer"
          >
            {/* Image Container */}
            <div className="relative h-48 w-full overflow-hidden bg-gray-200">
              <img
                src={placeholder}
                alt={property.propertyName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Badge */}
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <span className="absolute top-4 right-4 px-3 py-1.5 text-xs font-semibold rounded-full text-white bg-linear-to-r from-[#552ae7] to-[#552ae7] shadow-lg">
                {property.propertyType}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#552ae7] transition-colors">
                  {property.propertyName}
                </h2>
                <p className="text-sm text-gray-500 flex items-center gap-2 line-clamp-1">
                  <span className="text-lg">📍</span>
                  <span>{property.propertyAddress}</span>
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#552ae7]/5 rounded-lg p-3 border border-[#552ae7]/15">
                  <p className="text-xs font-medium text-gray-600">Tenants</p>
                  <h3 className="text-lg font-bold text-[#552ae7] mt-1">
                    {property.tenancies.length}
                  </h3>
                </div>

                <div className="bg-[#552ae7]/5 rounded-lg p-3 border border-[#552ae7]/15">
                  <p className="text-xs font-medium text-gray-600">Clauses</p>
                  <h3 className="text-lg font-bold text-[#552ae7] mt-1">
                    {property.propertyClauses.length}
                  </h3>
                </div>

                <div className="bg-[#552ae7]/5 rounded-lg p-3 border border-[#552ae7]/15">
                  <p className="text-xs font-medium text-gray-600">Units</p>
                  <h3 className="text-lg font-bold text-[#552ae7] mt-1">
                    {property.numberOfUnits}
                  </h3>
                </div>

                <div className="bg-[#552ae7]/5 rounded-lg p-3 border border-[#552ae7]/15">
                  <p className="text-xs font-medium text-gray-600">Occupancy</p>
                  <h3 className="text-lg font-bold text-[#552ae7] mt-1">
                    {occupancy}%
                  </h3>
                </div>
              </div>

              {/* Revenue Section */}
              <div className="bg-[#552ae7]/5 rounded-lg p-3 border border-[#552ae7]/15">
                <p className="text-xs font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-lg font-bold text-[#552ae7] mt-1">
                  UGX {monthlyRevenue.toLocaleString()}
                </p>
              </div>

              {/* CTA Button */}
              <button className="w-full py-2.5 px-4 bg-linear-to-r from-[#552ae7] to-[#552ae7] hover:from-[#552ae7] hover:to-[#381751] text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">
                View Details →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </PropertiesLayout>
}
