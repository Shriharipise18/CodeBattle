#!/usr/bin/env node

import axios from 'axios';
import io from 'socket.io-client';
import { performance } from 'perf_hooks';

class GamePlatformTester {
  constructor() {
    this.baseURL = process.env.API_URL || 'http://localhost:3001';
    this.socketURL = process.env.SOCKET_URL || 'http://localhost:3001';
    this.testUsers = [];
    this.tokens = new Map();
    this.sockets = new Map();
  }

  async runFullDemo() {
    console.log('🚀 Starting CodeBattle Arena Demo\n');
    
    try {
      // 1. Test user registration and authentication
      await this.testAuthentication();
      
      // 2. Test matchmaking system
      await this.testMatchmaking();
      
      // 3. Test game functionality
      await this.testGameFlow();
      
      // 4. Test spectator mode
      await this.testSpectatorMode();
      
      // 5. Performance testing
      await this.testPerformance();
      
      console.log('✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async testAuthentication() {
    console.log('📝 Testing Authentication...');
    
    // Create test users
    const users = [
      { username: 'testplayer1', email: 'test1@example.com', password: 'Test123!' },
      { username: 'testplayer2', email: 'test2@example.com', password: 'Test123!' },
      { username: 'spectator1', email: 'spec1@example.com', password: 'Test123!' }
    ];

    for (const userData of users) {
      try {
        const response = await axios.post(`${this.baseURL}/api/auth/register`, userData);
        this.testUsers.push(userData);
        this.tokens.set(userData.username, response.data.token);
        console.log(`  ✅ Registered user: ${userData.username}`);
      } catch (error) {
        if (error.response?.status === 409) {
          // User already exists, try login
          const loginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
            email: userData.email,
            password: userData.password
          });
          this.tokens.set(userData.username, loginResponse.data.token);
          console.log(`  ✅ Logged in existing user: ${userData.username}`);
        } else {
          throw error;
        }
      }
    }
  }

  async testMatchmaking() {
    console.log('\n🎯 Testing Matchmaking...');
    
    // Connect sockets for players
    for (const user of this.testUsers.slice(0, 2)) {
      const token = this.tokens.get(user.username);
      const socket = io(this.socketURL, { auth: { token } });
      
      await new Promise((resolve) => {
        socket.on('connect', resolve);
      });
      
      this.sockets.set(user.username, socket);
      console.log(`  ✅ Connected socket for ${user.username}`);
    }

    // Test queue joining
    const player1Socket = this.sockets.get('testplayer1');
    const player2Socket = this.sockets.get('testplayer2');

    player1Socket.emit('joinQueue', { 
      difficulty: 'easy',
      gameMode: 'ranked'
    });

    player2Socket.emit('joinQueue', {
      difficulty: 'easy', 
      gameMode: 'ranked'
    });

    console.log('  ✅ Players joined matchmaking queue');

    // Wait for match
    await new Promise((resolve) => {
      player1Socket.on('gameState', (gameState) => {
        if (gameState.status === 'waiting') {
          console.log(`  ✅ Match found! Game ID: ${gameState.id}`);
          resolve(gameState);
        }
      });
    });
  }

  async testGameFlow() {
    console.log('\n🎮 Testing Game Flow...');
    
    const player1Socket = this.sockets.get('testplayer1');
    
    // Wait for game to start
    await new Promise((resolve) => {
      player1Socket.on('gameStarted', () => {
        console.log('  ✅ Game started successfully');
        resolve(true);
      });
    });

    // Test code submission
    const testCode = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

console.log(twoSum([2,7,11,15], 9));
    `;

    player1Socket.emit('submitCode', {
      code: testCode,
      language: 'javascript'
    });

    await new Promise((resolve) => {
      player1Socket.on('submissionProcessed', (result) => {
        console.log(`  ✅ Code submission processed - Score: ${result.score}%`);
        resolve(result);
      });
    });
  }

  async testSpectatorMode() {
    console.log('\n👁️  Testing Spectator Mode...');
    
    const spectatorToken = this.tokens.get('spectator1');
    const spectatorSocket = io(this.socketURL, { auth: { token: spectatorToken } });
    
    await new Promise((resolve) => {
      spectatorSocket.on('connect', resolve);
    });

    // Get active games
    const response = await axios.get(`${this.baseURL}/api/games/active/list`, {
      headers: { Authorization: `Bearer ${spectatorToken}` }
    });

    if (response.data.length > 0) {
      const gameId = response.data[0].gameId;
      spectatorSocket.emit('spectateGame', gameId);
      
      await new Promise((resolve) => {
        spectatorSocket.on('spectatorJoined', () => {
          console.log('  ✅ Spectator joined game successfully');
          resolve(true);
        });
      });
    }

    this.sockets.set('spectator1', spectatorSocket);
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    const tests = [
      { endpoint: '/api/problems', name: 'Problems API' },
      { endpoint: '/api/games/leaderboard/top', name: 'Leaderboard API' },
      { endpoint: '/health', name: 'Health Check' }
    ];

    for (const test of tests) {
      const start = performance.now();
      
      try {
        await axios.get(`${this.baseURL}${test.endpoint}`, {
          headers: { Authorization: `Bearer ${this.tokens.get('testplayer1')}` }
        });
        
        const end = performance.now();
        const duration = Math.round(end - start);
        console.log(`  ✅ ${test.name}: ${duration}ms`);
        
      } catch (error) {
        console.log(`  ❌ ${test.name}: Failed`);
      }
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test resources...');
    
    // Close all sockets
    for (const [username, socket] of this.sockets) {
      socket.close();
      console.log(`  ✅ Closed socket for ${username}`);
    }

    // In a real scenario, you might want to clean up test users
    // For now, we'll leave them for manual inspection
    console.log('  ✅ Cleanup completed');
  }
}

// Run demo if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new GamePlatformTester();
  tester.runFullDemo().catch(console.error);
}

export { GamePlatformTester };