import { query } from './connection';

async function createTable() {
    const sql = `
        IF OBJECT_ID('dbo.service_years', 'U') IS NULL
        BEGIN
            CREATE TABLE service_years (
                id INT IDENTITY(1,1) PRIMARY KEY,
                employee_id INT NOT NULL,
                year INT NOT NULL,
                service_months INT DEFAULT 12,
                bonus_amount FLOAT DEFAULT 0,
                currency NVARCHAR(10) DEFAULT 'USD',
                notes NVARCHAR(MAX),
                created_at DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            );
            PRINT 'Table service_years created';
        END
        ELSE
        BEGIN
            PRINT 'Table service_years already exists';
        END
    `;
    try {
        await query(sql);
        console.log('Done');
    } catch (err) {
        console.error('Error creating table:', err);
    }
}

createTable();
