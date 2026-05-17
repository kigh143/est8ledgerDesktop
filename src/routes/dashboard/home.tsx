import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, DollarSign, Home, Zap, FileText, TrendingUp } from 'lucide-react'
import { useAppStore } from '../../store'
import { tenancyService } from '../../services/tenancyService'
import { inspectionService } from '../../services/inspectionService'
import { securityDepositService } from '../../services/securityDepositService'
import { repairService } from '../../services/repairService'
import { expenseService } from '../../services/expenseService'
import { toast } from 'react-toastify'

export const Route = createFileRoute('/dashboard/home')({
  component: DashboardHome,
})

interface DashboardStats {
  occupancyRate: number
  totalUnits: number
  occupiedUnits: number
  completedInspections: number
  pendingInspections: number
  securityDepositsPaid: number
  securityDepositsCollecting: number
  totalRepairRequests: number
  repairsByStatus: {
    reported: number
    inProgress: number
    completed: number
    cancelled: number
  }
  monthlyExpenses: number
  notifications: Array<{
    id: string
    type: 'warning' | 'alert' | 'info'
    title: string
    message: string
  }>
}

function DashboardHome() {
  const { activeProperty } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    occupancyRate: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    completedInspections: 0,
    pendingInspections: 0,
    securityDepositsPaid: 0,
    securityDepositsCollecting: 0,
    totalRepairRequests: 0,
    repairsByStatus: {
      reported: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    },
    monthlyExpenses: 0,
    notifications: [],
  })

  useEffect(() => {
    loadDashboardData()
  }, [activeProperty?.id])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      if (!activeProperty) {
        toast.error('No property selected')
        return
      }

      const propertyId = activeProperty.id.toString()
      const notifications: DashboardStats['notifications'] = []

      // Get tenancies and calculate occupancy
      const tenanciesResponse = await tenancyService.getPropertyTenancies(propertyId)
      const tenancies = Array.isArray(tenanciesResponse)
        ? tenanciesResponse
        : tenanciesResponse.data || []
      const totalUnits = activeProperty.numberOfUnits || 0
      const occupiedUnits = tenancies.length
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

      // Get inspections
      const inspectionsResponse = await inspectionService.getPropertyInspections(propertyId)
      const inspections = Array.isArray(inspectionsResponse)
        ? inspectionsResponse
        : inspectionsResponse.data || []
      const completedInspections = inspections.filter(
        (i: any) => i.status === 'COMPLETED' || i.status === 'APPROVED'
      ).length
      const pendingInspections = inspections.filter(
        (i: any) => i.status === 'PENDING' || i.status === 'IN_PROGRESS'
      ).length

      // Get security deposits
      const depositsResponse = await securityDepositService.getPropertyDeposits(propertyId)
      const deposits = Array.isArray(depositsResponse)
        ? depositsResponse
        : depositsResponse.data || []
      const securityDepositsPaid = deposits.filter(
        (d: any) => d.status === 'completed' || d.status === 'COMPLETED'
      ).length
      const securityDepositsCollecting = deposits.filter(
        (d: any) => d.status === 'pending' || d.status === 'PENDING'
      ).length

      // Get repairs
      const repairsResponse = await repairService.getPropertyRepairs(propertyId)
      const repairs = Array.isArray(repairsResponse)
        ? repairsResponse
        : repairsResponse.data || []
      const totalRepairRequests = repairs.length
      const repairsByStatus = {
        reported: repairs.filter((r: any) => r.status === 'REPORTED').length,
        inProgress: repairs.filter((r: any) => r.status === 'IN_PROGRESS').length,
        completed: repairs.filter((r: any) => r.status === 'COMPLETED').length,
        cancelled: repairs.filter((r: any) => r.status === 'CANCELLED').length,
      }

      // Get expenses for current month
      const expensesResponse = await expenseService.getPropertyExpenses(propertyId)
      const expenses = Array.isArray(expensesResponse)
        ? expensesResponse
        : expensesResponse.data || []
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyExpenses = expenses
        .filter((e: any) => {
          const expenseDate = new Date(e.createdAt)
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
        })
        .reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0)

      // Generate notifications
      if (pendingInspections > 0) {
        notifications.push({
          id: 'inspections',
          type: 'warning',
          title: 'Pending Inspections',
          message: `You have ${pendingInspections} inspection${pendingInspections > 1 ? 's' : ''} pending approval`,
        })
      }

      if (securityDepositsCollecting > 0) {
        notifications.push({
          id: 'deposits',
          type: 'alert',
          title: 'Security Deposits Pending',
          message: `${securityDepositsCollecting} security deposit${securityDepositsCollecting > 1 ? 's' : ''} awaiting payment`,
        })
      }

      if (repairsByStatus.reported > 0) {
        notifications.push({
          id: 'repairs',
          type: 'warning',
          title: 'New Repair Requests',
          message: `${repairsByStatus.reported} repair request${repairsByStatus.reported > 1 ? 's' : ''} reported`,
        })
      }

      if (occupancyRate < 80 && occupancyRate > 0) {
        notifications.push({
          id: 'occupancy',
          type: 'info',
          title: 'Low Occupancy',
          message: `Your property is ${occupancyRate}% occupied. Consider marketing available units.`,
        })
      }

      setStats({
        occupancyRate,
        totalUnits,
        occupiedUnits,
        completedInspections,
        pendingInspections,
        securityDepositsPaid,
        securityDepositsCollecting,
        totalRepairRequests,
        repairsByStatus,
        monthlyExpenses,
        notifications,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#3f0ee3]/20 border-t-[#3f0ee3] rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">{activeProperty?.propertyName}</p>
      </div>

      {/* Alerts/Notifications */}
      {stats.notifications.length > 0 && (
        <div className="space-y-3">
          {stats.notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg p-4 flex items-start gap-3 ${
                notification.type === 'alert'
                  ? 'bg-red-50 border border-red-200'
                  : notification.type === 'warning'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {notification.type === 'alert' ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : notification.type === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`font-semibold ${
                    notification.type === 'alert'
                      ? 'text-red-900'
                      : notification.type === 'warning'
                        ? 'text-amber-900'
                        : 'text-blue-900'
                  }`}
                >
                  {notification.title}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    notification.type === 'alert'
                      ? 'text-red-800'
                      : notification.type === 'warning'
                        ? 'text-amber-800'
                        : 'text-blue-800'
                  }`}
                >
                  {notification.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Occupancy Rate */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase">Occupancy Rate</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.occupancyRate}%</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.occupiedUnits} of {stats.totalUnits} units
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#3f0ee3]/10 flex items-center justify-center">
              <Home className="w-6 h-6 text-[#3f0ee3]" />
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-[#3f0ee3] h-2 rounded-full transition-all"
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Inspections */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase">Inspections</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.completedInspections}</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.pendingInspections} pending
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Completed</span>
              <span className="font-semibold text-slate-900">{stats.completedInspections}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Pending</span>
              <span className="font-semibold text-amber-600">{stats.pendingInspections}</span>
            </div>
          </div>
        </div>

        {/* Security Deposits */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase">Security Deposits</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.securityDepositsPaid}</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.securityDepositsCollecting} pending
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Paid</span>
              <span className="font-semibold text-slate-900">{stats.securityDepositsPaid}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Collecting</span>
              <span className="font-semibold text-orange-600">{stats.securityDepositsCollecting}</span>
            </div>
          </div>
        </div>

        {/* Total Repair Requests */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase">Repair Requests</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalRepairRequests}</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.repairsByStatus.inProgress} in progress
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Reported</span>
              <span className="font-semibold text-red-600">{stats.repairsByStatus.reported}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">In Progress</span>
              <span className="font-semibold text-amber-600">{stats.repairsByStatus.inProgress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Completed</span>
              <span className="font-semibold text-emerald-600">{stats.repairsByStatus.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Cancelled</span>
              <span className="font-semibold text-slate-500">{stats.repairsByStatus.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase">Monthly Expenses</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(stats.monthlyExpenses)}
              </p>
              <p className="text-sm text-slate-500 mt-1">This month ({new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-[#3f0ee3] to-[#3f0ee3]/80 rounded-lg p-6 shadow-sm text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/80 uppercase">Property Overview</p>
              <p className="text-2xl font-bold mt-2">All Systems Optimal</p>
              <p className="text-sm text-white/70 mt-1">
                {stats.notifications.length === 0
                  ? 'No alerts at this time'
                  : `${stats.notifications.length} notification${stats.notifications.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Quick Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Total Units</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalUnits}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Total Inspections</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.completedInspections + stats.pendingInspections}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Total Deposits</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.securityDepositsPaid + stats.securityDepositsCollecting}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-2">Total Repairs</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalRepairRequests}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
