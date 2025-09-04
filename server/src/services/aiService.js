class AIService {
  constructor() {
    this.botPersonalities = [
      { name: 'SpeedCoder', speed: 'fast', accuracy: 0.85 },
      { name: 'Perfectionist', speed: 'slow', accuracy: 0.95 },
      { name: 'Rookie', speed: 'medium', accuracy: 0.65 },
      { name: 'Veteran', speed: 'medium', accuracy: 0.90 }
    ];
  }

  generateBotBehavior(difficulty) {
    const personality = this.botPersonalities[
      Math.floor(Math.random() * this.botPersonalities.length)
    ];

    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.2
    };

    return {
      ...personality,
      baseDelay: this.calculateDelay(personality.speed, difficulty),
      accuracy: Math.min(0.95, personality.accuracy * difficultyMultiplier[difficulty])
    };
  }

  calculateDelay(speed, difficulty) {
    const baseDelays = {
      fast: { easy: 15000, medium: 30000, hard: 60000 },
      medium: { easy: 30000, medium: 60000, hard: 120000 },
      slow: { easy: 60000, medium: 120000, hard: 180000 }
    };

    return baseDelays[speed][difficulty] + Math.random() * 30000; // Add randomness
  }

  async generateBotCode(problem, language = 'javascript', accuracy = 0.9) {
    // In a real implementation, this would use an AI API
    // For now, we'll use the solution with some randomness
    let code = problem.solution[language];
    
    if (!code) {
      // Fallback to a basic template
      code = `
function solve(input) {
  // Bot's attempt at solving the problem
  return "Bot solution";
}

console.log(solve("test"));
      `.trim();
    }

    // Introduce errors based on accuracy
    if (Math.random() > accuracy) {
      code = this.introduceRandomError(code);
    }

    return code;
  }

  introduceRandomError(code) {
    const errors = [
      () => code.replace(/;/g, ''), // Remove semicolons
      () => code.replace(/\+/g, '-'), // Change + to -
      () => code.replace(/</g, '>'), // Flip comparison
      () => code.replace(/return/g, '// return'), // Comment out return
      () => code + '\n// Extra line that breaks things'
    ];

    const errorFunc = errors[Math.floor(Math.random() * errors.length)];
    return errorFunc();
  }
}

export const aiService = new AIService();