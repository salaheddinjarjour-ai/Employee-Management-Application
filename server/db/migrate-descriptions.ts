import { getConnection } from './sqlite-connection';

async function migrate() {
    console.log("Starting migration to add descriptions...");
    const db = await getConnection();

    try {
        db.exec("ALTER TABLE departments ADD COLUMN description TEXT;");
        console.log("✅ Added description column to departments table.");
    } catch (err: any) {
        if (err.message.includes('duplicate column')) {
            console.log("⏭️ description column already exists on departments table.");
        } else {
            console.error("❌ Failed to alter departments table:", err.message);
        }
    }

    try {
        db.exec("ALTER TABLE units ADD COLUMN description TEXT;");
        console.log("✅ Added description column to units table.");
    } catch (err: any) {
        if (err.message.includes('duplicate column')) {
            console.log("⏭️ description column already exists on units table.");
        } else {
            console.error("❌ Failed to alter units table:", err.message);
        }
    }

    try {
        db.exec("ALTER TABLE committees ADD COLUMN description TEXT;");
        console.log("✅ Added description column to committees table.");
    } catch (err: any) {
        if (err.message.includes('duplicate column')) {
            console.log("⏭️ description column already exists on committees table.");
        } else {
            console.error("❌ Failed to alter committees table:", err.message);
        }
    }

    console.log("Migration complete!");
}

migrate().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
