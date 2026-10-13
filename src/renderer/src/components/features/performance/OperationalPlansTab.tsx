import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, FileText, CheckCircle } from 'lucide-react'
import { Button } from '../../ui/Button'
import CreateEntityModal from '../../form/CreateEntityModal'
import { operationalPlanSchema } from '../../../schemas/operational-plan'
import { toast } from 'sonner'

export function OperationalPlansTab() {
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any | null>(null)

    const fetchPlans = async () => {
        setLoading(true)
        try {
            const data = await window.api.invoke('operational-plans:getAll')
            setPlans(data || [])
        } catch (error) {
            console.error('Failed to fetch plans:', error)
            toast.error('فشل تحميل الخطط التشغيلية')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPlans()
    }, [])

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخطة؟ سيتم حذف جميع المؤشرات المرتبطة بها.')) return
        try {
            await window.api.invoke('operational-plans:delete', id)
            toast.success('تم الحذف بنجاح')
            fetchPlans()
        } catch (error) {
            toast.error('فشل عملية الحذف')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'completed': return 'bg-blue-100 text-blue-800'
            case 'draft': return 'bg-gray-100 text-gray-800'
            case 'archived': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        const map: Record<string, string> = {
            'active': 'نشط',
            'completed': 'مكتمل',
            'draft': 'مسودة',
            'archived': 'مؤرشف'
        }
        return map[status] || status
    }

    const fields = [
        { type: 'text' as const, name: 'title', label: 'عنوان الخطة', required: true, placeholder: 'مثال: الخطة السنوية 2025' },
        { type: 'textarea' as const, name: 'description', label: 'الوصف', placeholder: 'وصف مختصر للخطة...' },
        { type: 'number' as const, name: 'year', label: 'السنة', required: true, placeholder: '2025' },
        {
            type: 'select' as const,
            name: 'quarter',
            label: 'الربع السنوي',
            options: [
                { label: 'الربع الأول (Q1)', value: 'Q1' },
                { label: 'الربع الثاني (Q2)', value: 'Q2' },
                { label: 'الربع الثالث (Q3)', value: 'Q3' },
                { label: 'الربع الرابع (Q4)', value: 'Q4' },
                { label: 'سنتوي (كامل)', value: 'Yearly' },
            ]
        },
        { type: 'text' as const, name: 'department', label: 'القسم المعني', placeholder: 'مثال: الموارد البشرية' },
        { type: 'textarea' as const, name: 'objectives', label: 'الأهداف الاستراتيجية', rows: 3 },
        {
            type: 'select' as const,
            name: 'status',
            label: 'الحالة',
            required: true,
            options: [
                { label: 'مسودة', value: 'draft' },
                { label: 'نشط', value: 'active' },
                { label: 'مكتمل', value: 'completed' },
                { label: 'مؤرشف', value: 'archived' }
            ]
        },
    ]

    if (loading && plans.length === 0) return <div className="text-center py-10">جاري التحميل...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">الخطط التشغيلية</h3>
                <Button onClick={() => { setEditingPlan(null); setShowCreateModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    خطة جديدة
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {plans.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">لا توجد خطط تشغيلية</h3>
                        <p className="text-gray-500 mt-1">قم بإضافة خطة جديدة للبدء</p>
                    </div>
                ) : (
                    plans.map(plan => (
                        <div key={plan.id} className="bg-white p-5 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-lg font-bold text-gray-900">{plan.title}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                                            {getStatusText(plan.status)}
                                        </span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {plan.year} - {plan.quarter}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{plan.description || 'لا يوجد وصف'}</p>

                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            <span>{plan.department || 'عام'}</span>
                                        </div>
                                        {plan.objectives && (
                                            <div className="flex items-center gap-1" title="الأهداف">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="truncate max-w-[200px]">{plan.objectives}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 mr-4">
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingPlan(plan); setShowCreateModal(true); }}>
                                        <Edit className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}>
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CreateEntityModal
                open={showCreateModal}
                onClose={() => { setShowCreateModal(false); setEditingPlan(null); }}
                title={editingPlan ? 'تعديل الخطة' : 'إضافة خطة تشغيلية'}
                entity="operational-plans"
                schema={operationalPlanSchema}
                fields={fields}
                defaults={editingPlan || { year: new Date().getFullYear(), status: 'draft' }}
                recordId={editingPlan?.id}
                onSuccess={fetchPlans}
            />
        </div>
    )
}
