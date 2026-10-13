
import express from 'express';
import repos from '../db/repositories';
import { employeePivotRepo, PivotRole } from '../db/repositories/employeePivotRepo';

const router = express.Router();

// Helper to handle async errors
const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// List records
router.get('/:entity', asyncHandler(async (req: any, res: any) => {
    const { entity } = req.params;
    const filters = req.query;

    console.log('[API] records:list', entity, filters);

    let result: any[] = [];

    switch (entity) {
        case 'employees': result = await repos.employees.findAll(filters); break;
        case 'courses': result = await repos.courses.findAll(filters); break;
        case 'evaluations': result = await repos.evaluations.listAll(); break;
        case 'promotions': result = await repos.promotions.list(filters); break;
        case 'rewards': result = await repos.rewards.list(filters); break;
        case 'leaves': result = await repos.leaves.list(); break;
        case 'absences': result = await repos.absences.findAll(filters); break;
        case 'departments': result = await repos.departments.findAll(filters); break;
        case 'units': result = await repos.units.findAll(filters); break;
        case 'committees': result = await repos.committees.findAll(filters); break;
        case 'sections': result = await repos.sections.findAll(filters); break;
        case 'locations': result = await repos.locations.findAll(filters); break;
        case 'holidays': result = await repos.holidays.findAll(filters); break;
        case 'loans': result = await repos.loans.findAll(filters); break;
        case 'overtime': result = await repos.overtime.findAll(filters); break;
        case 'penalties': result = await repos.penalties.findAll(filters); break;
        case 'users': result = await repos.users.findAll(filters); break;
        case 'exchange_rates': result = await repos.exchangeRates.findAll(filters); break;
        case 'attachments': result = await repos.attachments.findAll(filters); break;
        case 'service_years': result = await repos.serviceYears.findAll(filters); break;
        default:
            return res.status(400).json({ error: `Unknown entity: ${entity}` });
    }

    res.json(result);
}));

// Get entity stats
router.get('/:entity/stats', asyncHandler(async (req: any, res: any) => {
    const { entity } = req.params;
    console.log('[API] records:stats', entity);

    if (entity === 'leaves') {
        const stats = await repos.leaves.stats();
        return res.json(stats);
    }

    if (entity === 'evaluations') {
        const stats = await repos.evaluations.stats();
        return res.json(stats);
    }

    if (entity === 'promotions') {
        const stats = await repos.promotions.stats();
        return res.json(stats);
    }

    if (entity === 'rewards') {
        const stats = await repos.rewards.stats ? await repos.rewards.stats() : { totals: {}, dist: [] };
        return res.json(stats);
    }

    return res.status(400).json({ error: `Stats not implemented for entity: ${entity}` });
}));

