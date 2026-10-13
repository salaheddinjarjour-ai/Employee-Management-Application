
import express from 'express';
import repos from '../db/repositories';
import { computeTotals } from '../payroll/calc';
import { normalizePeriod } from '../utils/period';
import { queryOne } from '../db/connection';

const router = express.Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// List payrolls by period
router.get('/', asyncHandler(async (req: any, res: any) => {
    const { period } = req.query;
    if (!period) return res.status(400).json({ error: 'Period is required' });

    const normalizedPeriod = normalizePeriod(String(period));
    console.log('[API] payroll:listByPeriod', normalizedPeriod);

    const result = await repos.payroll.listByPeriod(normalizedPeriod);
    res.json(result);
}));

// Save payroll (header + lines)
router.post('/', asyncHandler(async (req: any, res: any) => {
    const { header, lines, salaryModel, experienceRateTRY } = req.body;

    console.log('[API] payroll:save', header?.period);

    // Validate and convert header data
    header.employee_id = Number(header.employee_id);
    header.base_min = Number(header.base_min || 0);
    header.years_of_exp = Number(header.years_of_exp || 0);
    header.period = normalizePeriod(String(header.period).trim());

    // Validate employee_id exists
    const exists = await queryOne(`SELECT id FROM employees WHERE id = @id`, { id: header.employee_id });
    if (!exists) {
        return res.status(400).json({ error: `Invalid employee_id: ${header.employee_id}` });
    }

    // Add multi-currency fields from salaryModel if provided
    if (salaryModel) {
        header.base_min_currency = salaryModel.minBaseCurrency || 'TRY';
        header.experience_allowance_amount = Number(salaryModel.experienceAllowanceAmount || 0);
        header.experience_allowance_currency = salaryModel.experienceAllowanceCurrency || 'TRY';
    }

    const header_id = await repos.payroll.upsertHeader(header);

    // Replace lines
    await repos.payroll.replaceLines(header_id, lines.map((l: any, i: number) => ({
        category: l.category,
        label: l.label,
        currency: l.currency,
        amount: Number(l.amount || 0),
        sort_order: i
    })));

    // Compute totals for response
    const payrollData = await repos.payroll.getFull({ employee_id: header.employee_id, period: header.period });
    const totals = computeTotals(
        {
            base_min: payrollData!.header.base_min,
            years_of_exp: payrollData!.header.years_of_exp,
            base_min_currency: payrollData!.header.base_min_currency || 'TRY',
            experience_allowance_amount: payrollData!.header.experience_allowance_amount || 0,
            experience_allowance_currency: payrollData!.header.experience_allowance_currency || 'TRY'
        },
        payrollData!.lines as any[],
        Number(experienceRateTRY || 0)
    );

    res.json({ header_id, totals, period: header.period });
}));

// Get available periods
router.get('/available-months', asyncHandler(async (_req: any, res: any) => {
    console.log('[API] payroll:listPeriods');
    const periods = await repos.payroll.listPeriods();
    res.json(periods);
}));

// List payroll history by employee
router.get('/history/:employeeId', asyncHandler(async (req: any, res: any) => {
    const { employeeId } = req.params;
    const { period, limit } = req.query;

    console.log('[API] payroll:listByEmployee', employeeId);

    const result = await repos.payroll.listByEmployee({
        employeeId: Number(employeeId),
        period: period ? String(period) : undefined,
        limit: limit ? Number(limit) : undefined
    });
    res.json(result);
}));

// Get totals by employee
router.get('/totals/:employeeId', asyncHandler(async (req: any, res: any) => {
    const { employeeId } = req.params;
    const { period } = req.query;

    console.log('[API] payroll:totalsByEmployee', employeeId);

    const result = await repos.payroll.totalsByEmployee({
        employeeId: Number(employeeId),
        period: period ? String(period) : undefined
    });
    res.json(result);
}));

