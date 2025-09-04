# CodeBattle Arena - Architecture Documentation

## 🏗️ System Architecture Overview

CodeBattle Arena is a scalable, real-time multiplayer coding platform built with modern technologies and production-ready practices.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Load Balancer (Nginx)                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   Server 1  │ │   Server 2  │ │   Server N  │
            │             │ │             │ │             │
            │ Express API │ │ Express API │ │ Express API │
            │ Socket.io   │ │ Socket.io   │ │ Socket.io   │
            └─────────────┘ └─────────────┘ └─────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                        ┌─────────────────────────┐
                        │       Redis Cluster     │
                        │   (Session Store +      │
                        │   Socket.io Adapter)    │
                        └─────────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────────┐
                        │    MongoDB Replica      │
                        │         Set             │
                        │ (Primary + Secondary)   │
                        └─────────────────────────┘
```

## 🧩 Component Architecture

### Backend Services

#### 1. API Server (Express.js)
- **Purpose**: RESTful API endpoints for user management, game data, and leaderboards
- **Key Features**:
  - JWT authentication with middleware
  - Request validation and sanitization
  - Rate limiting and security headers
  - Comprehensive error handling
  - API versioning support

#### 2. Real-time Engine (Socket.io)
- **Purpose**: Live game communication and updates
- **Key Features**:
  - Real-time matchmaking
  - Live code synchronization
  - Game state broadcasting
  - Spectator mode support
  - Chat functionality

#### 3. Game Controller
- **Purpose**: Core game logic and state management
- **Key Features**:
  - Game lifecycle management
  - Code submission processing
  - Score calculation and ranking
  - AI bot integration
  - Winner determination

#### 4. Matchmaking Service
- **Purpose**: Intelligent player pairing
- **Key Features**:
  - Rating-based matching
  - Queue management
  - Expandable rating range
  - Bot integration for solo players
  - Wait time optimization

### Frontend Architecture

#### 1. React Component Tree
```
App
├── AuthProvider
│   ├── Login/Register
│   └── Protected Routes
├── GameProvider
│   ├── Dashboard
│   ├── GameLobby
│   ├── GameInterface
│   └── Spectator
└── UI Components
    ├── Monaco Editor
    ├── Problem Panel
    ├── Chat Panel
    └── Status Components
