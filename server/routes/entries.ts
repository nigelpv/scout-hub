import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// Safely parses a field that may be a JSON array string, a plain old string, or already an array.
// Returns an empty array for old plain-text values like 'none', 'short', null, etc.
function safeParseArray(val: unknown): string[] {
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string' || !val) return [];
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        // Legacy plain string value (e.g. 'none', 'short') — treat as empty
        return [];
    }
}
router.get('/', async (req, res) => {
    try {
        const { event } = req.query;
        let query = supabase
            .from('scouting_entries')
            .select('*');

        if (event) {
            query = query.eq('event', event);
        }

        const { data: entries, error } = await query.order('timestamp', { ascending: false });

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
            shootingRange: safeParseArray(row.shooting_range),
            startingPosition: (row.starting_position || 'hub') as 'outpost_trench' | 'outpost_bump' | 'hub' | 'depot_trench' | 'depot_bump',
            autoCycles: row.auto_cycles || 0,
            hoppersPassedAuto: row.hoppers_passed_auto || 0,
            autoClimb: row.auto_climb,
            autoObstacle: (row.auto_obstacle || 'none') as 'none' | 'outpost_trench' | 'depot_trench' | 'outpost_bump' | 'depot_bump' | 'both',
            teleopCycles: row.teleop_cycles || 0,
            hoppersPassed: row.hoppers_passed || 0,
            playedDefense: row.defense_played || false,
            defenseEffectiveness: row.defense_effectiveness || 0,
            defenseLocation: safeParseArray(row.defense_location),
            teleopObstacle: (row.teleop_obstacle || 'none') as 'none' | 'trench' | 'bump' | 'both',
            beachingType: safeParseArray(row.beaching_type),
            herdsFuelThroughTrench: row.herds_fuel_through_trench || false,
            climbResult: (row.climb_result || 'none') as 'none' | 'L1' | 'L2' | 'L3' | 'failed_attempt',
            climbPosition: (row.climb_position || 'none') as 'none' | 'side' | 'center',
            driverSkill: row.driver_skill || 3,
            incapacitated: row.disabled_or_shut_down || false,
            notes: row.notes || '',
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
            shootingRange: safeParseArray(row.shooting_range),
            startingPosition: (row.starting_position || 'hub') as 'outpost_trench' | 'outpost_bump' | 'hub' | 'depot_trench' | 'depot_bump',
            autoCycles: row.auto_cycles || 0,
            hoppersPassedAuto: row.hoppers_passed_auto || 0,
            autoClimb: row.auto_climb,
            autoObstacle: (row.auto_obstacle || 'none') as 'none' | 'outpost_trench' | 'depot_trench' | 'outpost_bump' | 'depot_bump' | 'both',
            teleopCycles: row.teleop_cycles || 0,
            hoppersPassed: row.hoppers_passed || 0,
            playedDefense: row.defense_played || false,
            defenseEffectiveness: row.defense_effectiveness || 0,
            defenseLocation: safeParseArray(row.defense_location),
            teleopObstacle: (row.teleop_obstacle || 'none') as 'none' | 'trench' | 'bump' | 'both',
            beachingType: safeParseArray(row.beaching_type),
            herdsFuelThroughTrench: row.herds_fuel_through_trench || false,
            climbResult: (row.climb_result || 'none') as 'none' | 'L1' | 'L2' | 'L3' | 'failed_attempt',
            climbPosition: (row.climb_position || 'none') as 'none' | 'side' | 'center',
            driverSkill: row.driver_skill || 3,
            incapacitated: row.disabled_or_shut_down || false,
            notes: row.notes || '',
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
                starting_position: entry.startingPosition || 'hub',
                auto_cycles: entry.autoCycles || 0,
                hoppers_passed_auto: entry.hoppersPassedAuto || 0,
                auto_climb: entry.autoClimb || 'none',
                auto_obstacle: entry.autoObstacle || 'none',
                teleop_cycles: entry.teleopCycles || 0,
                hoppers_passed: entry.hoppersPassed || 0,
                defense_location: JSON.stringify(entry.defenseLocation || []),
                defense_effectiveness: entry.defenseEffectiveness || 0,
                defense_played: entry.playedDefense || false,
                teleop_obstacle: entry.teleopObstacle || 'none',
                beaching_type: JSON.stringify(entry.beachingType || []),
                herds_fuel_through_trench: entry.herdsFuelThroughTrench || false,
                climb_result: entry.climbResult || 'none',
                climb_position: entry.climbPosition || 'none',
                driver_skill: entry.driverSkill || 3,
                disabled_or_shut_down: entry.incapacitated || false,
                notes: entry.notes || ''
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