// Get record by ID
router.get('/:entity/:id', asyncHandler(async (req: any, res: any) => {
    const { entity, id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid ID' });

    console.log('[API] records:get', entity, numericId);

    let result: any;

    switch (entity) {
        case 'employees': result = await repos.employees.findById(numericId); break;
        case 'courses': result = await repos.courses.findById(numericId); break;
        case 'evaluations': result = await repos.evaluations.findById(numericId); break;
        case 'promotions': result = await repos.promotions.findById(numericId); break;
        case 'rewards': result = await repos.rewards.findById(numericId); break;
        case 'leaves': result = await repos.leaves.findById(numericId); break;
        case 'absences': result = await repos.absences.findById(numericId); break;
        case 'departments': result = await repos.departments.findById(numericId); break;
        case 'units': result = await repos.units.findById(numericId); break;
        case 'committees': result = await repos.committees.findById(numericId); break;
        case 'sections': result = await repos.sections.findById(numericId); break;
        case 'locations': result = await repos.locations.findById(numericId); break;
        case 'holidays': result = await repos.holidays.findById(numericId); break;
        case 'loans': result = await repos.loans.findById(numericId); break;
        case 'overtime': result = await repos.overtime.findById(numericId); break;
        case 'penalties': result = await repos.penalties.findById(numericId); break;
        case 'users': result = await repos.users.findById(numericId); break;
        case 'exchange_rates': result = await repos.exchangeRates.findById(numericId); break;
        case 'attachments': result = await repos.attachments.findById(numericId); break;
        default:
            return res.status(400).json({ error: `Unknown entity: ${entity}` });
    }

    if (!result) return res.status(404).json({ error: 'Not found' });

    // Ensure any standard array properties are strictly arrays, not nulls
    if (result.roles === null) result.roles = [];
    if (result.attachments === null) result.attachments = [];

    res.json(result);
}));

// Create record
router.post('/:entity', asyncHandler(async (req: any, res: any) => {
    const { entity } = req.params;
    const payload = req.body;

    console.log('[API] records:create', entity);

    let id: number | string = 0;

    switch (entity) {
        case 'employees': {
            const errors: { field: string, message: string }[] = [];
            if (!('job_title' in payload)) errors.push({ field: "job_title", message: "المسمى الوظيفي مطلوب في البيانات المرسلة" });
            if (!payload.department) errors.push({ field: "department", message: "القسم مطلوب في البيانات المرسلة" });
            if (!payload.employee_no) errors.push({ field: "employee_no", message: "رقم الموظف مطلوب" });

            if (payload.email) {
                const existingEmail = await repos.employees.findByEmail(payload.email.trim().toLowerCase());
                if (existingEmail) errors.push({ field: "email", message: "البريد الإلكتروني مستخدم مسبقاً" });
            }
            if (payload.employee_no) {
                const existingNo = await repos.employees.findByEmployeeNo(payload.employee_no.trim());
                if (existingNo) errors.push({ field: "employee_no", message: "رقم الموظف مستخدم مسبقاً" });
            }

            if (errors.length > 0) return res.status(400).json({ errors });

            const { query } = await import('../db/connection');

            try {
                await query('BEGIN TRANSACTION');
                id = await repos.employees.create(payload);
                if (payload.roles && Array.isArray(payload.roles)) {
                    await employeePivotRepo.syncDepartments(id as number, payload.roles.filter((r: any) => r.role_type === 'department' && r.entity_id != null));
                    await employeePivotRepo.syncUnits(id as number, payload.roles.filter((r: any) => r.role_type === 'unit' && r.entity_id != null));
                    await employeePivotRepo.syncCommittees(id as number, payload.roles.filter((r: any) => r.role_type === 'committee' && r.entity_id != null));
                }
                await query('COMMIT');
            } catch (err: any) {
                try { await query('ROLLBACK'); } catch (e) { }
                console.error('[API] Transaction mapped to 400:', err);
                return res.status(400).json({ errors: [{ field: "system", message: "حدث خطأ أثناء حفظ البيانات. يرجى مراجعة المدخلات" }] });
            }
            break;
        }
        case 'courses': id = await repos.courses.create(payload); break;
        case 'evaluations':
            const e = await repos.evaluations.create(payload) as any; id = e?.id; break;
        case 'promotions':
            const p = await repos.promotions.create(payload) as any; id = p?.id; break;
        case 'rewards':
            const r = await repos.rewards.create(payload) as any; id = r?.id; break;
        case 'leaves':
            const l = await repos.leaves.create(payload) as any; id = l?.id; break;
        case 'absences': id = await repos.absences.create(payload); break;
        case 'departments': id = await repos.departments.create(payload); break;
        case 'units': id = await repos.units.create(payload); break;
        case 'committees': id = await repos.committees.create(payload); break;
        case 'sections': id = await repos.sections.create(payload); break;
        case 'locations': id = await repos.locations.create(payload); break;
        case 'holidays': id = await repos.holidays.create(payload); break;
        case 'loans': id = await repos.loans.create(payload); break;
        case 'overtime': id = await repos.overtime.create(payload); break;
        case 'penalties': id = await repos.penalties.create(payload); break;
        case 'users': id = await repos.users.create(payload); break;
        case 'exchange_rates':
            const er = await repos.exchangeRates.create(payload); id = er.id; break;
        case 'attachments':
            const att = await repos.attachments.create(payload); id = att.id; break;
        default:
            return res.status(400).json({ error: `Unknown entity: ${entity}` });
    }

    res.json({ id });
}));

// Update record
router.put('/:entity/:id', asyncHandler(async (req: any, res: any) => {
    const { entity, id } = req.params;
    const numericId = parseInt(id, 10);
    const payload = req.body;

    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid ID' });

    console.log('[API] records:update', entity, numericId);

    let changes = 0;

    switch (entity) {
        case 'employees': {
            const errors: { field: string, message: string }[] = [];
            if (!('job_title' in payload)) errors.push({ field: "job_title", message: "المسمى الوظيفي مطلوب في البيانات المرسلة" });
            if (!payload.department) errors.push({ field: "department", message: "القسم مطلوب في البيانات المرسلة" });
            if (!payload.employee_no) errors.push({ field: "employee_no", message: "رقم الموظف مطلوب" });

            if (payload.email) {
                const existingEmail = await repos.employees.findByEmail(payload.email.trim().toLowerCase());
                if (existingEmail && existingEmail.id !== numericId) errors.push({ field: "email", message: "البريد الإلكتروني مستخدم مسبقاً" });
            }
            if (payload.employee_no) {
                const existingNo = await repos.employees.findByEmployeeNo(payload.employee_no.trim());
                if (existingNo && existingNo.id !== numericId) errors.push({ field: "employee_no", message: "رقم الموظف مستخدم مسبقاً" });
            }

            if (errors.length > 0) return res.status(400).json({ errors });

            const { query } = await import('../db/connection');

            try {
                await query('BEGIN TRANSACTION');
                if (await repos.employees.update(numericId, payload)) {
                    changes = 1;
                    if (payload.roles && Array.isArray(payload.roles)) {
                        await employeePivotRepo.syncDepartments(numericId, payload.roles.filter((r: any) => r.role_type === 'department' && r.entity_id != null));
                        await employeePivotRepo.syncUnits(numericId, payload.roles.filter((r: any) => r.role_type === 'unit' && r.entity_id != null));
                        await employeePivotRepo.syncCommittees(numericId, payload.roles.filter((r: any) => r.role_type === 'committee' && r.entity_id != null));
                    }
                }
                await query('COMMIT');
            } catch (err: any) {
                try { await query('ROLLBACK'); } catch (e) { }
                console.error('[API] Transaction mapped to 400:', err);
                return res.status(400).json({ errors: [{ field: "system", message: "حدث خطأ أثناء حفظ البيانات. يرجى مراجعة المدخلات" }] });
            }
            break;
        }
        case 'courses': changes = await repos.courses.update(numericId, payload); break;
        case 'evaluations': if (await repos.evaluations.update(numericId, payload)) changes = 1; break;
        case 'promotions': if (await repos.promotions.update(numericId, payload)) changes = 1; break;
        case 'rewards': if (await repos.rewards.update(numericId, payload)) changes = 1; break;
        case 'leaves': if (await repos.leaves.update(numericId, payload)) changes = 1; break;
        case 'absences': changes = await repos.absences.update(numericId, payload); break;
        case 'departments': changes = await repos.departments.update(numericId, payload); break;
        case 'units': changes = await repos.units.update(numericId, payload); break;
        case 'committees': changes = await repos.committees.update(numericId, payload); break;
        case 'sections': changes = await repos.sections.update(numericId, payload); break;
        case 'locations': changes = await repos.locations.update(numericId, payload); break;
        case 'holidays': changes = await repos.holidays.update(numericId, payload); break;
        case 'loans': changes = await repos.loans.update(numericId, payload); break;
        case 'overtime': changes = await repos.overtime.update(numericId, payload); break;
        case 'penalties': changes = await repos.penalties.update(numericId, payload); break;
        case 'users': changes = await repos.users.update(numericId, payload); break;
        case 'exchange_rates': if (await repos.exchangeRates.update({ ...payload, id: numericId })) changes = 1; break;
        default:
            return res.status(400).json({ error: `Update not implemented for entity: ${entity}` });
    }

    res.json({ changes });
}));

// Delete record
router.delete('/:entity/:id', asyncHandler(async (req: any, res: any) => {
    const { entity, id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid ID' });

    console.log('[API] records:delete', entity, numericId);

    let changes: any = 0;

    switch (entity) {
        case 'employees': changes = await repos.employees.remove(numericId); break;
        case 'courses': changes = await repos.courses.remove(numericId); break;
        case 'evaluations': changes = await repos.evaluations.remove(numericId); break;
        case 'promotions': changes = await repos.promotions.remove(numericId); break;
        case 'rewards':
            const r = await repos.rewards.remove(numericId); changes = (r as any).changes ?? r; break;
        case 'leaves':
            const l = await repos.leaves.remove(numericId); changes = (l as any).changes ?? l; break;
        case 'absences': changes = await repos.absences.remove(numericId); break;
        case 'departments': changes = await repos.departments.remove(numericId); break;
        case 'units': changes = await repos.units.remove(numericId); break;
        case 'committees': changes = await repos.committees.remove(numericId); break;
        case 'sections': changes = await repos.sections.remove(numericId); break;
        case 'locations': changes = await repos.locations.remove(numericId); break;
        case 'holidays': changes = await repos.holidays.remove(numericId); break;
        case 'loans': changes = await repos.loans.remove(numericId); break;
        case 'overtime': changes = await repos.overtime.remove(numericId); break;
        case 'users': changes = await repos.users.remove(numericId); break;
        case 'exchange_rates': changes = await repos.exchangeRates.remove(numericId); break;
        case 'attachments': changes = await repos.attachments.remove(numericId); break;
        default:
            return res.status(400).json({ error: `Unknown entity: ${entity}` });
    }

    res.json({ changes });
}));

export default router;
