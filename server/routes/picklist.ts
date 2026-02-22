import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// GET picklist
router.get('/', async (req, res) => {
    try {
        const { data: picklist, error } = await supabase
            .from('picklist')
            .select('*')
            .order('rank', { ascending: true });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedPicklist = picklist.map((row: any) => ({
            teamNumber: row.team_number,
            rank: row.rank,
            manualOverride: row.manual_override,
        }));
        res.json(mappedPicklist);
    } catch (err) {
        console.error('Error fetching picklist:', err);
        res.status(500).json({ error: 'Failed to fetch picklist' });
    }
});

// PUT update entire picklist (for reordering)
router.put('/', async (req, res) => {
    try {
        const picklist = req.body;

        // Note: Not atomic, but for this use case it's acceptable.
        // First delete all then insert.
        const { error: deleteError } = await supabase
            .from('picklist')
            .delete()
            .neq('team_number', 0); // Delete all

        if (deleteError) throw deleteError;

        if (picklist.length > 0) {
            const { error: insertError } = await supabase
                .from('picklist')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .insert(picklist.map((item: any) => ({
                    team_number: item.teamNumber,
                    rank: item.rank,
                    manual_override: item.manualOverride || false
                })));

            if (insertError) throw insertError;
        }

        res.json({ success: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error('Error updating picklist:', err);
        res.status(500).json({ error: 'Failed to update picklist' });
    }
});

// POST add team to picklist
router.post('/', async (req, res) => {
    try {
        const { teamNumber, rank, manualOverride } = req.body;

        // Get current max rank if not provided
        let newRank = rank;
        if (newRank === undefined) {
            const { data, error: rankError } = await supabase
                .from('picklist')
                .select('rank')
                .order('rank', { ascending: false })
                .limit(1);

            if (rankError) throw rankError;
            newRank = data.length > 0 ? data[0].rank + 1 : 1;
        }

        const { error } = await supabase
            .from('picklist')
            .upsert({
                team_number: teamNumber,
                rank: newRank,
                manual_override: manualOverride || false
            }, { onConflict: 'team_number' });

        if (error) throw error;

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

        const { error } = await supabase
            .from('picklist')
            .delete()
            .eq('team_number', parseInt(teamNumber));

        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error('Error removing from picklist:', err);
        res.status(500).json({ error: 'Failed to remove from picklist' });
    }
});

export default router;
