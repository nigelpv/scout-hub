
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Adding auto_preload_count column...');
        await client.query(`
      ALTER TABLE scouting_entries 
      ADD COLUMN IF NOT EXISTS auto_preload_count INTEGER DEFAULT 0;
    `);
        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
