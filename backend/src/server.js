import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import passwordRoutes from './routes/passwordRoutes.js';

import chatRoutes from './routes/chatRoutes.js';
import { apiRateLimit } from './middleware/rateLimiter.js';
import fs from 'fs';

dotenv.config();

const uploadsDir = path.join(path.resolve(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Connect to database
try {
  await connectDB();
  console.log('Database connected successfully');
} catch (err) {
  console.error('Database connection failed:', err);
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env. Authentication system cannot function.');
  process.exit(1);
}

import http from 'http';
import { Server } from 'socket.io';

import { setupSocket } from './socket/socketHandler.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS for local dev frontend
app.use(cors({ origin: true }));

// JSON body
app.use(express.json());

// Initialize Socket Logic
setupSocket(io);

// Apply rate limiting to all API routes
app.use('/api/', apiRateLimit);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/chat', chatRoutes);

const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(frontendPath, 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}



app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});


