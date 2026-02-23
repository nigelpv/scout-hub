import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET all pit entries
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pit_scouting')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Convert snake_case to camelCase
        const entries = data.map((row: any) => ({
            teamNumber: row.team_number,
            scoutName: row.scout_name || 'Unknown',
            estimatedPoints: row.estimated_points || 0,
            autoClimb: row.auto_climb,
            robotClimb: row.robot_climb,
            avgBalls: row.avg_balls,
            maxBalls: row.max_balls,
            canGoUnderTrench: row.can_go_under_trench,
            canGoOverBump: row.can_go_over_bump,
            timestamp: parseInt(row.timestamp),
        }));

        res.json(entries);
    } catch (err) {
        console.error('Error fetching pit entries:', err);
        res.status(500).json({ error: 'Failed to fetch pit entries' });
    }
});

// GET pit entry for a specific team
router.get('/team/:teamNumber', async (req, res) => {
    try {
        const { teamNumber } = req.params;
        const { data, error } = await supabase
            .from('pit_scouting')
            .select('*')
            .eq('team_number', parseInt(teamNumber))
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Pit entry not found' });
            }
            throw error;
        }

        res.json({
            teamNumber: data.team_number,
            scoutName: data.scout_name || 'Unknown',
            estimatedPoints: data.estimated_points || 0,
            autoClimb: data.auto_climb,
            robotClimb: data.robot_climb,
            avgBalls: data.avg_balls,
            maxBalls: data.max_balls,
            canGoUnderTrench: data.can_go_under_trench,
            canGoOverBump: data.can_go_over_bump,
            timestamp: parseInt(data.timestamp),
        });
    } catch (err) {
        console.error('Error fetching pit entry for team:', err);
        res.status(500).json({ error: 'Failed to fetch pit entry' });
    }
});

// POST a new pit entry (upsert)
router.post('/', async (req, res) => {
    try {
        const entry = req.body;

        const { error } = await supabase
            .from('pit_scouting')
            .upsert({
                team_number: parseInt(entry.teamNumber),
                scout_name: entry.scoutName,
                estimated_points: entry.estimatedPoints,
                auto_climb: entry.autoClimb,
                robot_climb: entry.robotClimb,
                avg_balls: entry.avgBalls,
                max_balls: entry.maxBalls,
                can_go_under_trench: entry.canGoUnderTrench,
                can_go_over_bump: entry.canGoOverBump,
                timestamp: entry.timestamp
            }, { onConflict: 'team_number' });

        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error('Error creating/updating pit entry:', err);
        res.status(500).json({ error: 'Failed to save pit entry' });
    }
});

export default router;
