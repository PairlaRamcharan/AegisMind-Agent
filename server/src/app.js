import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { initDb } from './config/db.js';
import { aegisInterceptor } from './middleware/aegisInterceptor.js';

import authRoutes from './routes/auth.routes.js';
import telemetryRoutes from './routes/telemetry.routes.js';
import quarantineRoutes from './routes/quarantine.routes.js';
import remediationRoutes from './routes/remediation.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import demoExploitRoutes from './routes/demoExploits.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// Normalize duplicate slashes in request URLs
app.use((req, res, next) => {
  req.url = req.url.replace(/^\/\/+/, '/');
  next();
});

// Zero-Trust Payload Interceptor Middleware
app.use(aegisInterceptor);

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/api/v1/quarantine', quarantineRoutes);
app.use('/api/v1/remediation', remediationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/demo', demoExploitRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    system: 'AegisMind Autonomous Cyber Defense Engine',
    timestamp: new Date().toISOString()
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🛡️ AegisMind Cyber Defense Backend active on port ${PORT}`);
      console.log(`📡 API Endpoints available at http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error('Fatal backend startup failure:', err);
    process.exit(1);
  }
}

startServer();

export default app;
