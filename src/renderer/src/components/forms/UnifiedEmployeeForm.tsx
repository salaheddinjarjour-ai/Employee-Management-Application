import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../ui/Button'
import { EmployeeAttachmentsList } from '../attachments/EmployeeAttachmentsList'
import { toast } from 'sonner'
import { X, Save } from 'lucide-react'

const roleSchema = z.object({
  role_type: z.enum(['department', 'unit', 'committee']),
  // Accept string or number. If string, it is the new branch name.
  entity_id: z.union([z.string().min(1, 'مطلوب'), z.number().min(1, 'مطلوب')]),
  job_title: z.string().optional(),
  is_primary: z.boolean().default(false)
})

const employeeSchema = z.object({
  employee_no: z.string().min(1, 'رقم الموظف مطلوب'),
  full_name: z.string().min(1, 'الاسم الكامل مطلوب'),
  phone: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  education_degree: z.string().optional(),
  hire_date: z.string().min(1, 'تاريخ التوظيف مطلوب'),
  category: z.string().optional(),
  grade: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'leave']).default('active'),
  roles: z.array(roleSchema).default([]).refine(
    (roles) => roles.some(r => r.role_type === 'department'),
    { message: 'القسم مطلوب (يجب إضافة قسم واحد على الأقل)' }
  )
})

type EmployeeFormData = z.infer<typeof employeeSchema>

interface UnifiedEmployeeFormProps {
  initialData?: any
  onSuccess: () => void
  onCancel: () => void
}

