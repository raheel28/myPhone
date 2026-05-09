// server/src/index.js
// Application entry point — wires together Express, middleware, routes, error handling.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { connectDB } from './config/db.js';
import phoneRoutes from './routes/phones.js';
import chatbotRoutes from './routes/chatbot.js';
import contactRoutes from './routes/contact.js';
import branchRoutes from './routes/branches.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('[debug] env check:', {
  MONGODB_URI: process.env.MONGODB_URI ? 'set len=' + process.env.MONGODB_URI.length : 'MISSING',
  GROQ_API_KEY: process.env.GROQ_API_KEY ? 'set len=' + process.env.GROQ_API_KEY.length : 'MISSING',
  GROQ_MODEL: process.env.GROQ_MODEL || 'MISSING',
  TEST_PING: process.env.TEST_PING || 'MISSING',
  NODE_ENV: process.env.NODE_ENV || 'unset',
  PORT: process.env.PORT || 'unset',
  ALL_KEYS_COUNT: Object.keys(process.env).length,
});
console.log('[debug] non-railway non-npm keys:', Object.keys(process.env).filter(k => !k.startsWith('RAILWAY_') && !k.startsWith('npm_') && !['PATH','HOME','HOSTNAME','PWD','SHLVL','_'].includes(k)).sort().join(','));



const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & infra middleware ──
app.use(
  helmet({
    contentSecurityPolicy: {
      // Keep helmet's defaults but loosen img-src so we can render the
      // Unsplash phone photos returned by imageResolver.js.
      directives: {
        'img-src': ["'self'", 'data:', 'https:'],
      },
    },
    // Allow other origins (Unsplash) to fetch our images / responses too.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS — allow comma-separated list in CLIENT_ORIGIN
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (curl, server-to-server) and exact-match origins.
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return cb(null, true);
      }
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Sensible rate-limit for the chatbot endpoint (LLM cost protection).
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chatbot requests — please slow down.' },
});

// ── Routes ──
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use('/api/phones', phoneRoutes);
app.use('/api/chatbot', chatLimiter, chatbotRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/branches', branchRoutes);

// In production, serve the built React client from the same origin.
// Static assets (e.g. /assets/index-abc.js) are served directly; any other
// non-API path falls through to index.html so React Router handles it.
if (process.env.NODE_ENV === 'production') {
  // Try a couple of plausible locations so we don't silently 500 if the
  // build output landed somewhere unexpected on the platform.
  const candidates = [
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
  ];
  const clientDist = candidates.find((c) => fs.existsSync(path.join(c, 'index.html'))) || candidates[0];
  console.log('[static] candidates:', candidates);
  console.log('[static] using clientDist:', clientDist);
  console.log('[static] dist exists:', fs.existsSync(clientDist));
  console.log('[static] index.html exists:', fs.existsSync(path.join(clientDist, 'index.html')));
  try {
    const assetsDir = path.join(clientDist, 'assets');
    if (fs.existsSync(assetsDir)) {
      console.log('[static] /assets contents (first 5):', fs.readdirSync(assetsDir).slice(0, 5));
    } else {
      console.log('[static] /assets folder MISSING at', assetsDir);
    }
  } catch (e) { console.log('[static] readdir error:', e.message); }

  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    // Only serve index.html for navigation requests (HTML-accepting); for
    // missing assets, let the 404 handler return a real 404 instead of HTML.
    if (!req.accepts('html')) return next();
    if (/\.[a-zA-Z0-9]+$/.test(req.path)) return next(); // looks like a file, not a route
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 + central error handler
app.use(notFound);
app.use(errorHandler);

// ── Boot ──
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () =>
      console.log(`📱  Phone marketplace API listening on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
};

start();
