import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAppStore } from '../../../store'
import tenancyService from '../../../services/tenancyService'
import { Plus, Eye, Edit, Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import type { TenancyAgreement } from '../../../types'

export const Route = createFileRoute('/dashboard/tenants/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { activeProperty } = useAppStore()
  const [tenants, setTenants] = useState<TenancyAgreement[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTenants()
  }, [activeProperty?.id])

  const fetchTenants = async () => {
    if (!activeProperty?.id) return
    try {
      setLoading(true)
      const response = await tenancyService.getPropertyTenancies(String(activeProperty.id))
      setTenants(Array.isArray(response) ? response : response.data || [])
    } catch (error) {
      toast.error('Failed to load tenants')
      setTenants([])
    } finally {
      setLoading(false)
    }
  }


  return (
    <>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {tenants.length} Tenant{tenants.length !== 1 ? 's' : ''}
            </h1>
            <p className="text-slate-500 mt-2 text-sm md:text-base">Manage all active tenants and their agreements</p>
          </div>
          <button
            onClick={() => navigate({ to: "/dashboard/tenants/add" })}
            className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#3f0ee3] to-[#3f0ee3]/90 text-white rounded-lg font-semibold shadow-lg shadow-[#3f0ee3]/40 hover:shadow-[#3f0ee3]/60 transition-all text-sm md:text-base"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Tenant</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white rounded-lg border border-slate-200">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-[#3f0ee3]/20 border-t-[#3f0ee3] rounded-full animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Loading tenants...</p>
            </div>
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex items-center justify-center py-16 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-2">No tenants yet</p>
              <p className="text-slate-500 text-sm">Add your first tenant to get started</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Tenant Name</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Contact</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Unit</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Monthly Rent</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Status</th>
                  <th className="px-4 md:px-6 py-4 text-right text-xs font-bold text-slate-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tenants.map((tenant) => {
                  const isFullySigned = tenant.mgtSignedAt && tenant.tenantSignedAt
                  const statusColor = isFullySigned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  const statusText = isFullySigned ? 'Signed' : 'Pending'

                  return (
                    <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 md:px-6 py-4 text-sm font-semibold text-slate-900">
                        {tenant.tenant.firstName} {tenant.tenant.lastName}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-slate-600">
                        <div className="flex flex-col gap-1">
                          <a href={`mailto:${tenant.tenant.email}`} className="text-[#3f0ee3] hover:underline">
                            {tenant.tenant.email}
                          </a>
                          <a href={`tel:${tenant.tenant.phoneNumber}`} className="text-[#3f0ee3] hover:underline">
                            {tenant.tenant.phoneNumber}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-medium text-slate-900">{tenant.unitName}</td>
                      <td className="px-4 md:px-6 py-4 text-sm font-bold text-slate-900">
                        UGX {Number(tenant.rentAmount).toLocaleString()}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                          <div className="w-2 h-2 rounded-full bg-current" />
                          {statusText}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate({ to: `/dashboard/tenants/${tenant.id}` })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#3f0ee3] hover:bg-blue-100 transition-colors text-xs font-medium"
                            title="View details"
                          >
                            <Eye size={16} />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <button
                            onClick={() => navigate({ to: `/dashboard/tenants/edit/${tenant.id}` })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-[#3f0ee3] hover:bg-purple-100 transition-colors text-xs font-medium"
                            title="Edit tenant"
                          >
                            <Edit size={16} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </>
  )
}