// Get month summary (Aggregated stats)
router.get('/summary/:month', asyncHandler(async (req: any, res: any) => {
    const { month } = req.params;
    console.log('[API] payroll:getMonthSummary', month);

    // Implement manual aggregation since repo doesn't have it explicitly yet
    // Or if I missed it, I can add it to repo later.
    // For now, let's fetch listByPeriod and aggregate.
    const payrolls = await repos.payroll.listByPeriod(month);

    let totalEmployees = payrolls.length;
    let totalNetUSD = 0;
    let totalNetTRY = 0;
    let totalDeductionsUSD = 0;
    let totalExceptionalUSD = 0; // assuming this means allowances/additions

    // logic to parse payrolls and sum up.
    // payrolls structure: { header, lines }

    for (const p of payrolls) {
        // We need to re-compute totals or trust header (db header doesn't store calculated net).
        // Best to use computeTotals logic or iterate lines.

        const lines = p.lines;
        // ... (Aggregation logic similar to exportExcel logic)
        // For brevity, I'll return basics or todo.
        // Actually, the frontend expects specific fields.

        // Simple aggregation loop:
        let pNetUSD = 0;
        let pNetTRY = 0;
        let pDedUSD = 0;
        let pExcUSD = 0;

        // Base Salary
        if (p.header.base_min_currency === 'USD') pNetUSD += Number(p.header.base_min || 0);
        else pNetTRY += Number(p.header.base_min || 0);

        // Experience
        const expAmt = (Number(p.header.experience_allowance_amount) || 0) * (Number(p.header.years_of_exp) || 0);
        if (p.header.experience_allowance_currency === 'USD') { pNetUSD += expAmt; pExcUSD += expAmt; }
        else pNetTRY += expAmt;

        for (const line of lines) {
            const amt = Number(line.amount || 0);
            if (line.currency === 'USD') {
                if (line.category === 'deduction') { pDedUSD += amt; pNetUSD -= amt; }
                else { pExcUSD += amt; pNetUSD += amt; } // allowance, exception, overtime
            } else {
                if (line.category === 'deduction') pNetTRY -= amt;
                else pNetTRY += amt;
            }
        }

        totalNetUSD += pNetUSD;
        totalNetTRY += pNetTRY;
        totalDeductionsUSD += pDedUSD;
        totalExceptionalUSD += pExcUSD;
    }

    res.json({
        totalEmployees,
        totalNetUSD,
        totalNetTRY,
        totalDeductionsUSD,
        totalExceptionalUSD
    });
}));

// Get payroll for specific employee and period
router.get('/:employee_id/:period', asyncHandler(async (req: any, res: any) => {
    const { employee_id, period } = req.params;
    const normalizedPeriod = normalizePeriod(period);

    console.log('[API] payroll:get', employee_id, normalizedPeriod);

    const result = await repos.payroll.getFull({ employee_id: Number(employee_id), period: normalizedPeriod });
    res.json(result);
}));

// Get month summary (Aggregated stats)
router.get('/summary/:month', asyncHandler(async (req: any, res: any) => {
    const { month } = req.params;
    console.log('[API] payroll:getMonthSummary', month);

    // Implement manual aggregation since repo doesn't have it explicitly yet
    // Or if I missed it, I can add it to repo later.
    // For now, let's fetch listByPeriod and aggregate.
    const payrolls = await repos.payroll.listByPeriod(month);

    let totalEmployees = payrolls.length;
    let totalNetUSD = 0;
    let totalNetTRY = 0;
    let totalDeductionsUSD = 0;
    let totalExceptionalUSD = 0; // assuming this means allowances/additions

    // logic to parse payrolls and sum up.
    // payrolls structure: { header, lines }

    for (const p of payrolls) {
        // We need to re-compute totals or trust header (db header doesn't store calculated net).
        // Best to use computeTotals logic or iterate lines.

        const lines = p.lines;
        // ... (Aggregation logic similar to exportExcel logic)
        // For brevity, I'll return basics or todo.
        // Actually, the frontend expects specific fields.

        // Simple aggregation loop:
        let pNetUSD = 0;
        let pNetTRY = 0;
        let pDedUSD = 0;
        let pExcUSD = 0;

        // Base Salary
        if (p.header.base_min_currency === 'USD') pNetUSD += Number(p.header.base_min || 0);
        else pNetTRY += Number(p.header.base_min || 0);

        // Experience
        const expAmt = (Number(p.header.experience_allowance_amount) || 0) * (Number(p.header.years_of_exp) || 0);
        if (p.header.experience_allowance_currency === 'USD') { pNetUSD += expAmt; pExcUSD += expAmt; }
        else pNetTRY += expAmt;

        for (const line of lines) {
            const amt = Number(line.amount || 0);
            if (line.currency === 'USD') {
                if (line.category === 'deduction') { pDedUSD += amt; pNetUSD -= amt; }
                else { pExcUSD += amt; pNetUSD += amt; } // allowance, exception, overtime
            } else {
                if (line.category === 'deduction') pNetTRY -= amt;
                else pNetTRY += amt;
            }
        }

        totalNetUSD += pNetUSD;
        totalNetTRY += pNetTRY;
        totalDeductionsUSD += pDedUSD;
        totalExceptionalUSD += pExcUSD;
    }

    res.json({
        totalEmployees,
        totalNetUSD,
        totalNetTRY,
        totalDeductionsUSD,
        totalExceptionalUSD
    });
}));

export default router;
