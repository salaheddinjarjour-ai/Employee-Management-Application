import { useState, useEffect } from 'react'
import { Drawer } from '../ui/CustomDrawer'
import { Button } from '../ui/Button'
import { toast } from 'sonner'
import { EmployeeSearchSelect } from './EmployeeSearchSelect'

// Days difference calculation (inclusive)
function daysDiffInclusive(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(+s) || isNaN(+e)) return 0;
  return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
}

export function LeaveFormDrawer({ open, onClose, initial, onSaved }: {
  open: boolean; onClose: () => void; initial?: any; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employeeId: initial?.employee_id ? Number(initial.employee_id) : null as number | null,
    employeeName: initial?.employee_name ?? '',
    type: initial?.leave_type ?? '',
    reason: initial?.reason ?? '',
    fromDate: (initial?.start_date || initial?.from_date) ?? '',
    toDate: (initial?.end_date || initial?.to_date) ?? '',
    days: initial?.days_count ? Number(initial.days_count) : 0,
    status: initial?.status ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState<{id: number, name: string}[]>([])
  const [leaveStatuses, setLeaveStatuses] = useState<{id: number, name: string}[]>([])

  useEffect(() => {
    window.electronAPI.invoke('leaves:list-types').then((types: any[]) => {
      setLeaveTypes(types)
      if (types.length > 0 && !form.type) {
        setForm(p => ({ ...p, type: p.type || types[0].name }))
      }
    }).catch(() => {
      setLeaveTypes(['سنوية','مرضية','طارئة','بدون راتب','أمومة','أبوة','أخرى'].map((n,i) => ({id:i,name:n})))
    })
    window.electronAPI.invoke('leaves:list-statuses').then((statuses: any[]) => {
      setLeaveStatuses(statuses)
      if (statuses.length > 0 && !form.status) {
        setForm(p => ({ ...p, status: p.status || statuses[0].name }))
      }
    }).catch(() => {
      setLeaveStatuses(['في الانتظار','معتمد','مرفوض'].map((n,i) => ({id:i,name:n})))
    })
  }, [])

  // Convert from any picker format to ISO YYYY-MM-DD
  function toISO(input: string | Date | null): string {
    if (!input) return '';
    const d = typeof input === 'string' ? new Date(input) : input;
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  // Calculate days inclusive
  function diffDaysInclusive(aISO: string, bISO: string): number {
    if (!aISO || !bISO) return 0;
    const a = new Date(aISO);
    const b = new Date(bISO);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
    return Math.floor(ms / 86400000) + 1; // inclusive
  }

  useEffect(() => {
    if (open) {
      setForm({
        employeeId: initial?.employee_id ? Number(initial.employee_id) : null,
        employeeName: initial?.employee_name ?? '',
        type: initial?.leave_type ?? (leaveTypes[0]?.name || 'سنوية'),
        reason: initial?.reason ?? '',
        fromDate: toISO((initial?.start_date || initial?.from_date)),
        toDate: toISO((initial?.end_date || initial?.to_date)),
        days: initial?.days_count ? Number(initial.days_count) : 0,
        status: initial?.status ?? (leaveStatuses[0]?.name || 'في الانتظار'),
      })
    }
  }, [open, initial])

  // recompute days on dates change
  useEffect(() => {
    if (!form.fromDate || !form.toDate) return;
    const d = daysDiffInclusive(form.fromDate, form.toDate);
    if (d > 0) setForm(p => ({ ...p, days: d }));
  }, [form.fromDate, form.toDate]);

  async function handleSave() {
    try {
      setSaving(true);

      // Validation
      if (!form.employeeId || !form.fromDate || !form.toDate) {
        toast.error('يرجى اختيار الموظف وتاريخ البداية والنهاية');
        return;
      }

      if (new Date(form.fromDate) > new Date(form.toDate)) {
        toast.error('تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية');
        return;
      }

      const days = diffDaysInclusive(form.fromDate, form.toDate);

      const empIdNum = Number(form.employeeId);

      // Send normalized payload
      const payload = {
        employee_id: empIdNum,
        employee_name: form.employeeName,
        leave_type: form.type,
        from_date: toISO(form.fromDate),
        to_date: toISO(form.toDate),
        days_count: days, // Matching schema
        status: form.status,
        reason: form.reason?.trim() || null
      };

      console.log('[Leaves/SAVE] payload ->', payload);

      let result;
      if (initial?.id) {
        result = await window.electronAPI.invoke('leaves:update', { id: initial.id, ...payload });
      } else {
        result = await window.electronAPI.invoke('leaves:create', payload);
      }

      // Handle success
      if (result && (result.success || result.id)) {
        toast.success('تم الحفظ');
        onSaved();
        onClose();
      } else {
        const errorMsg = result?.error || 'فشل في حفظ الإجازة';
        toast.error(errorMsg);
        console.error('[LEAVE/SAVE] IPC error:', result);
      }
    } catch (err: any) {
      console.error('[LEAVE/SAVE] error ->', err);
      const msg = err?.message || err?.toString?.() || 'حدث خطأ أثناء حفظ طلب الإجازة';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return open ? (
    <Drawer title={initial ? 'تعديل طلب إجازة' : 'طلب إجازة جديد'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-6" dir="rtl">
        {/* الموظف */}
        <EmployeeSearchSelect
          selectedId={form.employeeId ?? undefined}
          onSelect={(emp: any) => setForm(p => ({ ...p, employeeId: emp?.id, employeeName: emp?.name }))}
          label="الموظف *"
          placeholder="ابحث عن الموظف..."
        />

        {/* نوع الإجازة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">نوع الإجازة *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.type}
            onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
          >
            {leaveTypes.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
            {leaveTypes.length === 0 && <option value="سنوية">سنوية</option>}
          </select>
        </div>

        {/* تاريخ البداية */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البداية *</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.fromDate}
            onChange={(e) => setForm(p => ({ ...p, fromDate: toISO(e.target.value) }))}
          />
        </div>

        {/* تاريخ النهاية */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ النهاية *</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.toDate}
            onChange={(e) => setForm(p => ({ ...p, toDate: toISO(e.target.value) }))}
          />
        </div>

        {/* عدد الأيام */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأيام</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.days}
            readOnly
            placeholder="يُحتسب تلقائياً"
          />
          <p className="text-xs text-gray-500 mt-1">يتم حساب عدد الأيام تلقائياً بناءً على التواريخ</p>
        </div>

        {/* الحالة */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الحالة *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.status}
            onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
          >
            {leaveStatuses.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
            {leaveStatuses.length === 0 && <option value="في الانتظار">في الانتظار</option>}
          </select>
        </div>

        {/* السبب */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">سبب الإجازة (اختياري)</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="اذكر سبب طلب الإجازة..."
            value={form.reason}
            onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button disabled={saving} onClick={handleSave}>
          {saving ? 'جارٍ الحفظ…' : 'حفظ'}
        </Button>
      </div>
    </Drawer>
  ) : null
}
