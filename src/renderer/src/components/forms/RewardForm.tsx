import { useState, useEffect } from 'react'
import { Drawer } from '../ui/CustomDrawer'
import { Button } from '../ui/Button'
import { toast } from 'sonner'
import { rewardInputSchema } from '../../schemas/reward'
import { EmployeeSearchSelect } from './EmployeeSearchSelect'

function nextMonthIso(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function RewardForm({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void; initial?: any; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employee_id: initial?.employee_id?.toString() ?? '',
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    notes: initial?.notes ?? '',
    kind: initial?.kind ?? 'مكافأة',
    amount_usd: initial?.amount_usd?.toString() ?? '',
    reward_currency: initial?.reward_currency ?? 'USD',
    reward_date: initial?.reward_date ?? '',
    status: initial?.status ?? 'مدفوع',
    payroll_action: initial?.payroll_action ?? 'direct',
    payroll_month: initial?.payroll_month ?? nextMonthIso(),
  })
  const [saving, setSaving] = useState(false)
  const [rewardTypes, setRewardTypes] = useState<{id: number, name: string}[]>([])
  const [rewardStatuses, setRewardStatuses] = useState<{id: number, name: string}[]>([])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [types, statuses] = await Promise.all([
          (window.api as any).listRewardTypes?.().catch?.(() => []) ?? [],
          (window.api as any).listRewardStatuses?.().catch?.(() => []) ?? [],
        ])
        if (Array.isArray(types) && types.length > 0) setRewardTypes(types)
        else setRewardTypes(['مكافأة','تقدير','إنجاز','ابتكار','خاص'].map((n,i) => ({id:i,name:n})))
        if (Array.isArray(statuses) && statuses.length > 0) setRewardStatuses(statuses)
        else setRewardStatuses(['مدفوع','في الانتظار','معتمد'].map((n,i) => ({id:i,name:n})))
      } catch {
        setRewardTypes(['مكافأة','تقدير','إنجاز','ابتكار','خاص'].map((n,i) => ({id:i,name:n})))
        setRewardStatuses(['مدفوع','في الانتظار','معتمد'].map((n,i) => ({id:i,name:n})))
      }
    }
    loadOptions()
  }, [])

  useEffect(() => {
    if (initial) {
      setForm({
        employee_id: initial.employee_id?.toString() ?? '',
        title: initial.title ?? '',
        description: initial.description ?? '',
        notes: initial.notes ?? '',
        kind: initial.kind ?? 'مكافأة',
        amount_usd: initial.amount_usd?.toString() ?? '',
        reward_currency: initial.reward_currency ?? 'USD',
        reward_date: initial.reward_date ?? '',
        status: initial.status ?? 'مدفوع',
        payroll_action: initial.payroll_action ?? 'direct',
        payroll_month: initial.payroll_month ?? nextMonthIso(),
      })
    } else {
      setForm({
        employee_id: '',
        title: '',
        description: '',
        notes: '',
        kind: 'مكافأة',
        amount_usd: '',
        reward_currency: 'USD',
        reward_date: '',
        status: 'مدفوع',
        payroll_action: 'direct',
        payroll_month: nextMonthIso(),
      })
    }
  }, [initial, open])

  async function handleSave() {
    try {
      setSaving(true)
      const parsed = rewardInputSchema.parse(form)
      if (initial?.id) {
        await window.api.updateReward(initial.id, parsed)
        toast.success('تم تحديث المكافأة بنجاح')
      } else {
        await window.api.createReward(parsed)
        toast.success('تم إضافة المكافأة بنجاح')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      console.error('Reward save error:', e)
      if (e.issues) {
        // Zod validation errors
        const firstError = e.issues[0]?.message || 'البيانات غير صحيحة'
        toast.error(firstError)
      } else {
        toast.error('حدث خطأ أثناء حفظ المكافأة')
      }
    } finally {
      setSaving(false)
    }
  }

  return open ? (
    <Drawer title={initial ? 'تعديل مكافأة' : 'إضافة مكافأة جديدة'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-6" dir="rtl">
        {/* الموظف */}
        <EmployeeSearchSelect
          selectedId={form.employee_id ? Number(form.employee_id) : undefined}
          onSelect={(emp: any) => setForm(p => ({ ...p, employee_id: emp?.id?.toString() ?? '' }))}
          label="الموظف *"
          placeholder="ابحث عن الموظف..."
        />

        {/* النوع */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">النوع *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.kind}
            onChange={(e) => setForm(p => ({ ...p, kind: e.target.value }))}
          >
            {rewardTypes.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
            {rewardTypes.length === 0 && <option value="مكافأة">مكافأة</option>}
          </select>
        </div>

        {/* العنوان */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">العنوان *</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.title}
            onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="عنوان المكافأة"
          />
        </div>

        {/* التاريخ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ *</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.reward_date}
            onChange={(e) => setForm(p => ({ ...p, reward_date: e.target.value }))}
          />
        </div>

        {/* الحالة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الحالة *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.status}
            onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
          >
            {rewardStatuses.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
            {rewardStatuses.length === 0 && <option value="مدفوع">مدفوع</option>}
          </select>
        </div>

        {/* قيمة المكافأة */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            قيمة المكافأة <span className="text-gray-500 font-normal">(اختياري)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.amount_usd}
              onChange={(e) => setForm(p => ({ ...p, amount_usd: e.target.value }))}
              placeholder="0.00"
            />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
              value={form.reward_currency}
              onChange={(e) => setForm(p => ({ ...p, reward_currency: e.target.value }))}
            >
              <option value="USD">$ دولار</option>
              <option value="TRY">₺ ليرة</option>
            </select>
          </div>
        </div>

        {/* الوصف */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="وصف المكافأة (اختياري)"
            value={form.description}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
          />
        </div>

        {/* ملاحظات */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="ملاحظات إضافية (اختياري)"
            value={form.notes}
            onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
          />
        </div>

        {/* طريقة الصرف */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الصرف</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="payroll_action"
                value="direct"
                checked={form.payroll_action === 'direct'}
                onChange={() => setForm(p => ({ ...p, payroll_action: 'direct' }))}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">مدفوع مباشرةً</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="payroll_action"
                value="payroll"
                checked={form.payroll_action === 'payroll'}
                onChange={() => setForm(p => ({ ...p, payroll_action: 'payroll' }))}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">يضاف لراتب شهر محدد</span>
            </label>
          </div>
        </div>

        {/* شهر الراتب */}
        {form.payroll_action === 'payroll' && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">شهر الراتب المستهدف</label>
            <input
              type="month"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.payroll_month}
              onChange={(e) => setForm(p => ({ ...p, payroll_month: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">سيتم إضافة المكافأة كبند استثنائي في راتب هذا الشهر</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
        <Button disabled={saving} onClick={handleSave}>
          {saving ? 'جارٍ الحفظ…' : 'حفظ'}
        </Button>
      </div>
    </Drawer>
  ) : null
}
