# Realtime Multiplayer Coding Game Platform

A production-ready competitive coding platform featuring real-time multiplayer battles, AI opponents, spectator mode, and comprehensive game management.

## 🏗️ Architecture Overview

### Backend Services
- **Express.js API Server** - RESTful endpoints for game management
- **Socket.io Real-time Engine** - Live game communication and updates
- **Redis Adapter** - Horizontal scaling and session management
- **MongoDB Database** - Persistent storage for users, games, and problems
- **Judge0 Integration** - Secure code execution and testing
- **JWT Authentication** - Stateless user authentication
- **Rate Limiting** - API protection and abuse prevention

### Frontend Components
- **React 18** - Modern component-based UI
- **Monaco Editor** - Professional code editing experience
- **Socket.io Client** - Real-time game communication
- **Tailwind CSS** - Responsive and modern styling
- **TypeScript** - Type-safe development

### Infrastructure
- **Docker Compose** - Local development environment
- **Redis Clustering** - Session storage and message queuing
- **MongoDB Replica Set** - Data persistence and reliability
- **Load Balancing** - Horizontal scaling support
- **Health Checks** - Service monitoring and recovery

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Judge0 API key (optional, for code execution)

### Development Setup
```bash
# Clone and setup
git clone <repository>
cd multiplayer-coding-game

# Start infrastructure
docker-compose up -d mongodb redis

# Install dependencies
npm install
cd server && npm install && cd ..

# Start development servers
npm run dev
```

### Production Deployment
```bash
# Build and deploy
docker-compose up -d

# Monitor services
docker-compose logs -f
```

## 🎯 Weekly Development Roadmap

### Week 1-2: Core Infrastructure
- ✅ Authentication system (JWT, bcrypt)
- ✅ Database models (User, Game, Problem)
- ✅ Socket.io real-time communication
- ✅ Basic game flow (create, join, start)

### Week 3-4: Game Mechanics
- ✅ Judge0 integration for code execution
- ✅ Scoring system and leaderboards
- ✅ Problem management and test cases
- ✅ Real-time code synchronization

### Week 5-6: Advanced Features
- ✅ Matchmaking service with rating-based pairing
- ✅ AI bot opponents with configurable difficulty
- ✅ Spectator mode for live game viewing
- ✅ Chat system and social features

### Week 7-8: Production Readiness
- ✅ Docker containerization
- ✅ Security hardening (rate limiting, input validation)
- ✅ Performance optimization (Redis adapter, caching)
- ✅ Comprehensive error handling

### Week 9-10: Testing & Deployment
- ✅ Unit and integration tests
- ✅ Load testing and performance benchmarks
- ✅ CI/CD pipeline setup
- ✅ Production deployment guides

### Week 11-12: Monitoring & Scaling
- ✅ Health checks and monitoring
- ✅ Logging and error tracking
- ✅ Horizontal scaling configuration
- ✅ Documentation and maintenance guides

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile

### Game Management
- `GET /api/games/history` - User's game history
- `GET /api/games/:gameId` - Specific game details
- `GET /api/games/leaderboard/top` - Top players ranking
- `GET /api/games/active/list` - Currently active games

### Problem Management
- `GET /api/problems` - List available problems
- `GET /api/problems/:id` - Specific problem details
- `GET /api/problems/meta/info` - Categories and metadata

## 🔌 Socket.io Events

### Client → Server
- `joinQueue` - Join matchmaking queue
- `leaveQueue` - Leave matchmaking queue
- `joinGame` - Join specific game room
- `spectateGame` - Join game as spectator
- `submitCode` - Submit code solution
- `chatMessage` - Send chat message
- `codeUpdate` - Real-time code changes

### Server → Client
- `queueJoined` - Queue join confirmation
- `queueLeft` - Queue leave confirmation
- `gameState` - Current game state
- `gameStarting` - Game countdown begins
- `gameStarted` - Game officially starts
- `gameEnded` - Game completion with results
- `submissionResult` - Code submission feedback
- `chatMessage` - Incoming chat message
- `playerCodeUpdate` - Real-time code updates

## 🗄️ Database Schema

