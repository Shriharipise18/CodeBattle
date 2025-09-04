import express from 'express';
import { Game } from '../models/Game.js';
import { gameController } from '../controllers/gameController.js';

const router = express.Router();

// Get user's game history
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const games = await Game.find({
      'players.userId': req.user._id,
      status: 'finished'
    })
    .populate('problemId', 'title difficulty category')
    .populate('players.userId', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Game.countDocuments({
      'players.userId': req.user._id,
      status: 'finished'
    });

    res.json({
      games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Game history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific game details
router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.gameId })
      .populate('problemId')
      .populate('players.userId', 'username rating')
      .populate('winner', 'username');

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user is a player or spectator
    const isPlayer = game.players.some(p => p.userId?.toString() === req.user._id.toString());
    const isFinished = game.status === 'finished';

    if (!isPlayer && !isFinished) {
      // Return limited information for ongoing games
      return res.json({
        gameId: game.gameId,
        status: game.status,
        players: game.players.map(p => ({
          username: p.username,
          rating: p.rating,
          isBot: p.isBot
        })),
        problem: gameController.sanitizeProblem(game.problemId),
        spectatorCount: game.spectators.length
      });
    }

    res.json(game);
  } catch (error) {
    console.error('Game details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const topPlayers = await User.find({})
      .select('username rating gamesPlayed gamesWon')
      .sort({ rating: -1 })
      .limit(limit);

    const leaderboard = topPlayers.map((player, index) => ({
      rank: index + 1,
      username: player.username,
      rating: player.rating,
      gamesPlayed: player.gamesPlayed,
      winRate: player.gamesPlayed > 0 ? 
        Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active games (for spectating)
router.get('/active/list', async (req, res) => {
  try {
    const activeGames = await Game.find({
      status: { $in: ['waiting', 'starting', 'in-progress'] }
    })
    .populate('players.userId', 'username rating')
    .populate('problemId', 'title difficulty')
    .select('gameId status players problemId createdAt')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json(activeGames);
  } catch (error) {
    console.error('Active games error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;