export function UnifiedEmployeeForm({ initialData, onSuccess, onCancel }: UnifiedEmployeeFormProps) {
  const isEdit = !!initialData?.id

  const [departments, setDepartments] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [committees, setCommittees] = useState<any[]>([])

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: {
      status: 'active',
      roles: [],
      ...initialData
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "roles"
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const depts = await window.api.listRecords('departments')
        const uns = await window.api.listRecords('units')
        const coms = await window.api.listRecords('committees')
        setDepartments(depts)
        setUnits(uns)
        setCommittees(coms)
      } catch (err) {
        console.error('Failed to fetch entities for multi-role', err)
      }
    }
    fetchEntities()
  }, [])

  const onSubmit = async (data: any) => {
    try {
      // Pre-process roles to handle new entity creations
      // Build a local snapshot of entity maps (merges fetched + newly created)
      const localDepts = [...departments]
      const localUnits = [...units]
      const localComms = [...committees]

      const processedRoles = []
      for (const role of data.roles || []) {
        let finalEntityId = role.entity_id;
        let entityName: string | null = null;

        // If entity_id is a string, it might be a new entity name typed by the user
        if (typeof finalEntityId === 'string') {
          const originalName = finalEntityId;
          const options = role.role_type === 'department' ? localDepts :
            role.role_type === 'unit' ? localUnits : localComms;
          const mapTo = role.role_type === 'department' ? 'departments' :
            role.role_type === 'unit' ? 'units' : 'committees';

          const existing = options.find(o => String(o?.name ?? "").toLowerCase() === String(originalName ?? "").toLowerCase());

          if (existing) {
            finalEntityId = existing.id;
            entityName = existing.name;
          } else {
            const newEntity = await window.api.createRecord(mapTo, { name: originalName });
            finalEntityId = newEntity.id;
            entityName = originalName;

            // Update both local snapshot and React state
            const createdOpt = { id: newEntity.id, name: originalName };
            if (role.role_type === 'department') { localDepts.push(createdOpt); setDepartments(prev => [...prev, createdOpt]) }
            if (role.role_type === 'unit') { localUnits.push(createdOpt); setUnits(prev => [...prev, createdOpt]) }
            if (role.role_type === 'committee') { localComms.push(createdOpt); setCommittees(prev => [...prev, createdOpt]) }
          }
        } else {
          // Numeric id — look up name from local snapshot
          const options = role.role_type === 'department' ? localDepts :
            role.role_type === 'unit' ? localUnits : localComms;
          entityName = options.find(o => o.id === Number(finalEntityId))?.name || null;
        }

        processedRoles.push({
          ...role,
          entity_id: Number(finalEntityId),
          entity_name: entityName
        })
      }

      // Extract primary job_title and department from roles to satisfy backend requirements
      const primaryRole = processedRoles.find(r => r.is_primary) || processedRoles[0];
      const job_title = primaryRole?.job_title || primaryRole?.entity_name || null;
      const department = primaryRole?.entity_name || null;

      // Normalize email for unique validation
      const email = data.email?.trim().toLowerCase() || null

      const payload = { ...data, roles: processedRoles, job_title, department, email }

      if (isEdit) {
        await window.api.updateRecord('employees', initialData.id, payload)
        toast.success('تم تحديث بيانات الموظف بنجاح')
      } else {
        await window.api.createRecord('employees', payload)
        toast.success('تم إضافة الموظف بنجاح')
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save employee:', error)
      try {
        // Attempt to parse JSON error from IPC (Error: {"errors": [{"field":"email"...}]}) or Axios (error.response?.data)
        const errMsg = error.message ? error.message.replace(/^Error:\s*Error:\s*/, '').replace(/^Error:\s*/, '').replace(/^.*?Error:\s*/, '') : '';
        const errorData = error.response?.data || JSON.parse(errMsg);

        if (errorData?.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err: { field: string, message: string }) => {
            setError(err.field as any, { type: 'server', message: err.message });
          });
          toast.error("يرجى مراجعة وتصحيح الأخطاء في النموذج");
          return;
        } else if (errorData?.field && errorData?.message) {
          setError(errorData.field as any, { type: 'server', message: errorData.message });
          toast.error(errorData.message);
          return;
        }
      } catch (parseError) {
        // Not a JSON error or unable to parse, fallback to normal toast
      }
      toast.error(error.message || 'فشل حفظ البيانات')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">
          {isEdit ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
        </h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Basic Info */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">المعلومات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">رقم الموظف <span className="text-red-500">*</span></label>
                <input
                  {...register('employee_no')}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 101"
                />
                {errors.employee_no && <p className="text-red-500 text-sm">{errors.employee_no.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">اسم الموظف <span className="text-red-500">*</span></label>
                <input
                  {...register('full_name')}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="الاسم الكامل"
                />
                {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">رقم الهاتف</label>
                <input
                  {...register('phone')}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">البريد الإلكتروني</label>
                <input
                  {...register('email')}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>
            </div>
          </section>

          {/* Section 2: Job Info */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">معلومات الوظيفة</h3>
            <div className="space-y-6">
              {/* Row 1: Roles Builder */}
              <div className="col-span-full space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">الأدوار (الأقسام، الوحدات، اللجان) <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ role_type: 'department', entity_id: null as any, job_title: '', is_primary: fields.length === 0 })}>+ قسم</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ role_type: 'unit', entity_id: null as any, job_title: '', is_primary: fields.length === 0 })}>+ وحدة</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ role_type: 'committee', entity_id: null as any, job_title: '', is_primary: fields.length === 0 })}>+ لجنة</Button>
                  </div>
                </div>
                {errors.roles && <p className="text-red-500 text-sm">تأكد من إدخال الأدوار بشكل صحيح</p>}
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const typeLabel = field.role_type === 'department' ? 'قسم' : field.role_type === 'unit' ? 'وحدة' : 'لجنة';
                    const options = field.role_type === 'department' ? departments : field.role_type === 'unit' ? units : committees;
                    return (
                      <div key={field.id} className="flex items-end gap-3 p-3 border rounded-md bg-gray-50 flex-wrap md:flex-nowrap">
                        <div className="w-full md:w-20 shrink-0">
                          <label className="text-xs text-gray-500 block mb-1">النوع</label>
                          <div className="font-semibold text-sm">{typeLabel}</div>
                        </div>
                        <div className="w-full md:flex-1">
                          <label className="text-xs text-gray-500 block mb-1">الاسم <span className="text-red-500">*</span></label>
                          <input
                            list={`list-${field.role_type}`}
                            {...register(`roles.${index}.entity_id` as const)}
                            className="w-full p-2 border rounded-md text-sm"
                            placeholder="اختر أو اكتب جديد..."
                            autoComplete="off"
                          />
                          <datalist id={`list-${field.role_type}`}>
                            {options.map(opt => <option key={opt.id} value={opt.name} />)}
                          </datalist>
                        </div>
                        <div className="w-full md:flex-1">
                          <label className="text-xs text-gray-500 block mb-1">المسمى الوظيفي (اختياري)</label>
                          <input {...register(`roles.${index}.job_title` as const)} className="w-full p-2 border rounded-md text-sm" placeholder="مثال: مدير..." />
                        </div>
                        <div className="flex items-center gap-2 mb-2 shrink-0 w-24">
                          <input type="checkbox" {...register(`roles.${index}.is_primary` as const)} id={`primary-${index}`} className="w-4 h-4 cursor-pointer" />
                          <label htmlFor={`primary-${index}`} className="text-xs text-gray-700 cursor-pointer">رئيسي؟</label>
                        </div>
                        <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-md mb-1 shrink-0"><X className="w-4 h-4" /></button>
                      </div>
                    )
                  })}
                  {fields.length === 0 && (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 border border-dashed rounded-md">
                      لم يتم إضافة أي أدوار. يرجى إضافة دور واحد على الأقل.
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <label className="text-sm font-medium">المؤهل العلمي</label>
                  <input
                    {...register('education_degree')}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="مثال: بكالوريوس إدارة أعمال"
                  />
                </div>
              </div>

              {/* Row 3: Other fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ التوظيف <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    {...register('hire_date')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.hire_date && <p className="text-red-500 text-sm">{errors.hire_date.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">الفئة</label>
                  <input
                    {...register('category')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: إداري"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">الدرجة</label>
                  <input
                    {...register('grade')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: 5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">الحالة</label>
                  <select
                    {...register('status')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير فعّال</option>
                    <option value="leave">إجازة</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات</label>
                <textarea
                  {...register('notes')}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="ملاحظات إضافية عن الموظف..."
                  rows={3}
                ></textarea>
              </div>
            </div>
          </section>
        </form>

        {/* Section 3: Attachments (Only for Edit) */}
        {isEdit && (
          <section className="mt-8 pt-6 border-t">
            <EmployeeAttachmentsList employeeId={initialData.id} />
          </section>
        )}
        {!isEdit && (
          <div className="mt-8 pt-6 border-t text-gray-500 text-sm text-center">
            يمكنك إضافة المرفقات بعد حفظ الموظف.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
        <Button variant="outline" onClick={onCancel} type="button">
          إلغاء
        </Button>
        <Button type="submit" form="employee-form" disabled={isSubmitting}>
          <Save className="w-4 h-4 ml-2" />
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </div>
    </div >
  )
}
