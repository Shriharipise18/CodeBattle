import { Game } from '../models/Game.js';
import { Problem } from '../models/Problem.js';
import { User } from '../models/User.js';
import { judge0Service } from '../services/judge0Service.js';
import { aiService } from '../services/aiService.js';

class GameController {
  constructor() {
    this.activeGames = new Map(); // gameId -> game state
  }

  async createGame(gameData) {
    try {
      const game = new Game(gameData);
      await game.save();
      
      // Initialize active game state
      this.activeGames.set(gameData.gameId, {
        id: gameData.gameId,
        players: gameData.players,
        status: 'waiting',
        startTime: null,
        submissions: new Map(), // playerId -> submissions[]
        scores: new Map(), // playerId -> current score
        spectators: new Set()
      });

      return game;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  async startGame(gameId, io) {
    try {
      const game = await Game.findOne({ gameId }).populate('problemId');
      if (!game || game.status !== 'waiting') {
        throw new Error('Game not found or already started');
      }

      // Update game status
      game.status = 'starting';
      game.startTime = new Date();
      await game.save();

      // Update active game state
      const activeGame = this.activeGames.get(gameId);
      if (activeGame) {
        activeGame.status = 'starting';
        activeGame.startTime = Date.now();
      }

      // Notify all players
      io.to(gameId).emit('gameStarting', {
        gameId,
        countdown: 5,
        problem: this.sanitizeProblem(game.problemId)
      });

      // Start countdown
      for (let i = 5; i > 0; i--) {
        setTimeout(() => {
          io.to(gameId).emit('countdown', i);
        }, (5 - i) * 1000);
      }

      // Actually start the game
      setTimeout(async () => {
        game.status = 'in-progress';
        await game.save();
        
        if (activeGame) {
          activeGame.status = 'in-progress';
        }

        io.to(gameId).emit('gameStarted', {
          gameId,
          startTime: Date.now(),
          timeLimit: game.settings.timeLimit
        });

        // Start AI bot if present
        const botPlayer = game.players.find(p => p.isBot);
        if (botPlayer) {
          this.startAIBot(gameId, game.problemId, io);
        }

        // Set game timer
        setTimeout(() => {
          this.endGame(gameId, io);
        }, game.settings.timeLimit);

      }, 5000);

    } catch (error) {
      console.error('Error starting game:', error);
    }
  }

  async submitCode(gameId, playerId, submission, io) {
    try {
      const game = await Game.findOne({ gameId }).populate('problemId');
      if (!game || game.status !== 'in-progress') {
        return { error: 'Game not found or not in progress' };
      }

      // Run code against test cases
      const problem = game.problemId;
      const testResults = await judge0Service.runTestCases(
        submission.code,
        submission.language,
        problem.testCases
      );

      // Create submission record
      const submissionRecord = {
        playerId,
        code: submission.code,
        language: submission.language,
        result: {
          status: testResults.score === 100 ? 'accepted' : 'wrong-answer',
          executionTime: testResults.executionTime,
          memory: testResults.memory,
          testsPassed: testResults.testsPassed,
          totalTests: testResults.totalTests,
          score: testResults.score,
          submissionTime: new Date()
        }
      };

      // Add to game
      game.submissions.push(submissionRecord);
      await game.save();

      // Update active game state
      const activeGame = this.activeGames.get(gameId);
      if (activeGame) {
        if (!activeGame.submissions.has(playerId)) {
          activeGame.submissions.set(playerId, []);
        }
        activeGame.submissions.get(playerId).push(submissionRecord);
        activeGame.scores.set(playerId, testResults.score);
      }

      // Broadcast submission result to all players
      io.to(gameId).emit('submissionResult', {
        playerId,
        score: testResults.score,
        status: submissionRecord.result.status,
        executionTime: testResults.executionTime,
        testsPassed: testResults.testsPassed,
        totalTests: testResults.totalTests
      });

      // Check for winner (first to get 100%)
      if (testResults.score === 100) {
        await this.endGame(gameId, io, playerId);
      }

      return submissionRecord.result;
    } catch (error) {
      console.error('Error submitting code:', error);
      return { error: 'Submission failed' };
    }
  }

  async endGame(gameId, io, winnerId = null) {
    try {
      const game = await Game.findOne({ gameId });
      if (!game || game.status === 'finished') return;

      game.status = 'finished';
      game.endTime = new Date();

      // Calculate final scores
      const finalScores = [];
      for (const player of game.players) {
        const playerSubmissions = game.submissions.filter(
          s => s.playerId.toString() === player.userId?.toString()
        );
        
        let bestScore = 0;
        let bestTime = Infinity;
        let submissionCount = playerSubmissions.length;

        playerSubmissions.forEach(sub => {
          if (sub.result.score > bestScore || 
             (sub.result.score === bestScore && sub.result.executionTime < bestTime)) {
            bestScore = sub.result.score;
            bestTime = sub.result.executionTime;
          }
        });

        finalScores.push({
          playerId: player.userId,
          score: bestScore,
          completionTime: bestTime === Infinity ? game.settings.timeLimit : bestTime,
          submissions: submissionCount
        });
      }

      // Determine winner
      finalScores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.completionTime - b.completionTime;
      });

      if (finalScores.length > 0 && !winnerId) {
        winnerId = finalScores[0].playerId;
      }

      game.winner = winnerId;
      game.finalScores = finalScores;
      await game.save();

      // Update player ratings
      await this.updatePlayerRatings(game.players, winnerId);

      // Clean up active game
      this.activeGames.delete(gameId);

      // Notify players
      io.to(gameId).emit('gameEnded', {
        gameId,
        winner: winnerId,
        finalScores: finalScores.map(score => ({
          ...score,
          username: game.players.find(p => p.userId?.toString() === score.playerId?.toString())?.username
        }))
      });

    } catch (error) {
      console.error('Error ending game:', error);
    }
  }

