import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET all pit entries
router.get('/', async (req, res) => {
    try {
        const { event } = req.query;
        let query = supabase
            .from('pit_scouting')
            .select('*');

        if (event) {
            query = query.eq('event', event);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Convert snake_case to camelCase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entries = data.map((row: any) => ({
            event: row.event || '2026cahal',
            teamNumber: row.team_number,
            scoutName: row.scout_name || 'Unknown',
            autoClimb: row.auto_climb,
            robotClimb: row.robot_climb,
            ballsPerSecond: row.balls_per_second || 0,
            canGoUnderTrench: row.can_go_under_trench,
            canGoOverBump: row.can_go_over_bump,
            canPassFuel: Array.isArray(row.can_pass_fuel) ? row.can_pass_fuel : (row.can_pass_fuel ? JSON.parse(row.can_pass_fuel) : []),
            canBulldozeFuel: row.can_bulldoze_fuel || false,
            intakeType: row.intake_type || '',
            shooterType: row.shooter_type || 'none',
            frontPhoto: row.front_photo || false,
            backPhoto: row.back_photo || false,
            notes: row.notes || '',
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
            event: data.event || '2026cahal',
            teamNumber: data.team_number,
            scoutName: data.scout_name || 'Unknown',
            autoClimb: data.auto_climb,
            robotClimb: data.robot_climb,
            ballsPerSecond: data.balls_per_second || 0,
            canGoUnderTrench: data.can_go_under_trench,
            canGoOverBump: data.can_go_over_bump,
            canPassFuel: Array.isArray(data.can_pass_fuel) ? data.can_pass_fuel : (data.can_pass_fuel ? JSON.parse(data.can_pass_fuel) : []),
            canBulldozeFuel: data.can_bulldoze_fuel || false,
            intakeType: data.intake_type || '',
            shooterType: data.shooter_type || 'none',
            frontPhoto: data.front_photo || false,
            backPhoto: data.back_photo || false,
            notes: data.notes || '',
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
                event: entry.event || '2026cahal',
                team_number: parseInt(entry.teamNumber),
                scout_name: entry.scoutName,
                auto_climb: entry.autoClimb,
                robot_climb: entry.robotClimb,
                balls_per_second: entry.ballsPerSecond || 0,
                can_go_under_trench: entry.canGoUnderTrench,
                can_go_over_bump: entry.canGoOverBump,
                can_pass_fuel: JSON.stringify(entry.canPassFuel || []),
                can_bulldoze_fuel: entry.canBulldozeFuel || false,
                intake_type: entry.intakeType || '',
                shooter_type: entry.shooterType || 'none',
                front_photo: entry.frontPhoto || false,
                back_photo: entry.backPhoto || false,
                notes: entry.notes || '',
                timestamp: entry.timestamp
            }, { onConflict: 'team_number, event' });

        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error('Error creating/updating pit entry:', err);
        res.status(500).json({ error: 'Failed to save pit entry' });
    }
});

// DELETE pit data for a team (requires admin password)
router.delete('/team/:teamNumber', async (req, res) => {
    try {
        const { teamNumber } = req.params;
        const { password } = req.body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { error } = await supabase
            .from('pit_scouting')
            .delete()
            .eq('team_number', parseInt(teamNumber));

        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting team pit data:', err);
        res.status(500).json({ error: 'Failed to delete team pit data' });
    }
});

// DELETE all pit entries for multiple teams (requires admin password)
router.post('/delete-batch-teams', async (req, res) => {
    try {
        const { teamNumbers, password } = req.body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!Array.isArray(teamNumbers) || teamNumbers.length === 0) {
            return res.status(400).json({ error: 'No team numbers provided' });
        }

        const { error } = await supabase
            .from('pit_scouting')
            .delete()
            .in('team_number', teamNumbers.map((n: string | number) => parseInt(String(n))));

        if (error) throw error;

        res.json({ success: true, count: teamNumbers.length });
    } catch (err) {
        console.error('Error deleting multi-team pit data:', err);
        res.status(500).json({ error: 'Failed to delete multi-team pit data' });
    }
});

export default router;
