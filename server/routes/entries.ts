import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();
router.get('/', async (req, res) => {
    try {
        const { data: entries, error } = await supabase
            .from('scouting_entries')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        // Convert snake_case to camelCase for frontend compatibility
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedEntries = entries.map((row: any) => ({
            id: row.id,
            event: row.event,
            matchNumber: row.match_number,
            teamNumber: row.team_number,
            scoutName: row.scout_name,
            timestamp: parseInt(row.timestamp),
            autoCycles: row.auto_cycles,
            autoPreload: row.auto_preload,
            autoPreloadScored: row.auto_preload_scored,
            autoPreloadCount: row.auto_preload_count || 0,
            autoClimb: row.auto_climb,
            autoObstacle: (row.auto_obstacle || 'none') as 'none' | 'trench' | 'bump' | 'both',
            teleopCycles: row.teleop_cycles,
            defenseType: (row.defense_type || 'none') as 'none' | 'pushing' | 'blocking' | 'poaching',
            defenseLocation: (row.defense_location || 'none') as 'none' | 'neutral' | 'our_alliance' | 'their_alliance',
            shootingRange: row.shooting_range || null,
            teleopObstacle: (row.teleop_obstacle || 'none') as 'none' | 'trench' | 'bump' | 'both',
            fuelBeaching: row.fuel_beaching || false,
            fuelBeachingType: (row.fuel_beaching_type || 'none') as 'none' | 'off_bump' | 'random',
            avgBallsScoredPerCycle: row.avg_balls_scored_per_cycle || 0,
            isPasserBot: row.is_passer_bot || false,
            defenseRating: row.defense_effectiveness || 0,
            climbResult: row.climb_result,
            climbPosition: (row.climb_position || 'none') as 'none' | 'side' | 'center',
            climbStability: row.climb_stability || 0,
            notes: row.notes,
        }));
        res.json(mappedEntries);
    } catch (err) {
        console.error('Error fetching entries:', err);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// GET entries for a specific team
router.get('/team/:teamNumber', async (req, res) => {
    try {
        const { teamNumber } = req.params;
        const { data: entries, error } = await supabase
            .from('scouting_entries')
            .select('*')
            .eq('team_number', parseInt(teamNumber))
            .order('timestamp', { ascending: false });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedEntries = entries.map((row: any) => ({
            id: row.id,
            event: row.event,
            matchNumber: row.match_number,
            teamNumber: row.team_number,
            scoutName: row.scout_name,
            timestamp: parseInt(row.timestamp),
            autoCycles: row.auto_cycles,
            autoPreload: row.auto_preload,
            autoPreloadScored: row.auto_preload_scored,
            autoPreloadCount: row.auto_preload_count || 0,
            autoClimb: row.auto_climb,
            autoObstacle: (row.auto_obstacle || 'none') as 'none' | 'trench' | 'bump' | 'both',
            teleopCycles: row.teleop_cycles,
            defenseType: (row.defense_type || 'none') as 'none' | 'pushing' | 'blocking' | 'poaching',
            defenseLocation: (row.defense_location || 'none') as 'none' | 'neutral' | 'our_alliance' | 'their_alliance',
            shootingRange: row.shooting_range || null,
            teleopObstacle: (row.teleop_obstacle || 'none') as 'none' | 'trench' | 'bump' | 'both',
            fuelBeaching: row.fuel_beaching || false,
            fuelBeachingType: (row.fuel_beaching_type || 'none') as 'none' | 'off_bump' | 'random',
            avgBallsScoredPerCycle: row.avg_balls_scored_per_cycle || 0,
            isPasserBot: row.is_passer_bot || false,
            defenseRating: row.defense_effectiveness || 0,
            climbResult: row.climb_result,
            climbPosition: (row.climb_position || 'none') as 'none' | 'side' | 'center',
            climbStability: row.climb_stability || 0,
            notes: row.notes,
        }));
        res.json(mappedEntries);
    } catch (err) {
        console.error('Error fetching team entries:', err);
        res.status(500).json({ error: 'Failed to fetch team entries' });
    }
});

// POST new entry
router.post('/', async (req, res) => {
    try {
        // Check entry limit (500)
        const { count, error: countError } = await supabase
            .from('scouting_entries')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        if (count && count >= 500) {
            return res.status(403).json({
                error: 'Entry limit reached',
                message: 'The website is limited to 500 entries. Please delete old entries to add more.'
            });
        }

        const entry = req.body;
        console.log('Backend: Attempting to insert entry for team:', entry.teamNumber, 'Match:', entry.matchNumber);

        const { error: insertError } = await supabase
            .from('scouting_entries')
            .insert({
                id: entry.id,
                event: entry.event,
                match_number: entry.matchNumber,
                team_number: entry.teamNumber,
                scout_name: entry.scoutName || null,
                timestamp: entry.timestamp,
                auto_cycles: entry.autoCycles || 0,
                auto_preload: entry.autoPreload || false,
                auto_preload_scored: entry.autoPreloadScored || false,
                auto_preload_count: entry.autoPreloadCount || 0,
                auto_climb: entry.autoClimb || 'none',
                auto_obstacle: entry.autoObstacle || 'none',
                teleop_cycles: entry.teleopCycles || 0,
                defense_type: entry.defenseType || 'none',
                defense_location: entry.defenseLocation || 'none',
                defense_effectiveness: entry.defenseRating || 0,
                defense_played: entry.defenseType !== 'none' || (entry.defenseRating || 0) > 0,
                shooting_range: entry.shootingRange || null,
                teleop_obstacle: entry.teleopObstacle || 'none',
                fuel_beaching: entry.fuelBeaching || false,
                fuel_beaching_type: entry.fuelBeachingType || 'none',
                avg_balls_scored_per_cycle: entry.avgBallsScoredPerCycle || 0,
                is_passer_bot: entry.isPasserBot || false,
                climb_result: entry.climbResult || 'none',
                climb_position: entry.climbPosition || 'none',
                climb_stability: entry.climbStability || 0,
                notes: entry.notes || '',
                robot_speed: 0
            });

        if (insertError) {
            console.error('Supabase Insert ERROR:', insertError);
            throw insertError;
        }

        console.log('Backend: Successfully saved entry to Supabase:', entry.id);
        res.status(201).json({ success: true, id: entry.id });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error('Error creating entry:', err.message);
        res.status(500).json({ error: 'Failed to create entry', details: err.message });
    }
});

// DELETE batch entries (requires admin password)
router.post('/delete-batch', async (req, res) => {
    try {
        const { ids, password } = req.body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }

        const { error } = await supabase
            .from('scouting_entries')
            .delete()
            .in('id', ids);

        if (error) throw error;

        res.json({ success: true, count: ids.length });
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

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { error } = await supabase
            .from('scouting_entries')
            .delete()
            .eq('team_number', parseInt(teamNumber));

        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting team data:', err);
        res.status(500).json({ error: 'Failed to delete team data' });
    }
});

// DELETE all entries for multiple teams (requires admin password)
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
            .from('scouting_entries')
            .delete()
            .in('team_number', teamNumbers.map((n: string | number) => parseInt(String(n))));

        if (error) throw error;

        res.json({ success: true, count: teamNumbers.length });
    } catch (err) {
        console.error('Error deleting batch team data:', err);
        res.status(500).json({ error: 'Failed to delete multi-team data' });
    }
});

// DELETE entry (requires admin password)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { error } = await supabase
            .from('scouting_entries')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting entry:', err);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

export default router;
