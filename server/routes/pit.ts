import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// Safely parses a field that may be a JSON array string, a plain old string, or already an array.
function safeParseArray(val: unknown): string[] {
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string' || !val) return [];
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

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
            autoClimb: safeParseArray(row.auto_climb),
            robotClimb: safeParseArray(row.robot_climb),
            ballsPerSecond: row.balls_per_second || 0,
            hopperCapacity: row.hopper_capacity || 0,
            canGoUnderTrench: row.can_go_under_trench,
            canGoOverBump: row.can_go_over_bump,
            intakeType: row.intake_type || '',
            shooterType: row.shooter_type || 'none',
            frontPhoto: row.front_photo || false,
            backPhoto: row.back_photo || false,
            notes: row.notes || '',
            timestamp: parseInt(row.timestamp),
        }));

        res.json(entries);
    } catch (err: any) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] Error fetching pit entries:`, {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
        });
        res.status(500).json({ error: 'Failed to fetch pit entries', details: err.message });
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
            autoClimb: safeParseArray(data.auto_climb),
            robotClimb: safeParseArray(data.robot_climb),
            ballsPerSecond: data.balls_per_second || 0,
            hopperCapacity: data.hopper_capacity || 0,
            canGoUnderTrench: data.can_go_under_trench,
            canGoOverBump: data.can_go_over_bump,
            intakeType: data.intake_type || '',
            shooterType: data.shooter_type || 'none',
            frontPhoto: data.front_photo || false,
            backPhoto: data.back_photo || false,
            notes: data.notes || '',
            timestamp: parseInt(data.timestamp),
        });
    } catch (err: any) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] Error fetching pit entry for team:`, {
            teamNumber: req.params.teamNumber,
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
        });
        res.status(500).json({ error: 'Failed to fetch pit entry', details: err.message });
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
                auto_climb: JSON.stringify(entry.autoClimb || []),
                robot_climb: JSON.stringify(entry.robotClimb || []),
                balls_per_second: entry.ballsPerSecond || 0,
                hopper_capacity: entry.hopperCapacity || 0,
                can_go_under_trench: entry.canGoUnderTrench,
                can_go_over_bump: entry.canGoOverBump,
                intake_type: entry.intakeType || '',
                shooter_type: entry.shooterType || 'none',
                front_photo: entry.frontPhoto || false,
                back_photo: entry.backPhoto || false,
                notes: entry.notes || '',
                timestamp: entry.timestamp
            }, { onConflict: 'team_number, event' });

        if (error) throw error;

        res.json({ success: true });
    } catch (err: any) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] Error creating/updating pit entry:`, {
            team: req.body?.teamNumber,
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
        });
        res.status(500).json({ error: 'Failed to save pit entry', details: err.message });
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
