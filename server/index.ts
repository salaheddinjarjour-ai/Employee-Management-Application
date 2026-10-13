
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const useSqlite = process.env.USE_SQLITE === 'true';

import recordsRouter from './routes/records';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

import employeesRouter from './routes/employees';
import payrollRouter from './routes/payroll';
import dashboardRouter from './routes/dashboard';
import filesRouter from './routes/files';
import excelRouter from './routes/excel';

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/records', recordsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/files', filesRouter);
app.use('/api/excel', excelRouter);

// Error handler middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error('[ERROR]', err.message);
    if (err.stack) console.error('[ERROR] Stack:', err.stack);
    res.status(500).json({ error: err.message });
});

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), database: useSqlite ? 'sqlite' : 'mssql' });
});

// Settings endpoints (for browser mode)
app.get('/api/settings', async (req, res) => {
    try {
        const { query } = await import('./db/connection');
        const result = await query('SELECT key, value FROM settings');
        const settings: any = {};
        for (const row of result.recordset) {
            try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
        }
        res.json(settings);
    } catch (err: any) {
        res.json({});
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { query } = await import('./db/connection');
        const data = req.body;
        for (const [key, value] of Object.entries(data)) {
            const valStr = typeof value === 'string' ? value : JSON.stringify(value);
            await query(`INSERT INTO settings (key, value, updated_at) VALUES (@key, @value, CURRENT_TIMESTAMP)
                         ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = CURRENT_TIMESTAMP`, { key, value: valStr });
        }
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Initialize Database and Start Server
async function startServer() {
    try {
        if (useSqlite) {
            // SQLite init
            const fs = await import('fs');
            const path = await import('path');
            const { getConnection } = await import('./db/sqlite-connection');
            const db = await getConnection();

            const initSqlPath = path.default.join(__dirname, 'db/sqlite-init.sql');
            if (fs.default.existsSync(initSqlPath)) {
                const sqlContent = fs.default.readFileSync(initSqlPath, 'utf-8');
                // Execute each statement separately
                const statements = sqlContent.split(';').filter((s: string) => s.trim().length > 0);
                for (const stmt of statements) {
                    try {
                        db.exec(stmt.trim() + ';');
                    } catch (err: any) {
                        // Ignore "table already exists" errors
                        if (!err.message.includes('already exists')) {
                            console.warn('[sqlite-init] Warning:', err.message);
                        }
                    }
                }
                console.log('✅ SQLite database initialized');
            }
        } else {
            // MSSQL init
            const { initializeDatabase } = await import('./db/mssql-init');
            const { seedIfEmpty } = await import('./db/seed');
            await initializeDatabase();
            await seedIfEmpty();
            console.log('✅ MSSQL database connected and initialized');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📦 Database: ${useSqlite ? 'SQLite' : 'MSSQL'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
