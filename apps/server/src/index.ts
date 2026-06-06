import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';

import { dicomRouter } from './routes/dicom.routes';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Security: Restrict CORS to the Next.js frontend origin only
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  // Expose custom DICOM headers so the browser can read them across origins
  exposedHeaders: [
    'X-Dicom-Rows',
    'X-Dicom-Columns',
    'X-Dicom-Bits-Allocated',
    'X-Dicom-Pixel-Representation',
    'X-Dicom-Window-Center',
    'X-Dicom-Window-Width',
  ],
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/dicom', dicomRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — must be last. Returns JSON, never HTML stack traces.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message);
  const status = (err as any).status || 500;
  // Never expose internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`VoxelSync DICOM server listening on port ${PORT}`);
  console.log(`Accepting CORS from: ${FRONTEND_URL}`);
});