### Users Collection
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  rating: Number,
  gamesPlayed: Number,
  gamesWon: Number,
  isOnline: Boolean,
  profile: {
    avatar: String,
    bio: String,
    preferredLanguages: [String]
  }
}
```

### Games Collection
```javascript
{
  gameId: String,
  problemId: ObjectId,
  players: [{
    userId: ObjectId,
    username: String,
    rating: Number,
    isBot: Boolean
  }],
  status: String,
  submissions: [{
    playerId: ObjectId,
    code: String,
    language: String,
    result: Object
  }],
  finalScores: [Object]
}
```

### Problems Collection
```javascript
{
  title: String,
  description: String,
  difficulty: String,
  category: String,
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: Boolean,
    weight: Number
  }],
  starterCode: Object,
  solution: Object
}
```

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with expiration
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation and sanitization

### Code Execution Security
- Sandboxed execution via Judge0
- Hidden test cases to prevent cheating
- Input/output size limits
- Execution time and memory constraints

### Network Security
- CORS configuration
- Helmet.js security headers
- Request size limits
- Socket.io authentication middleware

## 📈 Performance & Scaling

### Caching Strategy
- Redis for session storage
- Socket.io adapter for multi-instance scaling
- Database query optimization with indexes

### Load Balancing
- Sticky sessions for Socket.io
- Horizontal scaling with Docker Swarm/Kubernetes
- Database read replicas

### Monitoring
- Health check endpoints
- Error logging and tracking
- Performance metrics collection
- Resource usage monitoring

## 🧪 Testing Strategy

### Unit Tests
- Model validation tests
- Service layer tests  
- Utility function tests
- Authentication middleware tests

### Integration Tests
- API endpoint tests
- Socket.io event tests
- Database operation tests
- Judge0 integration tests

### Load Tests
- Concurrent user simulation
- Matchmaking stress tests
- Real-time message throughput
- Database performance under load

## 📦 Deployment Options

### Local Development
```bash
npm run dev
```

### Docker Compose (Production)
```bash
docker-compose up -d
```

### Cloud Deployment
- AWS ECS/Fargate
- Google Cloud Run
- DigitalOcean App Platform
- Heroku (with Redis/MongoDB add-ons)

## 🛠️ Configuration

### Environment Variables
```env
# Server
PORT=3001
NODE_ENV=production
JWT_SECRET=your-secret-key

# Database
MONGODB_URI=mongodb://localhost:27017/coding-game
REDIS_URL=redis://localhost:6379

# External Services
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-api-key

# Client
CLIENT_URL=http://localhost:5173
```

### Docker Configuration
- Multi-stage builds for optimization
- Health checks for service monitoring
- Volume mounts for persistent data
- Network isolation for security

## 🎮 Game Flow

1. **Authentication** - User registers/logs in
2. **Matchmaking** - Join queue with preferences
3. **Game Creation** - System pairs compatible players
4. **Problem Assignment** - Random problem based on difficulty
5. **Live Coding** - Real-time code editing and submission
6. **Judging** - Automated testing against hidden test cases
7. **Scoring** - Live score updates and final rankings
8. **Results** - Rating updates and game history

## 🤖 AI Bot System

### Bot Personalities
- **SpeedCoder** - Fast but less accurate
- **Perfectionist** - Slow but highly accurate
- **Rookie** - Beginner-level performance
- **Veteran** - Advanced problem-solving skills

### Bot Behavior
- Realistic typing simulation
- Strategic submission timing
- Difficulty-adjusted accuracy
- Human-like error patterns

## 👥 Spectator Features

- Live code viewing for all players
- Real-time score updates
- Chat participation
- Game history access
- Performance analytics

## 📊 Analytics & Insights

### Player Analytics
- Rating progression tracking
- Problem category performance
- Time-based improvement metrics
- Head-to-head statistics

### Game Analytics
- Popular problem tracking
- Average completion times
- Success rate by difficulty
- Language usage statistics

## 🔧 Maintenance

### Regular Tasks
- Database backup and cleanup
- Log rotation and archiving
- Performance monitoring
- Security updates

### Scaling Considerations
- Database sharding strategies
- CDN integration for static assets
- Caching layer optimization
- Regional deployment planning

## 📚 Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Judge0 API Reference](https://ce.judge0.com/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [Redis Scaling Guide](https://redis.io/topics/cluster-tutorial)
- [Docker Production Guide](https://docs.docker.com/config/containers/resource_constraints/)

---

Built with ❤️ using modern web technologies for competitive programming excellence.