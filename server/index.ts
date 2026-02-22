import express from 'express';
import cors from 'cors';
import entriesRouter from './routes/entries.js';
import picklistRouter from './routes/picklist.js';
import pitRouter from './routes/pit.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/entries', entriesRouter);
app.use('/api/picklist', picklistRouter);
app.use('/api/pit', pitRouter);

import { supabase } from './supabase.js';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Database connectivity test
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('scouting_entries').select('count', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ status: 'connected', count: data });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message, envSet: !!process.env.SUPABASE_URL });
  }
});

// Start server if not running as a serverless function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
