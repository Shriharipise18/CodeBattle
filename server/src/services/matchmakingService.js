import { User } from '../models/User.js';
import { Problem } from '../models/Problem.js';
import { gameController } from '../controllers/gameController.js';
import { v4 as uuidv4 } from 'uuid';

class MatchmakingService {
  constructor() {
    this.queue = new Map(); // userId -> { user, preferences, timestamp }
    this.isRunning = false;
    this.matchInterval = null;
    this.ratingRange = 200; // Initial rating range for matching
    this.maxWaitTime = 60000; // 1 minute max wait
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.matchInterval = setInterval(() => {
      this.processQueue();
    }, 5000); // Check every 5 seconds
    
    console.log('🎯 Matchmaking service started');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.matchInterval) {
      clearInterval(this.matchInterval);
      this.matchInterval = null;
    }
    
    console.log('🛑 Matchmaking service stopped');
  }

  addToQueue(userId, preferences = {}) {
    this.queue.set(userId, {
      userId,
      preferences: {
        difficulty: preferences.difficulty || 'medium',
        gameMode: preferences.gameMode || 'ranked',
        language: preferences.language || 'javascript'
      },
      timestamp: Date.now()
    });
    
    console.log(`➕ Player ${userId} added to matchmaking queue`);
  }

  removeFromQueue(userId) {
    const removed = this.queue.delete(userId);
    if (removed) {
      console.log(`➖ Player ${userId} removed from matchmaking queue`);
    }
    return removed;
  }

  async processQueue() {
    if (this.queue.size < 2) return;

    const players = Array.from(this.queue.values());
    const matches = [];

    // Try to match players with similar ratings and preferences
    for (let i = 0; i < players.length; i++) {
      const player1 = players[i];
      if (matches.some(match => match.includes(player1.userId))) continue;

      const waitTime = Date.now() - player1.timestamp;
      const expandedRange = this.ratingRange + (waitTime / 10000) * 100; // Expand range over time

      for (let j = i + 1; j < players.length; j++) {
        const player2 = players[j];
        if (matches.some(match => match.includes(player2.userId))) continue;

        if (this.canMatch(player1, player2, expandedRange)) {
          matches.push([player1.userId, player2.userId]);
          break;
        }
      }

      // If player has been waiting too long, add a bot
      if (waitTime > this.maxWaitTime && !matches.some(match => match.includes(player1.userId))) {
        matches.push([player1.userId, 'bot']);
      }
    }

    // Create games for matches
    for (const match of matches) {
      await this.createGame(match);
    }
  }

  canMatch(player1, player2, ratingRange) {
    // Check if players can be matched based on preferences and rating
    const sameDifficulty = player1.preferences.difficulty === player2.preferences.difficulty;
    const sameGameMode = player1.preferences.gameMode === player2.preferences.gameMode;
    
    // For now, match based on difficulty and game mode
    return sameDifficulty && sameGameMode;
  }

  async createGame(playerIds) {
    try {
      const gameId = uuidv4();
      const players = [];

      for (const playerId of playerIds) {
        if (playerId === 'bot') {
          players.push({
            userId: null,
            username: `Bot_${Math.random().toString(36).substr(2, 6)}`,
            rating: 1200,
            isBot: true
          });
        } else {
          const user = await User.findById(playerId);
          if (user) {
            players.push({
              userId: user._id,
              username: user.username,
              rating: user.rating,
              isBot: false
            });
            this.removeFromQueue(playerId);
          }
        }
      }

      if (players.length >= 2) {
        const firstPlayer = this.queue.get(playerIds[0]);
        const difficulty = firstPlayer?.preferences.difficulty || 'medium';
        
        // Get a random problem of the specified difficulty
        const problem = await Problem.findOne({ 
          difficulty, 
          isActive: true 
        });

        if (!problem) {
          console.error('No problems available for difficulty:', difficulty);
          return;
        }

        await gameController.createGame({
          gameId,
          problemId: problem._id,
          players,
          settings: {
            maxPlayers: 2,
            timeLimit: 1800000, // 30 minutes
            difficultyLevel: difficulty
          }
        });

        console.log(`🎮 Game ${gameId} created for players:`, players.map(p => p.username));
      }
    } catch (error) {
      console.error('Error creating game:', error);
    }
  }

  getQueueStatus() {
    return {
      playersInQueue: this.queue.size,
      averageWaitTime: this.calculateAverageWaitTime(),
      isRunning: this.isRunning
    };
  }

  calculateAverageWaitTime() {
    if (this.queue.size === 0) return 0;
    
    const now = Date.now();
    const totalWaitTime = Array.from(this.queue.values())
      .reduce((sum, player) => sum + (now - player.timestamp), 0);
    
    return Math.round(totalWaitTime / this.queue.size);
  }
}

export const matchmakingService = new MatchmakingService();