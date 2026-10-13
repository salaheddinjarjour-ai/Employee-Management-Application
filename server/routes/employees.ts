
import express from 'express';
import repos from '../db/repositories';

const router = express.Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// List basic info for dropdowns
router.get('/basic', asyncHandler(async (_req: any, res: any) => {
    console.log('[API] employees:listBasic');
    const employees = await repos.employees.listBasic();
    res.json(employees);
}));

// Search employees
router.get('/search', asyncHandler(async (req: any, res: any) => {
    const { query, limit } = req.query;
    console.log('[API] db:employees:search', query, limit);

    // Call repository implementation
    const results = await repos.employees.search(
        String(query || ''),
        limit ? Number(limit) : 20
    );

    res.json(results);
}));

// Get employee by ID
router.get('/:id', asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid ID' });

    console.log('[API] employees:findById', numericId);
    const result = await repos.employees.findById(numericId);

    if (!result) return res.status(404).json({ error: 'Employee not found' });
    res.json(result);
}));

// Get employee profile (with stats)
router.get('/:id/profile', asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return res.status(400).json({ error: 'Invalid ID' });

    console.log('[API] employees:getProfile', numericId);
    const result = await repos.employees.getProfile(numericId);

    if (!result) return res.status(404).json({ error: 'Employee not found' });
    res.json(result);
}));

export default router;
