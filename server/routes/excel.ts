
import express from 'express';
import { upload } from '../middleware/upload';
import { previewExcelImport, runExcelImport, validateImportMonth } from '../import/runExcelImport';
import repos from '../db/repositories';
import fs from 'fs';

const router = express.Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Preview Excel
router.post('/preview', upload.single('file'), asyncHandler(async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const result = await previewExcelImport(req.file.path);
        // Cleanup temp file? Maybe keep for a bit or let import use it?
        // For preview, we might delete it immediately if not reused. 
        // But typically user uploads again for import.
        fs.unlinkSync(req.file.path);

        res.json({ success: true, data: result });
    } catch (error: any) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, error: error.message });
    }
}));

// Import Excel
router.post('/import', upload.single('file'), asyncHandler(async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { month } = req.body; // Multer parses body fields too

    if (!month || !validateImportMonth(month)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid month format' });
    }

    try {
        const result = await runExcelImport(req.file.path, { month });
        // Keep file? Or delete?
        // Usually keep as record or delete. Let's delete to save space.
        fs.unlinkSync(req.file.path);

        res.json({ success: result.success, data: result });
    } catch (error: any) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, error: error.message });
    }
}));

// Get payroll months (helper)
router.get('/months', asyncHandler(async (_req: any, res: any) => {
    const months = await repos.payroll.listPeriods();
    res.json({ success: true, data: months });
}));

// Delete month (helper)
router.delete('/month/:month', asyncHandler(async (req: any, res: any) => {
    const { month } = req.params;
    const count = await repos.payroll.deletePeriod(month);
    res.json({ success: true, data: { deletedCount: count } });
}));

export default router;
