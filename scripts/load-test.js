#!/usr/bin/env node

import axios from 'axios';
import io from 'socket.io-client';
import { performance } from 'perf_hooks';

class LoadTester {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'http://localhost:3001';
    this.concurrentUsers = options.concurrentUsers || 50;
    this.testDuration = options.testDuration || 60000; // 1 minute
    this.results = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity
    };
  }

  async runLoadTest() {
    console.log(`🚀 Starting load test with ${this.concurrentUsers} concurrent users for ${this.testDuration/1000}s\n`);
    
    const promises = [];
    const startTime = Date.now();
    
    // Create concurrent user simulations
    for (let i = 0; i < this.concurrentUsers; i++) {
      promises.push(this.simulateUser(i, startTime));
    }

    // Wait for all simulations to complete
    await Promise.all(promises);
    
    // Calculate final results
    this.results.avgResponseTime = this.results.avgResponseTime / this.results.requests;
    
    console.log('\n📊 Load Test Results:');
    console.log(`  Total Requests: ${this.results.requests}`);
    console.log(`  Errors: ${this.results.errors}`);
    console.log(`  Success Rate: ${((this.results.requests - this.results.errors) / this.results.requests * 100).toFixed(2)}%`);
    console.log(`  Avg Response Time: ${this.results.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Min Response Time: ${this.results.minResponseTime.toFixed(2)}ms`);
    console.log(`  Max Response Time: ${this.results.maxResponseTime.toFixed(2)}ms`);
    console.log(`  Requests per Second: ${(this.results.requests / (this.testDuration / 1000)).toFixed(2)}`);
  }

  async simulateUser(userId, startTime) {
    try {
      // 1. Register user
      const userData = {
        username: `loadtest_${userId}`,
        email: `loadtest_${userId}@example.com`,
        password: 'Test123!'
      };

      let token;
      try {
        const registerResponse = await this.makeRequest('POST', '/api/auth/register', userData);
        token = registerResponse.token;
      } catch (error) {
        if (error.response?.status === 409) {
          // User exists, login instead
          const loginResponse = await this.makeRequest('POST', '/api/auth/login', {
            email: userData.email,
            password: userData.password
          });
          token = loginResponse.token;
        } else {
          throw error;
        }
      }

      // 2. Connect socket
      const socket = io(this.baseURL, { auth: { token } });
      await new Promise((resolve, reject) => {
        socket.on('connect', resolve);
        socket.on('connect_error', reject);
        setTimeout(reject, 5000);
      });

      // 3. Simulate user activity
      while (Date.now() - startTime < this.testDuration) {
        await this.simulateUserActivity(token, socket);
        await this.delay(1000 + Math.random() * 2000); // Random delay
      }

      socket.close();
      
    } catch (error) {
      this.results.errors++;
      console.error(`User ${userId} error:`, error.message);
    }
  }

  async simulateUserActivity(token, socket) {
    const activities = [
      () => this.makeRequest('GET', '/api/games/history', null, token),
      () => this.makeRequest('GET', '/api/games/leaderboard/top', null, token),
      () => this.makeRequest('GET', '/api/problems', null, token),
      () => socket.emit('joinQueue', { difficulty: 'easy' }),
      () => socket.emit('leaveQueue')
    ];

    const activity = activities[Math.floor(Math.random() * activities.length)];
    await activity();
  }

  async makeRequest(method, endpoint, data = null, token = null) {
    const start = performance.now();
    
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        ...(data && { data })
      };

      const response = await axios(config);
      
      const end = performance.now();
      const duration = end - start;
      
      // Update statistics
      this.results.requests++;
      this.results.avgResponseTime += duration;
      this.results.maxResponseTime = Math.max(this.results.maxResponseTime, duration);
      this.results.minResponseTime = Math.min(this.results.minResponseTime, duration);
      
      return response.data;
      
    } catch (error) {
      this.results.errors++;
      throw error;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run load test if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = {
    concurrentUsers: parseInt(process.argv[2]) || 50,
    testDuration: parseInt(process.argv[3]) || 60000
  };
  
  const loadTester = new LoadTester(options);
  loadTester.runLoadTest().catch(console.error);
}

export { LoadTester };