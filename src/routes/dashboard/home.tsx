import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Home,
  Wrench,
  ClipboardCheck,
  ShieldCheck,
  LayoutDashboard,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Users,
  Megaphone,
} from 'lucide-react'
import { useAppStore } from '../../store'
import { PageHeader } from '../../componennts/dashboard/ui'
import { tenancyService } from '../../services/tenancyService'
import { inspectionService } from '../../services/inspectionService'
import { securityDepositService } from '../../services/securityDepositService'
import { repairService } from '../../services/repairService'
import { expenseService } from '../../services/expenseService'
import { toast } from 'react-toastify'

export const Route = createFileRoute('/dashboard/home')({
  component: DashboardHome,
})

interface LateTenancy {
  id: number
  tenantName: string
  unitName: string
  daysLate: number
  outstandingBalance: number
}

interface AttentionItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  icon: typeof AlertTriangle
  title: string
  message: string
  to?: string
}

interface DashboardStats {
  occupancyRate: number
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
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
  urgentRepairs: number
  monthlyExpenses: number
  expectedMonthlyRevenue: number
  outstandingBalance: number
  estimatedLostRevenue: number
  lateTenancies: LateTenancy[]
}

const currencyOf = (activeProperty: any) => activeProperty?.currency || 'UGX'

