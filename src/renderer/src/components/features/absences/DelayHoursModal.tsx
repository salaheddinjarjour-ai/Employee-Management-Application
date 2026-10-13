import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { EmployeeSearchSelect } from '../../forms/EmployeeSearchSelect'

interface DelayHoursModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export function DelayHoursModal({ open, onClose, onSuccess }: DelayHoursModalProps) {
    const [formData, setFormData] = useState({
        employee_id: '',
        employee_name: '',
        date: new Date().toISOString().split('T')[0],
        delay_hours: 0,
        delay_minutes: 0,
        reason: '',
        notes: ''
    })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.employee_id) {
            toast.error('يرجى اختيار الموظف')
            return
        }

        try {
            setSaving(true)
            await window.api.invoke('delays:create', {
                ...formData,
                employee_id: Number(formData.employee_id)
            })
            toast.success('تم إضافة ساعات التأخير بنجاح')
            onSuccess()
            onClose()

            // Reset form
            setFormData({
                employee_id: '',
                employee_name: '',
                date: new Date().toISOString().split('T')[0],
                delay_hours: 0,
                delay_minutes: 0,
                reason: '',
                notes: ''
            })
        } catch (error: any) {
            console.error('Failed to create delay:', error)
            toast.error('فشل في إضافة ساعات التأخير')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle>إضافة ساعات تأخير</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Employee selector */}
                    <div>
                        <Label>الموظف</Label>
                        <EmployeeSearchSelect
                            selectedId={formData.employee_id ? Number(formData.employee_id) : undefined}
                            onSelect={(emp: any) => {
                                setFormData(prev => ({
                                    ...prev,
                                    employee_id: emp.id,
                                    employee_name: emp.full_name || emp.name
                                }))
                            }}
                            label=""
                            placeholder="اختر الموظف..."
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <Label>التاريخ</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Delay hours and minutes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>ساعات التأخير</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.delay_hours}
                                onChange={(e) => setFormData(prev => ({ ...prev, delay_hours: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <Label>دقائق التأخير</Label>
                            <Input
                                type="number"
                                min="0"
                                max="59"
                                value={formData.delay_minutes}
                                onChange={(e) => setFormData(prev => ({ ...prev, delay_minutes: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <Label>السبب</Label>
                        <Input
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="سبب التأخير..."
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <Label>ملاحظات</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="ملاحظات إضافية..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
