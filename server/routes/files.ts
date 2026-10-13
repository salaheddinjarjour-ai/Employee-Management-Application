
import express from 'express';
import { upload } from '../middleware/upload';
import fs from 'fs';
import path from 'path';

const router = express.Router();


// Upload course attachment
router.post('/course', upload.single('file'), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Return format matching what IPC used to return, but path is relative/web-accessible
    res.json({
        attachment_name: req.file.originalname,
        // Store relative path in DB. Frontend should prepend API URL or serve static
        attachment_path: req.file.path.replace(/\\/g, '/'),
        attachment_size: req.file.size
    });
});

// Delete file (if needed, though normally just unlinking from disk)
router.delete('/:filename', (req: any, res: any) => {
    const { filename } = req.params;
    // Prevent directory traversal
    const safeName = path.basename(filename);
    const filePath = path.join('uploads', safeName);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Open/Get file
// Actually, express.static handles serving.
// But if we need metadata or specific logic:
// router.get('/:filename', ... )

export default router;