```

#### 2. State Management
- **Context API**: Authentication and game state
- **Local State**: Component-specific data
- **Socket State**: Real-time updates
- **Persistent State**: Local storage for tokens

### Data Layer

#### 1. Database Design (MongoDB)

**Users Collection**:
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  rating: Number (default: 1200),
  gamesPlayed: Number,
  gamesWon: Number,
  isOnline: Boolean,
  lastSeen: Date,
  profile: {
    avatar: String,
    bio: String,
    preferredLanguages: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Games Collection**:
```javascript
{
  _id: ObjectId,
  gameId: String (unique),
  problemId: ObjectId (ref: Problem),
  players: [{
    userId: ObjectId (ref: User),
    username: String,
    rating: Number,
    isBot: Boolean,
    joinedAt: Date
  }],
  spectators: [{
    userId: ObjectId,
    username: String,
    joinedAt: Date
  }],
  status: String (enum),
  settings: {
    maxPlayers: Number,
    timeLimit: Number,
    difficultyLevel: String
  },
  submissions: [{
    playerId: ObjectId,
    code: String,
    language: String,
    result: {
      status: String,
      executionTime: Number,
      memory: Number,
      testsPassed: Number,
      totalTests: Number,
      score: Number,
      submissionTime: Date
    }
  }],
  startTime: Date,
  endTime: Date,
  winner: ObjectId (ref: User),
  finalScores: [{
    playerId: ObjectId,
    score: Number,
    completionTime: Number,
    submissions: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Problems Collection**:
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  difficulty: String (enum: easy|medium|hard),
  category: String (enum),
  constraints: {
    timeLimit: Number,
    memoryLimit: Number,
    inputSize: String
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: Boolean,
    weight: Number
  }],
  starterCode: {
    javascript: String,
    python: String,
    java: String,
    cpp: String,
    c: String
  },
  solution: {
    javascript: String,
    python: String,
    java: String,
    cpp: String,
    c: String
  },
  tags: [String],
  isActive: Boolean,
  createdBy: ObjectId (ref: User),
  usageStats: {
    timesUsed: Number,
    averageCompletionTime: Number,
    successRate: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Caching Strategy (Redis)
- **Session Storage**: User sessions and authentication
- **Socket.io Adapter**: Multi-instance communication
- **Matchmaking Queue**: Player queue state
- **Game Cache**: Active game states
- **Leaderboard Cache**: Frequently accessed rankings

## 🔒 Security Architecture

### Authentication & Authorization
1. **JWT Tokens**: Stateless authentication with 7-day expiration
2. **Password Hashing**: bcrypt with salt rounds
3. **Input Validation**: express-validator for all inputs
4. **Rate Limiting**: Multiple tiers based on endpoint sensitivity

### Code Execution Security
1. **Sandboxed Execution**: Judge0 API for isolated code running
2. **Hidden Test Cases**: Prevent solution reverse-engineering
3. **Resource Limits**: Time and memory constraints
4. **Input Sanitization**: Prevent injection attacks

### Network Security
1. **CORS Configuration**: Restricted origin access
2. **Security Headers**: Helmet.js implementation
3. **SSL/TLS**: HTTPS enforcement in production
4. **Request Size Limits**: Prevent DoS attacks

## 🚀 Deployment Architecture

### Development Environment
- **Docker Compose**: Local development with hot reload
- **Service Discovery**: Container networking
- **Volume Mounts**: Live code editing
- **Environment Variables**: Centralized configuration

### Staging Environment
- **Mirror Production**: Identical infrastructure setup
- **CI/CD Integration**: Automated testing and deployment
- **Feature Flags**: Safe feature rollouts
- **Performance Monitoring**: Load testing integration

### Production Environment
- **Kubernetes Orchestration**: Container management and scaling
- **High Availability**: Multi-replica deployments
- **Auto-scaling**: CPU/memory based scaling
- **Health Checks**: Automatic recovery and monitoring

## 📊 Scalability Considerations

### Horizontal Scaling
1. **Stateless Services**: Easy replication
2. **Load Balancing**: Nginx upstream configuration
3. **Session Affinity**: Sticky sessions for Socket.io
4. **Database Sharding**: MongoDB replica sets

### Performance Optimization
1. **Connection Pooling**: Database and Redis connections
2. **Query Optimization**: Indexed database queries
3. **Caching Layers**: Redis for frequently accessed data
4. **Asset Optimization**: CDN integration for static files

### Monitoring & Observability
1. **Application Metrics**: Prometheus + Grafana
2. **Error Tracking**: Centralized logging
3. **Performance Monitoring**: Response time tracking
4. **Resource Monitoring**: CPU, memory, disk usage

## 🔄 Data Flow

### Game Creation Flow
1. **Matchmaking**: Players join queue with preferences
2. **Pairing**: Algorithm matches compatible players
3. **Game Setup**: Create game instance with problem
4. **Notification**: Socket.io broadcasts game start
5. **State Sync**: All clients receive initial state

### Code Submission Flow
1. **Client Submission**: Player submits code via Socket.io
2. **Validation**: Server validates code and player state
3. **Execution**: Judge0 API runs code against test cases
4. **Scoring**: Calculate score and update game state
5. **Broadcast**: Real-time score updates to all participants

### Spectator Mode Flow
1. **Game Discovery**: List active games via API
2. **Join Request**: Spectator joins game room
3. **State Sync**: Receive current game state
4. **Live Updates**: Real-time code and score updates
5. **Chat Participation**: Join game communication

## 🧪 Testing Strategy

### Unit Testing
- **Models**: Database schema validation
- **Services**: Business logic testing
- **Utils**: Helper function testing
- **Middleware**: Authentication and validation

### Integration Testing
- **API Endpoints**: Full request/response cycles
- **Socket.io Events**: Real-time communication
- **Database Operations**: CRUD functionality
- **External Services**: Judge0 API integration

### Load Testing
- **Concurrent Users**: Multiple simultaneous players
- **Peak Load**: Maximum system capacity
- **Stress Testing**: Breaking point identification
- **Recovery Testing**: System resilience

### End-to-End Testing
- **User Flows**: Complete game sessions
- **Cross-browser**: Frontend compatibility
- **Mobile Responsive**: Touch device support
- **Network Conditions**: Various connection speeds

## 📈 Performance Benchmarks

### Target Metrics
- **API Response Time**: < 100ms (95th percentile)
- **Socket.io Latency**: < 50ms
- **Database Queries**: < 10ms average
- **Code Execution**: < 5s (depending on complexity)
- **System Uptime**: 99.9%

### Optimization Strategies
1. **Database Indexing**: Query optimization
2. **Connection Pooling**: Resource efficiency
3. **Caching Layers**: Reduced database load
4. **CDN Integration**: Global asset delivery
5. **Code Splitting**: Faster initial loads

This architecture provides a robust foundation for a competitive coding platform that can scale to thousands of concurrent users while maintaining low latency and high availability.