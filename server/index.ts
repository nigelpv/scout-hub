import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import entriesRouter from './routes/entries.js';
import picklistRouter from './routes/picklist.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/entries', entriesRouter);
app.use('/api/picklist', picklistRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Initialize database tables
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS scouting_entries (
        id TEXT PRIMARY KEY,
        event TEXT NOT NULL,
        match_number INTEGER NOT NULL,
        team_number INTEGER NOT NULL,
        scout_name TEXT,
        timestamp BIGINT NOT NULL,
        auto_cycles INTEGER DEFAULT 0,
        auto_preload BOOLEAN DEFAULT FALSE,
        auto_preload_scored BOOLEAN DEFAULT FALSE,
        auto_est_cycle_size INTEGER DEFAULT 0,
        auto_climb TEXT DEFAULT 'none',
        teleop_cycles INTEGER DEFAULT 0,
        estimated_cycle_size INTEGER DEFAULT 0,
        defense_played BOOLEAN DEFAULT FALSE,
        defense_effectiveness INTEGER DEFAULT 0,
        climb_result TEXT DEFAULT 'none',
        climb_stability INTEGER DEFAULT 3,
        driver_skill INTEGER DEFAULT 3,
        robot_speed INTEGER DEFAULT 3,
        reliability INTEGER DEFAULT 3,
        notes TEXT DEFAULT ''
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS picklist (
        team_number INTEGER PRIMARY KEY,
        rank INTEGER NOT NULL,
        manual_override BOOLEAN DEFAULT FALSE
      );
    `);

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDb();
});
