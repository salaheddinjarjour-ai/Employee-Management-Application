import { z } from 'zod'

export const operationalPlanSchema = z.object({
    title: z.string().min(1, 'العنوان مطلوب'),
    description: z.string().optional(),
    year: z.coerce.number().min(2000).max(2100).default(new Date().getFullYear()),
    quarter: z.string().optional(),
    department: z.string().optional(),
    objectives: z.string().optional(),
    kpis: z.string().optional(), // Summary text
    status: z.enum(['draft', 'active', 'completed', 'archived']).default('draft'),
    created_by: z.string().optional(),
})

export type OperationalPlan = z.infer<typeof operationalPlanSchema> & { id: number, created_at: string }

export const kpiSchema = z.object({
    operational_plan_id: z.coerce.number().min(1, 'الخطة التشغيلية مطلوبة'),
    employee_id: z.coerce.number().optional().nullable(),
    indicator_name: z.string().min(1, 'اسم المؤشر مطلوب'),
    target_value: z.coerce.number().default(0),
    actual_value: z.coerce.number().default(0),
    unit: z.string().optional(),
    weight: z.coerce.number().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
})

export type KPI = z.infer<typeof kpiSchema> & { id: number, employee_name?: string, plan_title?: string }
