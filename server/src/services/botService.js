import { aiService } from './aiService.js';
import { judge0Service } from './judge0Service.js';

class BotService {
  constructor() {
    this.activeBots = new Map(); // gameId -> bot state
    this.botTemplates = {
      easy: {
        thinkTime: { min: 20000, max: 60000 },
        accuracy: 0.7,
        codeQuality: 'basic'
      },
      medium: {
        thinkTime: { min: 15000, max: 45000 },
        accuracy: 0.85,
        codeQuality: 'good'
      },
      hard: {
        thinkTime: { min: 10000, max: 30000 },
        accuracy: 0.95,
        codeQuality: 'excellent'
      }
    };
  }

  async startBot(gameId, problem, difficulty, gameController, io) {
    const template = this.botTemplates[difficulty] || this.botTemplates.medium;
    const personality = aiService.generateBotBehavior(difficulty);
    
    const botState = {
      gameId,
      problem,
      personality,
      template,
      submissions: 0,
      lastThinkTime: Date.now(),
      isThinking: true
    };

    this.activeBots.set(gameId, botState);

    // Start bot thinking process
    this.scheduleNextSubmission(botState, gameController, io);
  }

  scheduleNextSubmission(botState, gameController, io) {
    const { template, personality, submissions } = botState;
    
    // Calculate think time based on submission number and difficulty
    const baseTime = template.thinkTime.min + 
      Math.random() * (template.thinkTime.max - template.thinkTime.min);
    
    // Bots get faster with more submissions (learning effect)
    const adaptiveTime = baseTime * Math.max(0.3, 1 - (submissions * 0.1));
    
    setTimeout(async () => {
      await this.makeBotSubmission(botState, gameController, io);
    }, adaptiveTime);
  }

  async makeBotSubmission(botState, gameController, io) {
    try {
      const { gameId, problem, personality, template } = botState;
      
      // Generate bot code
      const botCode = await this.generateProgressiveCode(botState);
      
      // Submit code through game controller
      const result = await gameController.submitCode(gameId, 'bot', {
        code: botCode,
        language: 'javascript'
      }, io);

      botState.submissions++;

      // If bot didn't get 100% and game is still active, schedule next submission
      if (result.score < 100 && botState.submissions < 5) {
        this.scheduleNextSubmission(botState, gameController, io);
      }

    } catch (error) {
      console.error('Bot submission error:', error);
    }
  }

  async generateProgressiveCode(botState) {
    const { problem, template, submissions } = botState;
    
    // Progressive improvement simulation
    const progressLevels = [
      { accuracy: 0.3, comment: 'Initial attempt with basic logic' },
      { accuracy: 0.6, comment: 'Improved algorithm with better handling' },
      { accuracy: 0.8, comment: 'Optimized solution with edge cases' },
      { accuracy: 0.9, comment: 'Near-perfect solution' },
      { accuracy: template.accuracy, comment: 'Final optimized solution' }
    ];

    const currentLevel = Math.min(submissions, progressLevels.length - 1);
    const targetAccuracy = progressLevels[currentLevel].accuracy;

    // Get base solution and introduce appropriate errors
    let code = problem.solution.javascript || this.getFallbackCode();
    
    if (Math.random() > targetAccuracy) {
      code = aiService.introduceRandomError(code);
    }

    // Add progressive improvements
    if (submissions > 0) {
      code = this.addProgressiveImprovements(code, submissions);
    }

    return code;
  }

  addProgressiveImprovements(code, submissionNumber) {
    const improvements = [
      () => code.replace(/console\.log.*$/gm, ''), // Remove debug prints
      () => this.addErrorHandling(code), // Add error handling
      () => this.optimizeAlgorithm(code), // Minor optimizations
      () => this.addComments(code) // Add documentation
    ];

    let improvedCode = code;
    for (let i = 0; i < Math.min(submissionNumber, improvements.length); i++) {
      improvedCode = improvements[i](improvedCode);
    }

    return improvedCode;
  }

  addErrorHandling(code) {
    if (code.includes('function') && !code.includes('try')) {
      return code.replace(/function\s+(\w+)\s*\([^)]*\)\s*{/, 
        'function $1() {\n  try {');
    }
    return code;
  }

  optimizeAlgorithm(code) {
    // Simple optimizations
    return code
      .replace(/for\s*\(\s*var\s+/g, 'for (let ')
      .replace(/===/g, '===')
      .replace(/\s+/g, ' ')
      .trim();
  }

  addComments(code) {
    return `// Bot solution - optimized approach\n${code}`;
  }

  getFallbackCode() {
    return `
function solve(input) {
  // Bot's attempt at solving the problem
  const lines = input.trim().split('\\n');
  
  // Process input
  const data = lines[0].split(' ').map(x => parseInt(x));
  
  // Basic solution logic
  let result = data[0];
  for (let i = 1; i < data.length; i++) {
    result += data[i];
  }
  
  return result.toString();
}

// Execute solution
const input = process.argv[2] || "";
console.log(solve(input));
    `.trim();
  }

  stopBot(gameId) {
    this.activeBots.delete(gameId);
  }

  getBotState(gameId) {
    return this.activeBots.get(gameId);
  }
}

export const botService = new BotService();