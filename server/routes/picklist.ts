import { Router } from 'express';
import { pool } from '../index';

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'REDACTED';

// GET picklist
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM picklist ORDER BY rank ASC');
        const picklist = result.rows.map(row => ({
            teamNumber: row.team_number,
            rank: row.rank,
            manualOverride: row.manual_override,
        }));
        res.json(picklist);
    } catch (err) {
        console.error('Error fetching picklist:', err);
        res.status(500).json({ error: 'Failed to fetch picklist' });
    }
});

// PUT update entire picklist (for reordering)
router.put('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const picklist = req.body;

        await client.query('BEGIN');
        await client.query('DELETE FROM picklist');

        for (const item of picklist) {
            await client.query(
                'INSERT INTO picklist (team_number, rank, manual_override) VALUES ($1, $2, $3)',
                [item.teamNumber, item.rank, item.manualOverride || false]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating picklist:', err);
        res.status(500).json({ error: 'Failed to update picklist' });
    } finally {
        client.release();
    }
});

// POST add team to picklist
router.post('/', async (req, res) => {
    try {
        const { teamNumber, rank, manualOverride } = req.body;

        // Get current max rank if not provided
        let newRank = rank;
        if (newRank === undefined) {
            const result = await pool.query('SELECT COALESCE(MAX(rank), 0) + 1 as next_rank FROM picklist');
            newRank = result.rows[0].next_rank;
        }

        await pool.query(
            'INSERT INTO picklist (team_number, rank, manual_override) VALUES ($1, $2, $3) ON CONFLICT (team_number) DO UPDATE SET rank = $2, manual_override = $3',
            [teamNumber, newRank, manualOverride || false]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Error adding to picklist:', err);
        res.status(500).json({ error: 'Failed to add to picklist' });
    }
});

// DELETE team from picklist (requires admin password)
router.delete('/:teamNumber', async (req, res) => {
    try {
        const { teamNumber } = req.params;
        const { password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM picklist WHERE team_number = $1', [parseInt(teamNumber)]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing from picklist:', err);
        res.status(500).json({ error: 'Failed to remove from picklist' });
    }
});

export default router;
