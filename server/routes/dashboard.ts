
import express from 'express';
import { query, queryOne } from '../db/connection';

const router = express.Router();

function nowPeriod() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
}

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.get('/summary', asyncHandler(async (req: any, res: any) => {
    const { period } = req.query;
    const p = String(period || nowPeriod());
    console.log('[API] dashboard:summary', p);

    const reasons: string[] = [];

    try {
        // ----- employees count -----
        let employeeCount = 0;
        try {
            const resCount = await queryOne(`SELECT COUNT(*) AS c FROM employees WHERE status = 'active'`);
            employeeCount = resCount?.c || 0;
        } catch (err) {
            reasons.push('Failed to count employees');
            console.error('[Dashboard Debug] Count Employees Error:', err);
        }

        // ----- payroll totals for the selected period -----
        let sum_try = 0, sum_usd = 0;
        try {
            // Get all headers
            console.log(`[Dashboard Debug] Querying payroll headers for period ${p}`);
            const headers = await query(`SELECT * FROM payroll_headers WHERE period = @p`, { p });
            console.log(`[Dashboard Debug] Headers found: ${headers.recordset.length}`);
            for (const h of headers.recordset) {
                // Add base
                const baseCurr = h.base_min_currency === 'USD' ? 'USD' : 'TRY';
                if (baseCurr === 'TRY') sum_try += Number(h.base_min || 0);
                else sum_usd += Number(h.base_min || 0);

                // Add experience
                const expCurr = h.experience_allowance_currency === 'USD' ? 'USD' : 'TRY';
                const expAmt = Number(h.experience_allowance_amount || 0) * Number(h.years_of_exp || 0);
                if (expCurr === 'TRY') sum_try += expAmt;
                else sum_usd += expAmt;
            }

            // Get all lines
            console.log(`[Dashboard Debug] Querying payroll lines for period ${p}`);
            const lines = await query(`
         SELECT pl.category, pl.currency, pl.amount 
         FROM payroll_lines pl
         JOIN payroll_headers ph ON ph.id = pl.header_id
         WHERE ph.period = @p
       `, { p });
            console.log(`[Dashboard Debug] Lines found: ${lines.recordset.length}`);

            for (const l of lines.recordset) {
                const amt = Number(l.amount || 0);
                const curr = l.currency === 'USD' ? 'USD' : 'TRY';
                if (l.category === 'allowance' || l.category === 'exception') {
                    if (curr === 'TRY') sum_try += amt;
                    else sum_usd += amt;
                } else if (l.category === 'deduction') {
                    if (curr === 'TRY') sum_try -= amt;
                    else sum_usd -= amt;
                }
            }

        } catch (err) {
            reasons.push('Failed to calculate payroll totals');
            console.error('[Dashboard Debug] Payroll Totals Error:', err);
        }

        // ----- evaluations (this quarter) -----
        let completed = 0, assigned = 0, percent = 0;
        try {
            const resEval = await queryOne(`
        DECLARE @dt DATE = GETDATE();
        DECLARE @q_start DATE = DATEFROMPARTS(YEAR(@dt), ((MONTH(@dt)-1)/3)*3 + 1, 1);
        DECLARE @q_end DATE = DATEADD(MONTH, 3, @q_start);
        
        SELECT
          (SELECT COUNT(*) FROM evaluations WHERE created_at >= @q_start AND created_at < @q_end) as total_assigned,
          (SELECT COUNT(*) FROM evaluations WHERE status=N'معتمد' AND updated_at >= @q_start AND updated_at < @q_end) as total_completed
      `);
            assigned = resEval?.total_assigned || 0;
            completed = resEval?.total_completed || 0;
            percent = assigned > 0 ? Math.round((completed * 100) / assigned) : 0;
        } catch (err) {
            // Suppress this specific error if table implies it's empty or missing, but log it
            reasons.push('Failed to count evaluations');
            console.error('[Dashboard Debug] Evaluations Error:', err);
        }

        // ----- exchange rate (USD/TRY) -----
        let exchange: null | { rate: number; effective_at: string } = null;
        try {
            const resEx = await queryOne(`
         SELECT TOP 1 rate, effective_from as effective_at
         FROM exchange_rates
         WHERE is_active = 1
         ORDER BY effective_from DESC
       `);
            if (resEx) {
                exchange = { rate: resEx.rate, effective_at: resEx.effective_at };
            } else {
                reasons.push('No active exchange rate found');
            }
        } catch (err) {
            reasons.push('Failed to get exchange rate');
            console.error('[Dashboard Debug] Exchange Rate Error:', err);
        }

        // ----- recent activity -----
        let recent: any[] = [];
        try {
            // Handle cases where tables might be empty or missing columns if migration wasn't perfect
            const recentEmps = await query(`
        SELECT TOP 5 'employee' as kind, N'تم إضافة موظف: ' + full_name as message, created_at
        FROM employees
        ORDER BY created_at DESC
      `);

            const recentLeaves = await query(`
        SELECT TOP 5 'leave' as kind, N'طلب إجازة: ' + e.full_name as message, l.created_at
        FROM leaves l
        JOIN employees e ON e.id = l.employee_id
        ORDER BY l.created_at DESC
      `);

            recent = [...recentEmps.recordset, ...recentLeaves.recordset];
            recent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            recent = recent.slice(0, 10);
        } catch (err) {
            reasons.push('Failed to get recent activity');
            console.error('[Dashboard Debug] Activity Error:', err);
        }

        res.json({
            ok: true,
            data: {
                period: p,
                totals: { sum_try, sum_usd },
                employeeCount,
                avg: { avg_try: 0, avg_usd: 0 },
                evaluations: { completed, assigned, percent },
                exchange,
                recent
            },
            reasons
        });

    } catch (e: any) {
        console.error('[Dashboard] Critical Error:', e);
        res.status(500).json({ ok: false, error: e?.message || String(e), stack: e?.stack });
    }
}));

export default router;
