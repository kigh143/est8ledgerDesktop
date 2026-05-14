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
    navigate({ to: '/dashboard' });
  }

  return <PropertiesLayout pageTitle={`${properties.length} Properties`} subTitle='All properties with agreement details'>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {properties.map((property: PropertyAgreement) => (
        <div
          key={property.id}
          className="bg-white rounded-2xl overflow-scroll border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-3"
        >
          {/* Image */}
          <div className="relative h-52 w-full overflow-hidden">
            <img
              src={placeholder}
              alt={property.propertyName}
              className="w-full h-full object-cover"
            />

            <span
              className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full text-white ${property.propertyType === "Residential"
                  ? "bg-blue-600"
                  : "bg-emerald-600"
                }`}
            >
              {property.propertyType}
            </span>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {property.propertyName}
              </h2>

              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                📍 {property.propertyAddress}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Tenants</p>
                <h3 className="text-lg font-bold text-gray-900">
                  {property.tenancies.length}
                </h3>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Clauses</p>
                <h3 className="text-lg font-bold text-gray-900">
                  {property.propertyClauses.length}
                </h3>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Units</p>
                <h3 className="text-lg font-bold text-gray-900">
                  {property.numberOfUnits}
                </h3>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Occupancy</p>
                <h3 className="text-lg font-bold text-gray-900">
                  {(property.tenancies.length/property.numberOfUnits)*100}%
                </h3>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs text-gray-500">Monthly Revenue</p>
                <p className="font-semibold text-gray-900">
                  UGX {property.tenancies.reduce((acc, current) => acc + +current.rentAmount, 0)}
                </p>
              </div>

              <button onClick={() => handlePropertyClicked(property)} className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:bg-gray-800 transition">
                View
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </PropertiesLayout>
}