function DashboardHome() {
  const { activeProperty } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    occupancyRate: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    completedInspections: 0,
    pendingInspections: 0,
    securityDepositsPaid: 0,
    securityDepositsCollecting: 0,
    totalRepairRequests: 0,
    repairsByStatus: { reported: 0, inProgress: 0, completed: 0, cancelled: 0 },
    urgentRepairs: 0,
    monthlyExpenses: 0,
    expectedMonthlyRevenue: 0,
    outstandingBalance: 0,
    estimatedLostRevenue: 0,
    lateTenancies: [],
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

      // Tenancies -> occupancy, expected revenue, rent-collection risk
      const tenanciesResponse = await tenancyService.getPropertyTenancies(propertyId)
      const tenancies = Array.isArray(tenanciesResponse) ? tenanciesResponse : tenanciesResponse.data || []
      const totalUnits = activeProperty.numberOfUnits || 0
      const occupiedUnits = tenancies.length
      const vacantUnits = Math.max(totalUnits - occupiedUnits, 0)
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

      const expectedMonthlyRevenue = tenancies.reduce(
        (sum: number, t: any) => sum + (parseFloat(t.rentAmount) || 0),
        0
      )
      const outstandingBalance = tenancies.reduce(
        (sum: number, t: any) => sum + (parseFloat(t.outstandingBalance) || 0),
        0
      )
      const avgRent = occupiedUnits > 0 ? expectedMonthlyRevenue / occupiedUnits : 0
      const estimatedLostRevenue = vacantUnits * avgRent

      const lateTenancies: LateTenancy[] = tenancies
        .filter((t: any) => (parseFloat(t.outstandingBalance) || 0) > 0 || (t.days_of_late_payment || 0) > 0)
        .map((t: any) => ({
          id: t.id,
          tenantName: `${t.tenant?.firstName || ''} ${t.tenant?.lastName || ''}`.trim() || 'Tenant',
          unitName: t.unitName,
          daysLate: t.days_of_late_payment || 0,
          outstandingBalance: parseFloat(t.outstandingBalance) || 0,
        }))
        .sort((a: LateTenancy, b: LateTenancy) => b.outstandingBalance - a.outstandingBalance || b.daysLate - a.daysLate)

      // Inspections
      const inspectionsResponse = await inspectionService.getPropertyInspections(propertyId)
      const inspections = Array.isArray(inspectionsResponse) ? inspectionsResponse : inspectionsResponse.data || []
      const completedInspections = inspections.filter(
        (i: any) => i.status === 'COMPLETED' || i.status === 'APPROVED'
      ).length
      const pendingInspections = inspections.filter(
        (i: any) => i.status === 'PENDING' || i.status === 'IN_PROGRESS'
      ).length

      // Security deposits
      const depositsResponse = await securityDepositService.getPropertyDeposits(propertyId)
      const deposits = Array.isArray(depositsResponse) ? depositsResponse : depositsResponse.data || []
      const securityDepositsPaid = deposits.filter(
        (d: any) => d.status === 'completed' || d.status === 'COMPLETED'
      ).length
      const securityDepositsCollecting = deposits.filter(
        (d: any) => d.status === 'pending' || d.status === 'PENDING'
      ).length

      // Repairs
      const repairsResponse = await repairService.getManagementRepairs(propertyId)
      const repairs = Array.isArray(repairsResponse) ? repairsResponse : repairsResponse.data || []
      const totalRepairRequests = repairs.length
      const repairsByStatus = {
        reported: repairs.filter((r: any) => r.status === 'REPORTED').length,
        inProgress: repairs.filter((r: any) => r.status === 'IN_PROGRESS').length,
        completed: repairs.filter((r: any) => r.status === 'COMPLETED').length,
        cancelled: repairs.filter((r: any) => r.status === 'CANCELLED').length,
      }
      const urgentRepairs = repairs.filter(
        (r: any) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (r.priority === 'URGENT' || r.priority === 'HIGH')
      ).length

      // Expenses (current month)
      const expensesResponse = await expenseService.getPropertyExpenses(propertyId)
      const expenses = Array.isArray(expensesResponse) ? expensesResponse : expensesResponse.data || []
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyExpenses = expenses
        .filter((e: any) => {
          const expenseDate = new Date(e.createdAt)
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
        })
        .reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0)

      setStats({
        occupancyRate,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        completedInspections,
        pendingInspections,
        securityDepositsPaid,
        securityDepositsCollecting,
        totalRepairRequests,
        repairsByStatus,
        urgentRepairs,
        monthlyExpenses,
        expectedMonthlyRevenue,
        outstandingBalance,
        estimatedLostRevenue,
        lateTenancies,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const currency = currencyOf(activeProperty)
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n))
  const netOperatingIncome = stats.expectedMonthlyRevenue - stats.monthlyExpenses

  // Priority-ordered, actionable list of what the landlord should look at first.
  const attentionItems: AttentionItem[] = []
  if (stats.lateTenancies.length > 0) {
    attentionItems.push({
      id: 'rent-overdue',
      severity: 'critical',
      icon: Wallet,
      title: 'Rent overdue',
      message: `${stats.lateTenancies.length} tenant${stats.lateTenancies.length > 1 ? 's' : ''} behind on payment — ${currency} ${fmt(stats.outstandingBalance)} outstanding`,
      to: '/dashboard/renttracking',
    })
  }
  if (stats.urgentRepairs > 0) {
    attentionItems.push({
      id: 'urgent-repairs',
      severity: 'critical',
      icon: Wrench,
      title: 'Urgent repairs open',
      message: `${stats.urgentRepairs} high-priority repair${stats.urgentRepairs > 1 ? 's' : ''} awaiting action`,
      to: '/dashboard/repairs',
    })
  }
  if (stats.repairsByStatus.reported > 0 && stats.urgentRepairs === 0) {
    attentionItems.push({
      id: 'new-repairs',
      severity: 'warning',
      icon: Wrench,
      title: 'New repair requests',
      message: `${stats.repairsByStatus.reported} repair request${stats.repairsByStatus.reported > 1 ? 's' : ''} reported and unassigned`,
      to: '/dashboard/repairs',
    })
  }
  if (stats.pendingInspections > 0) {
    attentionItems.push({
      id: 'inspections',
      severity: 'warning',
      icon: ClipboardCheck,
      title: 'Inspections pending approval',
      message: `${stats.pendingInspections} inspection${stats.pendingInspections > 1 ? 's' : ''} waiting on you`,
      to: '/dashboard/inspections',
    })
  }
  if (stats.securityDepositsCollecting > 0) {
    attentionItems.push({
      id: 'deposits',
      severity: 'warning',
      icon: ShieldCheck,
      title: 'Security deposits pending',
      message: `${stats.securityDepositsCollecting} deposit${stats.securityDepositsCollecting > 1 ? 's' : ''} awaiting payment`,
      to: '/dashboard/securitydeposits',
    })
  }
  if (stats.vacantUnits > 0) {
    attentionItems.push({
      id: 'vacancy',
      severity: 'info',
      icon: Megaphone,
      title: 'Vacant units',
      message: `${stats.vacantUnits} unit${stats.vacantUnits > 1 ? 's' : ''} vacant — an estimated ${currency} ${fmt(stats.estimatedLostRevenue)}/mo in unrealized rent`,
    })
  }

  const severityStyle: Record<AttentionItem['severity'], { card: string; iconWrap: string; icon: string; title: string }> = {
    critical: { card: 'bg-red-50 border-red-200 hover:bg-red-100/60', iconWrap: 'bg-red-100', icon: 'text-red-600', title: 'text-red-900' },
    warning: { card: 'bg-amber-50 border-amber-200 hover:bg-amber-100/60', iconWrap: 'bg-amber-100', icon: 'text-amber-600', title: 'text-amber-900' },
    info: { card: 'bg-sky-50 border-sky-200 hover:bg-sky-100/60', iconWrap: 'bg-sky-100', icon: 'text-sky-600', title: 'text-sky-900' },
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        <div className="h-24 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle={activeProperty?.propertyName} />

      {/* Needs Your Attention */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <AlertTriangle size={18} className="text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Needs Your Attention</h2>
          {attentionItems.length > 0 && (
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 tabular-nums">
              {attentionItems.length}
            </span>
          )}
        </div>

        {attentionItems.length === 0 ? (
          <div className="flex items-center gap-3 px-6 py-8">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <p className="font-semibold text-slate-900">All caught up</p>
              <p className="text-sm text-slate-500">No pending issues need your action right now.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attentionItems.map((item) => {
              const s = severityStyle[item.severity]
              const content = (
                <div className={`flex items-start gap-3 px-5 sm:px-6 py-4 border-l-4 transition-colors ${s.card}`}>
                  <span className={`flex items-center justify-center w-5 h-5 rounded-xl shrink-0 ${s.iconWrap} ${s.icon}`}>
                    <item.icon size={19} />
                  </span>
                  <div className="min-w-0">
                    {/* <p className={`font-semibold ${s.title}`}>{item.title}</p> */}
                    <p className="text-xs text-slate-600 mt-0.5">{item.message}</p>
                  </div>
                  {item.to && <ArrowRight size={18} className="text-slate-400 shrink-0 mt-2" />}
                </div>
              )
              return item.to ? (
                <Link key={item.id} to={item.to} className="block">
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              )
            })}
          </div>
        )}
      </div>

      {/* Financial Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected Revenue</p>
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#3f0ee3]/10 text-[#3f0ee3]">
              <Wallet size={17} />
            </span>
          </div>
          <p className="mt-3 text-xl font-bold text-slate-900 tabular-nums truncate">{currency} {fmt(stats.expectedMonthlyRevenue)}</p>
          <p className="text-xs text-slate-400 mt-1">Per month, from {stats.occupiedUnits} occupied unit{stats.occupiedUnits !== 1 ? 's' : ''}</p>
        </div>

        <Link to="/dashboard/renttracking" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow block">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outstanding Balance</p>
            <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${stats.outstandingBalance > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <AlertTriangle size={17} />
            </span>
          </div>
          <p className={`mt-3 text-xl font-bold tabular-nums truncate ${stats.outstandingBalance > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {currency} {fmt(stats.outstandingBalance)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{stats.lateTenancies.length} tenant{stats.lateTenancies.length !== 1 ? 's' : ''} behind on rent</p>
        </Link>

        <Link to="/dashboard/expenses" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow block">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly Expenses</p>
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-100 text-purple-600">
              <TrendingDown size={17} />
            </span>
          </div>
          <p className="mt-3 text-xl font-bold text-slate-900 tabular-nums truncate">{currency} {fmt(stats.monthlyExpenses)}</p>
          <p className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
        </Link>

        <div className={`rounded-2xl p-5 shadow-lg text-white ${netOperatingIncome >= 0 ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-emerald-500/25' : 'bg-gradient-to-br from-red-600 to-red-500 shadow-red-500/25'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Net Operating Income</p>
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/20 text-white">
              {netOperatingIncome >= 0 ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
            </span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums truncate">{currency} {fmt(Math.abs(netOperatingIncome))}</p>
          <p className="text-xs text-white/70 mt-1">{netOperatingIncome >= 0 ? 'Revenue exceeds expenses' : 'Expenses exceed revenue'}</p>
        </div>
      </div>

      {/* Occupancy & Repair Backlog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Occupancy</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">{stats.occupancyRate}%</p>
              <p className="text-sm text-slate-500 mt-1">{stats.occupiedUnits} of {stats.totalUnits} units occupied</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#3f0ee3]/10 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-[#3f0ee3]" />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all ${stats.occupancyRate >= 75 ? 'bg-emerald-500' : stats.occupancyRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
          {stats.vacantUnits > 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <Megaphone size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-900">
                <span className="font-semibold">{stats.vacantUnits} vacant unit{stats.vacantUnits !== 1 ? 's' : ''}</span> costing an estimated{' '}
                <span className="font-semibold">{currency} {fmt(stats.estimatedLostRevenue)}/mo</span> in unrealized rent.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-900 font-medium">Fully occupied — no vacant units.</p>
            </div>
          )}
        </div>

        {/* Repair Backlog */}
        <Link to="/dashboard/repairs" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow block">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Repair Backlog</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 tabular-nums">{stats.totalRepairRequests}</p>
              <p className="text-sm text-slate-500 mt-1">
                {stats.urgentRepairs > 0 ? `${stats.urgentRepairs} high priority` : 'total requests'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-red-600" />
            </div>
          </div>
          {stats.totalRepairRequests > 0 ? (
            <div className="space-y-2.5">
              {[
                { label: 'Reported', value: stats.repairsByStatus.reported, color: 'bg-red-500' },
                { label: 'In Progress', value: stats.repairsByStatus.inProgress, color: 'bg-amber-500' },
                { label: 'Completed', value: stats.repairsByStatus.completed, color: 'bg-emerald-500' },
                { label: 'Cancelled', value: stats.repairsByStatus.cancelled, color: 'bg-slate-300' },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-slate-600 shrink-0">{row.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.color}`}
                      style={{ width: `${stats.totalRepairRequests > 0 ? (row.value / stats.totalRepairRequests) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-semibold text-slate-900 tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No repair requests on record.</p>
          )}
        </Link>
      </div>

      {/* Rent Collection Risk */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Users size={18} className="text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Tenants Behind on Rent</h2>
          {stats.lateTenancies.length > 0 && (
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 tabular-nums">
              {stats.lateTenancies.length}
            </span>
          )}
        </div>
        {stats.lateTenancies.length === 0 ? (
          <div className="flex items-center gap-3 px-6 py-8">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <p className="font-semibold text-slate-900">All tenants are current</p>
              <p className="text-sm text-slate-500">No outstanding balances or late payments.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.lateTenancies.slice(0, 6).map((t) => (
              <Link
                key={t.id}
                to="/dashboard/tenants/$tenantId"
                params={{ tenantId: String(t.id) }}
                className="flex items-center gap-4 px-5 sm:px-6 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{t.tenantName}</p>
                  <p className="text-xs text-slate-500 truncate">Unit {t.unitName}{t.daysLate > 0 ? ` · ${t.daysLate} day${t.daysLate !== 1 ? 's' : ''} late` : ''}</p>
                </div>
                <p className="font-semibold text-red-600 tabular-nums shrink-0">{currency} {fmt(t.outstandingBalance)}</p>
                <ArrowRight size={16} className="text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
