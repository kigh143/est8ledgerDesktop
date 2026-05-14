import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAppStore } from '../../store'
import tenancyService from '../../services/tenancyService'
import { X, Plus, Eye, Edit, Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import type { TenancyAgreement } from '../../types'

export const Route = createFileRoute('/dashboard/tenants')({
  component: RouteComponent,
})

function TenantModal({ tenant, isOpen, onClose, onSave }: { tenant?: TenancyAgreement; isOpen: boolean; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    firstName: tenant?.tenant?.firstName || '',
    lastName: tenant?.tenant?.lastName || '',
    email: tenant?.tenant?.email || '',
    phoneNumber: tenant?.tenant?.phoneNumber || '',
    unitName: tenant?.unitName || '',
    rentAmount: tenant?.rentAmount || '',
    securityDeposit: tenant?.securityDeposit || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (tenant?.id) {
        await tenancyService.updateTenancy({ ...tenant, ...formData })
        toast.success('Tenant updated successfully')
      } else {
        await tenancyService.createTenancy(formData)
        toast.success('Tenant created successfully')
      }
      onClose()
      onSave()
    } catch (error) {
      toast.error('Failed to save tenant')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900">
            {tenant ? 'Edit Tenant' : 'Add New Tenant'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+256 700 000000"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Unit Name
            </label>
            <input
              type="text"
              name="unitName"
              value={formData.unitName}
              onChange={handleChange}
              placeholder="Unit A, Floor 1"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Monthly Rent Amount (UGX)
            </label>
            <input
              type="number"
              name="rentAmount"
              value={formData.rentAmount}
              onChange={handleChange}
              placeholder="500,000"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Security Deposit (UGX)
            </label>
            <input
              type="number"
              name="securityDeposit"
              value={formData.securityDeposit}
              onChange={handleChange}
              placeholder="1,000,000"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f0ee3]/40 focus:border-[#3f0ee3]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#3f0ee3] to-[#3f0ee3]/90 text-white font-semibold shadow-lg shadow-[#3f0ee3]/40 hover:shadow-[#3f0ee3]/60 transition-all"
            >
              {tenant ? 'Update' : 'Add'} Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TenantViewModal({ tenant, isOpen, onClose, onEdit }: { tenant?: TenancyAgreement; isOpen: boolean; onClose: () => void; onEdit: () => void }) {
  if (!isOpen || !tenant) return null

  const signedByTenant = tenant.tenantSignedAt ? new Date(tenant.tenantSignedAt).toLocaleDateString() : 'Not signed'
  const signedByManager = tenant.mgtSignedAt ? new Date(tenant.mgtSignedAt).toLocaleDateString() : 'Not signed'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Tenant Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Tenant Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">First Name</p>
              <p className="text-lg font-semibold text-slate-900">{tenant.tenant.firstName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Last Name</p>
              <p className="text-lg font-semibold text-slate-900">{tenant.tenant.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Email</p>
              <p className="text-lg font-semibold text-slate-900 break-all">{tenant.tenant.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Phone</p>
              <p className="text-lg font-semibold text-slate-900">{tenant.tenant.phoneNumber}</p>
            </div>
          </div>

          {/* Tenancy Info */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tenancy Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Unit</p>
                <p className="text-lg font-semibold text-slate-900">{tenant.unitName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Monthly Rent</p>
                <p className="text-lg font-semibold text-slate-900">UGX {Number(tenant.rentAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Security Deposit</p>
                <p className="text-lg font-semibold text-slate-900">UGX {Number(tenant.securityDeposit).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Outstanding Balance</p>
                <p className="text-lg font-semibold text-slate-900">UGX {Number(tenant.outstandingBalance).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Agreement Status */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Agreement Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Manager Signed</p>
                <p className="text-sm font-semibold text-slate-900">{signedByManager}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Tenant Signed</p>
                <p className="text-sm font-semibold text-slate-900">{signedByTenant}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-slate-200 pt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#3f0ee3] to-[#3f0ee3]/90 text-white font-semibold shadow-lg shadow-[#3f0ee3]/40 hover:shadow-[#3f0ee3]/60 transition-all"
            >
              Edit Tenancy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RouteComponent() {
  const { activeProperty } = useAppStore()
  const [tenants, setTenants] = useState<TenancyAgreement[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenancyAgreement | null>(null)

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

  const handleViewTenant = (tenant: TenancyAgreement) => {
    setSelectedTenant(tenant)
    setShowViewModal(true)
  }

  const handleEditTenant = () => {
    setShowViewModal(false)
    setShowAddModal(true)
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setSelectedTenant(null)
    fetchTenants()
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
            onClick={() => {
              setSelectedTenant(null)
              setShowAddModal(true)
            }}
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
                            onClick={() => handleViewTenant(tenant)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#3f0ee3] hover:bg-blue-100 transition-colors text-xs font-medium"
                            title="View details"
                          >
                            <Eye size={16} />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTenant(tenant)
                              setShowAddModal(true)
                            }}
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

      {/* Modals */}
      <TenantModal
        tenant={selectedTenant || undefined}
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onSave={fetchTenants}
      />
      <TenantViewModal
        tenant={selectedTenant || undefined}
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        onEdit={handleEditTenant}
      />
    </>
  )
}
