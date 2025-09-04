import express from 'express';
import { Problem } from '../models/Problem.js';

const router = express.Router();

// Get problems list
router.get('/', async (req, res) => {
  try {
    const { difficulty, category, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    const problems = await Problem.find(filter)
      .select('title description difficulty category tags usageStats')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Problem.countDocuments(filter);

    res.json({
      problems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Problems list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific problem (without solutions and hidden test cases)
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem || !problem.isActive) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Return sanitized problem (no solutions or hidden test cases)
    const sanitized = {
      _id: problem._id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      category: problem.category,
      constraints: problem.constraints,
      examples: problem.examples,
      starterCode: problem.starterCode,
      tags: problem.tags,
      testCases: problem.testCases.filter(tc => !tc.isHidden)
    };

    res.json(sanitized);
  } catch (error) {
    console.error('Problem details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get problem categories and difficulties
router.get('/meta/info', async (req, res) => {
  try {
    const categories = await Problem.distinct('category', { isActive: true });
    const difficulties = await Problem.distinct('difficulty', { isActive: true });
    const totalProblems = await Problem.countDocuments({ isActive: true });

    res.json({
      categories,
      difficulties,
      totalProblems
    });
  } catch (error) {
    console.error('Problem meta info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;