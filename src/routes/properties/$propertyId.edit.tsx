import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Building2, Check, FileText, Loader2, Tags } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAppStore } from '../../store'
import PropertiesLayout from '../../componennts/PropertiesLayout'
import UnitPricingEditor from '../../componennts/property/UnitPricingEditor'
import agreementService from '../../services/agreementService'
import { getNetworkError } from '../../utils'
import {
  rowsFromUnitPricing,
  unitPricingError,
  unitPricingFromRows,
  type UnitPriceRow,
} from '../../utils/unitPricing'
import type { EvictionProcess, PropertyAgreement } from '../../types'

export const Route = createFileRoute('/properties/$propertyId/edit')({
  beforeLoad: () => {
    const { token } = useAppStore.getState()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async ({ params }) => {
    const res = await agreementService.getPropertyAgreement(params.propertyId)
    const property: PropertyAgreement = res?.data ?? res
    return { property }
  },
  component: EditPropertyPage,
})

interface EditFormData {
  propertyType: string
  propertyName: string
  city: string
  district: string
  propertyAddress: string
  numberOfUnits: string
  currency: string
  securityDepositMonths: string
  maxSecurityDepositMonths: string
  terminationNoticeDays: string
  rentIncreaseNoticeDays: string
  initialAdvanceMonths: string
  evictionProcess: string
}

const propertyTypes = ['Residential', 'Commercial', 'Mixed-Use']
const evictionProcesses: { value: EvictionProcess; label: string }[] = [
  { value: 'COURT', label: 'Through the courts' },
  { value: 'NOTICE', label: 'By written notice' },
  { value: 'OTHER', label: 'Other' },
]

const str = (v: number | string | null | undefined) => (v == null ? '' : String(v))
const toInt = (v: string) => (v.trim() === '' ? null : parseInt(v, 10))

const formFrom = (p: PropertyAgreement): EditFormData => ({
  propertyType: str(p.propertyType),
  propertyName: str(p.propertyName),
  city: str(p.city),
  district: str(p.district),
  propertyAddress: str(p.propertyAddress),
  numberOfUnits: str(p.numberOfUnits),
  currency: str(p.currency),
  securityDepositMonths: str(p.securityDepositMonths),
  maxSecurityDepositMonths: str(p.maxSecurityDepositMonths),
  terminationNoticeDays: str(p.terminationNoticeDays),
  rentIncreaseNoticeDays: str(p.rentIncreaseNoticeDays),
  initialAdvanceMonths: str(p.initialAdvanceMonths),
  evictionProcess: str(p.evictionProcess),
})

function Section({ icon: Icon, title, subtitle, children }: {
  icon: typeof Building2
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="card p-5 sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3f0ee3]/10 text-[#3f0ee3]">
          <Icon size={20} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Field({ label, required, hint, children }: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

function EditPropertyPage() {
  const { property } = Route.useLoaderData()
  const navigate = useNavigate()
  const { activeProperty, setActiveProperty } = useAppStore()
  const [form, setForm] = useState<EditFormData>(() => formFrom(property))
  const [unitRows, setUnitRows] = useState<UnitPriceRow[]>(() => rowsFromUnitPricing(property.unitPricing))
  const [saving, setSaving] = useState(false)

  const activeTenancies = property.tenancies?.length ?? 0
  const totalUnits = parseInt(form.numberOfUnits) || 0
  const set = (field: keyof EditFormData) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const required: (keyof EditFormData)[] = [
      'propertyType', 'propertyName', 'city', 'district', 'propertyAddress', 'numberOfUnits',
      'securityDepositMonths', 'terminationNoticeDays', 'rentIncreaseNoticeDays', 'initialAdvanceMonths',
    ]
    if (required.some((f) => !form[f].trim())) {
      toast.error('Please fill in all required fields')
      return
    }
    if (totalUnits < 1) {
      toast.error('A property needs at least one unit')
      return
    }
    const pricingError = unitPricingError(unitRows, totalUnits)
    if (pricingError) {
      toast.error(pricingError)
      return
    }

    setSaving(true)
    try {
      const data = {
        propertyType: form.propertyType,
        propertyName: form.propertyName.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        propertyAddress: form.propertyAddress.trim(),
        numberOfUnits: totalUnits,
        securityDepositMonths: toInt(form.securityDepositMonths),
        maxSecurityDepositMonths: toInt(form.maxSecurityDepositMonths),
        terminationNoticeDays: toInt(form.terminationNoticeDays),
        rentIncreaseNoticeDays: toInt(form.rentIncreaseNoticeDays),
        initialAdvanceMonths: toInt(form.initialAdvanceMonths),
        ...(form.evictionProcess && { evictionProcess: form.evictionProcess }),
        // Currency is fixed once tenants exist, so their rent stays in the currency they agreed
        ...(activeTenancies === 0 && { currency: form.currency }),
        unitPricing: unitPricingFromRows(unitRows),
      }
      const res = await agreementService.editPropertyAgreement({ id: property.id, data })
      const updated: Partial<PropertyAgreement> = res?.data ?? res
      if (activeProperty?.id === property.id) {
        // Keep the relations the dashboard already loaded; only the property's own fields changed
        setActiveProperty({ ...activeProperty, ...data, ...updated, tenancies: activeProperty.tenancies } as PropertyAgreement)
      }
      toast.success('Property updated')
      navigate({ to: '/properties' })
    } catch (error) {
      toast.error(getNetworkError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PropertiesLayout
      pageTitle="Edit Property"
      subTitle={property.propertyName}
      action={
        <Link to="/properties" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Back
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        <Section icon={Building2} title="Property details" subtitle="Where it is and how big it is">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Property name" required>
              <input className="field" value={form.propertyName} onChange={(e) => set('propertyName')(e.target.value)} />
            </Field>
            <Field label="Property type" required>
              <select className="field" value={form.propertyType} onChange={(e) => set('propertyType')(e.target.value)}>
                <option value="">Select property type</option>
                {propertyTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                {form.propertyType && !propertyTypes.includes(form.propertyType) && (
                  <option value={form.propertyType}>{form.propertyType}</option>
                )}
              </select>
            </Field>
            <Field label="City" required>
              <input className="field" value={form.city} onChange={(e) => set('city')(e.target.value)} />
            </Field>
            <Field label="District" required>
              <input className="field" value={form.district} onChange={(e) => set('district')(e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Street address" required>
                <input className="field" value={form.propertyAddress} onChange={(e) => set('propertyAddress')(e.target.value)} />
              </Field>
            </div>
            <Field
              label="Total units"
              required
              hint={
                activeTenancies > totalUnits && totalUnits > 0
                  ? `${activeTenancies} units are currently let, more than this total.`
                  : undefined
              }
            >
              <input
                type="number"
                min="1"
                className="field tabular-nums"
                aria-invalid={activeTenancies > totalUnits && totalUnits > 0}
                value={form.numberOfUnits}
                onChange={(e) => set('numberOfUnits')(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section
          icon={Tags}
          title="Unit prices"
          subtitle="What each unit lets for. Used to estimate your tax if the property is fully let all year."
        >
          <UnitPricingEditor rows={unitRows} onChange={setUnitRows} totalUnits={totalUnits} currency={form.currency} />
        </Section>

        <Section icon={FileText} title="Agreement terms" subtitle="Applied to new tenancy agreements for this property">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Currency"
              required
              hint={activeTenancies > 0 ? "Can't be changed while the property has tenants." : undefined}
            >
              <select
                className="field"
                value={form.currency}
                disabled={activeTenancies > 0}
                onChange={(e) => set('currency')(e.target.value)}
              >
                {['UGX', 'USD', 'EUR', 'GBP'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {form.currency && !['UGX', 'USD', 'EUR', 'GBP'].includes(form.currency) && (
                  <option value={form.currency}>{form.currency}</option>
                )}
              </select>
            </Field>
            <Field label="Eviction process">
              <select className="field" value={form.evictionProcess} onChange={(e) => set('evictionProcess')(e.target.value)}>
                <option value="">Not set</option>
                {evictionProcesses.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Security deposit (months)" required>
              <input type="number" min="0" className="field tabular-nums" value={form.securityDepositMonths} onChange={(e) => set('securityDepositMonths')(e.target.value)} />
            </Field>
            <Field label="Max security deposit (months)">
              <input type="number" min="0" className="field tabular-nums" value={form.maxSecurityDepositMonths} onChange={(e) => set('maxSecurityDepositMonths')(e.target.value)} />
            </Field>
            <Field label="Termination notice (days)" required>
              <input type="number" min="0" className="field tabular-nums" value={form.terminationNoticeDays} onChange={(e) => set('terminationNoticeDays')(e.target.value)} />
            </Field>
            <Field label="Rent increase notice (days)" required>
              <input type="number" min="0" className="field tabular-nums" value={form.rentIncreaseNoticeDays} onChange={(e) => set('rentIncreaseNoticeDays')(e.target.value)} />
            </Field>
            <Field label="Initial advance (months)" required>
              <input type="number" min="0" className="field tabular-nums" value={form.initialAdvanceMonths} onChange={(e) => set('initialAdvanceMonths')(e.target.value)} />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-3 pb-8">
          <Link to="/properties" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </PropertiesLayout>
  )
}
