import axios from 'axios';

class Judge0Service {
  constructor() {
    this.baseURL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = process.env.JUDGE0_API_KEY;
    
    this.languageIds = {
      javascript: 63, // Node.js
      python: 71,     // Python 3
      java: 62,       // Java
      cpp: 54,        // C++ 17
      c: 50           // C
    };
  }

  async submitCode(code, language, input, expectedOutput) {
    try {
      const languageId = this.languageIds[language];
      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Submit code for execution
      const submissionResponse = await axios.post(`${this.baseURL}/submissions`, {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(input).toString('base64'),
        expected_output: Buffer.from(expectedOutput).toString('base64')
      }, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'Content-Type': 'application/json'
        }
      });

      const token = submissionResponse.data.token;
      
      // Poll for result
      const result = await this.pollForResult(token);
      return this.processResult(result, expectedOutput);
      
    } catch (error) {
      console.error('Judge0 submission error:', error);
      return {
        status: 'error',
        message: 'Code execution failed',
        executionTime: 0,
        memory: 0,
        testsPassed: 0,
        totalTests: 1
      };
    }
  }

  async pollForResult(token, maxRetries = 10, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(`${this.baseURL}/submissions/${token}`, {
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        });

        const result = response.data;
        
        // Status 3 = Accepted, 1/2 = In Queue/Processing
        if (result.status.id !== 1 && result.status.id !== 2) {
          return result;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Polling attempt ${i + 1} failed:`, error);
      }
    }
    
    throw new Error('Execution timeout');
  }

  processResult(result, expectedOutput) {
    const status = result.status.id;
    const output = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : '';
    const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : '';
    
    // Status codes: 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit Exceeded, etc.
    const statusMap = {
      3: 'accepted',
      4: 'wrong-answer',
      5: 'time-limit-exceeded',
      6: 'compilation-error',
      7: 'runtime-error'
    };

    return {
      status: statusMap[status] || 'error',
      output: output.trim(),
      stderr: stderr.trim(),
      executionTime: result.time ? parseFloat(result.time) * 1000 : 0, // Convert to ms
      memory: result.memory || 0,
      testsPassed: status === 3 ? 1 : 0,
      totalTests: 1,
      correct: status === 3 && output.trim() === expectedOutput.trim()
    };
  }

  async runTestCases(code, language, testCases) {
    let totalPassed = 0;
    let totalTime = 0;
    let maxMemory = 0;
    const results = [];

    for (const testCase of testCases) {
      const result = await this.submitCode(code, language, testCase.input, testCase.expectedOutput);
      
      if (result.correct) {
        totalPassed += testCase.weight || 1;
      }
      
      totalTime += result.executionTime;
      maxMemory = Math.max(maxMemory, result.memory);
      
      results.push({
        ...result,
        isHidden: testCase.isHidden,
        weight: testCase.weight
      });
      
      // Stop on first failure for performance
      if (!result.correct && testCase.isHidden) {
        break;
      }
    }

    const totalWeight = testCases.reduce((sum, tc) => sum + (tc.weight || 1), 0);
    const score = Math.round((totalPassed / totalWeight) * 100);

    return {
      score,
      testsPassed: totalPassed,
      totalTests: testCases.length,
      executionTime: totalTime,
      memory: maxMemory,
      results: results.filter(r => !r.isHidden) // Don't reveal hidden test results
    };
  }
}

export const judge0Service = new Judge0Service();