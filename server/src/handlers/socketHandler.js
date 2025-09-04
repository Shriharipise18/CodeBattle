import { socketAuthMiddleware } from '../middleware/auth.js';
import { gameController } from '../controllers/gameController.js';
import { matchmakingService } from '../services/matchmakingService.js';
import { User } from '../models/User.js';

export const socketHandler = (io) => {
  // Authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    console.log(`🔌 User ${socket.username} connected`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, { 
      isOnline: true,
      lastSeen: new Date()
    });

    // Join matchmaking queue
    socket.on('joinQueue', (preferences) => {
      matchmakingService.addToQueue(socket.userId, preferences);
      
      socket.emit('queueJoined', {
        position: matchmakingService.queue.size,
        estimatedWait: matchmakingService.calculateAverageWaitTime()
      });
    });

    // Leave matchmaking queue
    socket.on('leaveQueue', () => {
      matchmakingService.removeFromQueue(socket.userId);
      socket.emit('queueLeft');
    });

    // Join game room
    socket.on('joinGame', async (gameId) => {
      socket.join(gameId);
      
      const gameState = gameController.getGameState(gameId);
      if (gameState) {
        socket.emit('gameState', gameState);
        
        // Check if game should start (all players connected)
        const connectedPlayers = await io.in(gameId).fetchSockets();
        if (connectedPlayers.length >= gameState.players.length && gameState.status === 'waiting') {
          await gameController.startGame(gameId, io);
        }
      }
    });

    // Join as spectator
    socket.on('spectateGame', (gameId) => {
      socket.join(gameId);
      gameController.addSpectator(gameId, socket.userId, socket.username);
      
      const gameState = gameController.getGameState(gameId);
      socket.emit('spectatorJoined', gameState);
    });

    // Handle code submissions
    socket.on('submitCode', async (data) => {
      const { gameId, code, language } = data;
      
      const result = await gameController.submitCode(
        gameId, 
        socket.userId, 
        { code, language }, 
        io
      );
      
      socket.emit('submissionProcessed', result);
    });

    // Handle real-time code updates (for spectators)
    socket.on('codeUpdate', (data) => {
      const { gameId, code, cursorPosition } = data;
      
      socket.to(gameId).emit('playerCodeUpdate', {
        playerId: socket.userId,
        username: socket.username,
        code,
        cursorPosition,
        timestamp: Date.now()
      });
    });

    // Chat messages
    socket.on('chatMessage', (data) => {
      const { gameId, message } = data;
      
      io.to(gameId).emit('chatMessage', {
        playerId: socket.userId,
        username: socket.username,
        message,
        timestamp: Date.now()
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`🔌 User ${socket.username} disconnected`);
      
      // Update user online status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      });

      // Remove from matchmaking queue
      matchmakingService.removeFromQueue(socket.userId);

      // Handle game disconnection logic here
      // In production, you might want to pause the game or add reconnection logic
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'Connection error occurred' });
    });
  });
};