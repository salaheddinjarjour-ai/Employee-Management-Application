import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Target } from 'lucide-react'
import { Button } from '../../ui/Button'
import CreateEntityModal from '../../form/CreateEntityModal'
import { kpiSchema } from '../../../schemas/operational-plan'
import { toast } from 'sonner'

export function KPIsTab() {
    const [kpis, setKpis] = useState<any[]>([])
    const [plans, setPlans] = useState<any[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingKPI, setEditingKPI] = useState<any | null>(null)
    const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('')

    const loadData = async () => {
        try {
            const [plansData, kpisData] = await Promise.all([
                window.api.invoke('operational-plans:getAll'),
                window.api.invoke('performance-indicators:getAll', selectedPlanId || undefined)
            ])
            setPlans(plansData || [])
            setKpis(kpisData || [])
        } catch (error) {
            console.error('Failed to load data:', error)
            toast.error('فشل تحميل البيانات')
        } finally {

        }
    }

    useEffect(() => {
        loadData()
    }, [selectedPlanId])

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المؤشر؟')) return
        try {
            await window.api.invoke('performance-indicators:delete', id)
            toast.success('تم الحذف بنجاح')
            loadData()
        } catch (error) {
            toast.error('فشل عملية الحذف')
        }
    }

    const getProgressColor = (actual: number, target: number) => {
        if (!target) return 'bg-gray-200'
        const percentage = (actual / target) * 100
        if (percentage >= 100) return 'bg-green-500'
        if (percentage >= 70) return 'bg-blue-500'
        if (percentage >= 40) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const fields = [
        {
            type: 'select' as const,
            name: 'operational_plan_id',
            label: 'الخطة التشغيلية',
            required: true,
            options: plans.map(p => ({ label: p.title, value: p.id }))
        },
        { type: 'text' as const, name: 'indicator_name', label: 'اسم المؤشر', required: true },
        { type: 'employee-search' as const, name: 'employee_id', label: 'المسؤول الرئييسي (اختياري)' },
        { type: 'number' as const, name: 'target_value', label: 'المستهدف', required: true },
        { type: 'number' as const, name: 'actual_value', label: 'الفعلي', required: true },
        { type: 'text' as const, name: 'unit', label: 'وحدة القياس', placeholder: 'مثال: %، عدد، عملة' },
        { type: 'number' as const, name: 'weight', label: 'الوزن النسبي (%)', placeholder: 'مثال: 20' },
        {
            type: 'select' as const,
            name: 'status',
            label: 'الحالة',
            options: [
                { label: 'لم يبدأ', value: 'not_started' },
                { label: 'جاري العمل', value: 'in_progress' },
                { label: 'مكتمل', value: 'completed' },
                { label: 'متأخر', value: 'delayed' }
            ]
        },
        { type: 'textarea' as const, name: 'notes', label: 'ملاحظات', rows: 2 },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">مؤشرات الأداء (KPIs)</h3>
                    <select
                        className="mr-4 px-3 py-1 text-sm border rounded-md"
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value ? Number(e.target.value) : '')}
                    >
                        <option value="">كل الخطط</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>
                <Button onClick={() => { setEditingKPI(null); setShowCreateModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    مؤشر جديد
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">المؤشر</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الخطة</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">المستهدف / الفعلي</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">نسبة الإنجاز</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {kpis.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        <Target className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        لا توجد مؤشرات أداء
                                    </td>
                                </tr>
                            ) : (
                                kpis.map(kpi => {
                                    const percent = kpi.target_value ? Math.round((kpi.actual_value / kpi.target_value) * 100) : 0
                                    const plan = plans.find(p => p.id === kpi.operational_plan_id)

                                    return (
                                        <tr key={kpi.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{kpi.indicator_name}</div>
                                                {kpi.notes && <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{kpi.notes}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {plan?.title || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="font-medium">{kpi.target_value}</span>
                                                    <span className="text-gray-400">/</span>
                                                    <span className="font-bold text-gray-900">{kpi.actual_value}</span>
                                                    <span className="text-xs text-gray-500">{kpi.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${getProgressColor(kpi.actual_value, kpi.target_value)}`}
                                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold">{percent}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                                    {kpi.status || 'غير محدد'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => { setEditingKPI(kpi); setShowCreateModal(true); }}>
                                                        <Edit className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(kpi.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateEntityModal
                open={showCreateModal}
                onClose={() => { setShowCreateModal(false); setEditingKPI(null); }}
                title={editingKPI ? 'تعديل مؤشر' : 'إضافة مؤشر أداء'}
                entity="performance-indicators"
                schema={kpiSchema}
                fields={fields}
                defaults={editingKPI || { operational_plan_id: selectedPlanId || undefined }}
                recordId={editingKPI?.id}
                onSuccess={loadData}
            />
        </div>
    )
}
