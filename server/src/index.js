import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB } from './config/database.js';
import { authMiddleware } from './middleware/auth.js';
import { gameController } from './controllers/gameController.js';
import { matchmakingService } from './services/matchmakingService.js';
import { socketHandler } from './handlers/socketHandler.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import problemRoutes from './routes/problems.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', authMiddleware, gameRoutes);
app.use('/api/problems', authMiddleware, problemRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO with Redis adapter
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Redis setup for Socket.IO adapter
async function setupRedis() {
  try {
    const pubClient = createClient({ 
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    const subClient = pubClient.duplicate();
    
    await Promise.all([
      pubClient.connect(),
      subClient.connect()
    ]);
    
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter connected successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('⚠️  Running without Redis adapter (single instance mode)');
  }
}

// Initialize services
await setupRedis();
await connectDB();

// Socket.IO handlers
socketHandler(io);

// Start matchmaking service
matchmakingService.start();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Shutting down gracefully...');
  matchmakingService.stop();
  server.close();
});