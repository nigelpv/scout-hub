import app from '../server/index.js';

import { Request, Response } from 'express';

// Standalone test to bypass Express routing if needed
(app as unknown as import('express').Express).get('/api/ping', (req: Request, res: Response) => {
    res.json({ pong: true, timestamp: Date.now() });
});

export default app;
