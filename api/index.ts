import app from '../server/index.js';

// Standalone test to bypass Express routing if needed
(app as any).get('/api/ping', (req: any, res: any) => {
    res.json({ pong: true, timestamp: Date.now() });
});

export default app;
