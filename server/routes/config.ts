import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// GET /api/config/event-key
router.get('/event-key', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', 'active_event_key')
            .single();

        if (error) {
            // If not found, return default
            if (error.code === 'PGRST116') {
                return res.json({ eventKey: '2026cahal' });
            }
            throw error;
        }
        res.json({ eventKey: data.value });
    } catch (err: any) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] Error fetching event key:`, {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
        });
        res.status(500).json({ error: 'Failed to fetch event key', details: err.message });
    }
});

// POST /api/config/event-key
router.post('/event-key', async (req, res) => {
    const { eventKey, password } = req.body;

    // Simple admin password check (consistent with Teams.tsx)
    if (password !== '16782473') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!eventKey) {
        return res.status(400).json({ error: 'eventKey is required' });
    }

    try {
        const { error } = await supabase
            .from('app_config')
            .upsert({ key: 'active_event_key', value: eventKey, updated_at: new Date().toISOString() });

        if (error) throw error;
        res.json({ success: true, eventKey });
    } catch (err: any) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] Error updating event key:`, {
            eventKey,
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
        });
        res.status(500).json({ error: 'Failed to update event key', details: err.message });
    }
});

export default router;
