import { Router } from 'express';
import { pool } from '../index.js';

const router = Router();

// Admin password for delete operations
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// GET all entries
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM scouting_entries ORDER BY timestamp DESC');
        // Convert snake_case to camelCase for frontend compatibility
        const entries = result.rows.map((row: any) => ({
            id: row.id,
            event: row.event,
            matchNumber: row.match_number,
            teamNumber: row.team_number,
            scoutName: row.scout_name,
            timestamp: parseInt(row.timestamp),
            autoCycles: row.auto_cycles,
            autoPreload: row.auto_preload,
            autoPreloadScored: row.auto_preload_scored,
            autoPreloadCount: row.auto_preload_count,
            autoEstCycleSize: row.auto_est_cycle_size,
            autoClimb: row.auto_climb,
            teleopCycles: row.teleop_cycles,
            estimatedCycleSize: row.estimated_cycle_size,
            defenseRating: row.defense_effectiveness,
            climbResult: row.climb_result,
            climbStability: row.climb_stability,
            driverSkill: row.driver_skill,
            shootingRange: row.shooting_range as 'short' | 'medium' | 'long',
            notes: row.notes,
        }));
        res.json(entries);
    } catch (err) {
        console.error('Error fetching entries:', err);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// GET entries for a specific team
router.get('/team/:teamNumber', async (req, res) => {
    try {
        const { teamNumber } = req.params;
        const result = await pool.query(
            'SELECT * FROM scouting_entries WHERE team_number = $1 ORDER BY timestamp DESC',
            [parseInt(teamNumber)]
        );
        const entries = result.rows.map((row: any) => ({
            id: row.id,
            event: row.event,
            matchNumber: row.match_number,
            teamNumber: row.team_number,
            scoutName: row.scout_name,
            timestamp: parseInt(row.timestamp),
            autoCycles: row.auto_cycles,
            autoPreload: row.auto_preload,
            autoPreloadScored: row.auto_preload_scored,
            autoPreloadCount: row.auto_preload_count,
            autoEstCycleSize: row.auto_est_cycle_size,
            autoClimb: row.auto_climb,
            teleopCycles: row.teleop_cycles,
            estimatedCycleSize: row.estimated_cycle_size,
            defenseRating: row.defense_effectiveness,
            climbResult: row.climb_result,
            climbStability: row.climb_stability,
            driverSkill: row.driver_skill,
            shootingRange: row.shooting_range as 'short' | 'medium' | 'long',
            notes: row.notes,
        }));
        res.json(entries);
    } catch (err) {
        console.error('Error fetching team entries:', err);
        res.status(500).json({ error: 'Failed to fetch team entries' });
    }
});

// POST new entry
router.post('/', async (req, res) => {
    try {
        // Check entry limit (300)
        const countResult = await pool.query('SELECT COUNT(*) FROM scouting_entries');
        const count = parseInt(countResult.rows[0].count);

        if (count >= 500) {
            return res.status(403).json({
                error: 'Entry limit reached',
                message: 'The website is limited to 500 entries. Please delete old entries to add more.'
            });
        }

        const entry = req.body;
        await pool.query(
            `INSERT INTO scouting_entries (
        id, event, match_number, team_number, scout_name, timestamp,
        auto_cycles, auto_preload, auto_preload_scored, auto_preload_count, auto_est_cycle_size, auto_climb,
        teleop_cycles, estimated_cycle_size, defense_played, defense_effectiveness,
        climb_result, climb_stability, driver_skill, robot_speed, 
        shooting_range, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
            [
                entry.id,
                entry.event,
                entry.matchNumber,
                entry.teamNumber,
                entry.scoutName || null,
                entry.timestamp,
                entry.autoCycles || 0,
                entry.autoPreload || false,
                entry.autoPreloadScored || false,
                entry.autoPreloadCount || 0,
                entry.autoEstCycleSize || 0,
                entry.autoClimb || 'none',
                entry.teleopCycles || 0,
                entry.estimatedCycleSize || 0,
                entry.defenseRating > 0,
                entry.defenseRating || 0,
                entry.climbResult || 'none',
                entry.climbStability || 3,
                entry.driverSkill || 3,
                0, // robot_speed (removed from frontend)
                entry.shootingRange || 'short',
                entry.notes || '',
            ]
        );
        res.status(201).json({ success: true, id: entry.id });
    } catch (err: any) {
        console.error('Error creating entry:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ error: 'Failed to create entry', details: err.message });
    }
});

// DELETE batch entries (requires admin password)
router.post('/delete-batch', async (req, res) => {
    try {
        const { ids, password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
            await client.query(`DELETE FROM scouting_entries WHERE id IN (${placeholders})`, ids);
            await client.query('COMMIT');
            res.json({ success: true, count: ids.length });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error deleting batch:', err);
        res.status(500).json({ error: 'Failed to delete entries' });
    }
});

// DELETE all entries for a team (requires admin password)
router.delete('/team/:teamNumber', async (req, res) => {
    try {
        const { teamNumber } = req.params;
        const { password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM scouting_entries WHERE team_number = $1', [parseInt(teamNumber)]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting team data:', err);
        res.status(500).json({ error: 'Failed to delete team data' });
    }
});

// DELETE entry (requires admin password)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM scouting_entries WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting entry:', err);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

export default router;