  async updatePlayerRatings(players, winnerId) {
    const K = 32; // K-factor for rating calculation
    
    for (const player of players) {
      if (!player.userId || player.isBot) continue;
      
      const user = await User.findById(player.userId);
      if (!user) continue;

      const won = player.userId.toString() === winnerId?.toString();
      
      // Simple rating calculation (can be improved with ELO)
      const ratingChange = won ? 25 : -15;
      await user.updateStats(won, ratingChange);
    }
  }

  sanitizeProblem(problem) {
    return {
      _id: problem._id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      category: problem.category,
      constraints: problem.constraints,
      examples: problem.examples,
      starterCode: problem.starterCode,
      // Hide test cases and solutions
      tags: problem.tags
    };
  }

  async startAIBot(gameId, problemId, io) {
    // Simulate AI bot making submissions
    setTimeout(async () => {
      const problem = await Problem.findById(problemId);
      if (!problem) return;

      const botSubmission = {
        code: problem.solution.javascript || '// Bot solution',
        language: 'javascript'
      };

      // Add some randomness to bot performance
      const botAccuracy = 0.7 + Math.random() * 0.3; // 70-100% accuracy
      
      if (Math.random() < botAccuracy) {
        // Bot makes a good submission
        await this.submitCode(gameId, 'bot', botSubmission, io);
      }
    }, 10000 + Math.random() * 20000); // 10-30 seconds
  }

  getGameState(gameId) {
    return this.activeGames.get(gameId);
  }

  addSpectator(gameId, userId, username) {
    const activeGame = this.activeGames.get(gameId);
    if (activeGame) {
      activeGame.spectators.add({ userId, username });
    }
  }

  removeSpectator(gameId, userId) {
    const activeGame = this.activeGames.get(gameId);
    if (activeGame) {
      activeGame.spectators.delete(userId);
    }
  }
}

export const gameController = new GameController();