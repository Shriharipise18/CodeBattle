# API Documentation

## 🔐 Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body**:
```json
{
  "username": "string (3-20 chars, alphanumeric + underscore)",
  "email": "string (valid email)",
  "password": "string (min 6 chars, 1 uppercase, 1 lowercase, 1 number)"
}
```

**Response**:
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "username": "username", 
    "email": "email",
    "rating": 1200,
    "gamesPlayed": 0,
    "gamesWon": 0
  }
}
```

### POST /api/auth/login
Authenticate existing user.

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response**: Same as register

### GET /api/auth/me
Get current user information (requires authentication).

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email", 
    "rating": 1200,
    "gamesPlayed": 5,
    "gamesWon": 3,
    "isOnline": true,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🎮 Game Management Endpoints

### GET /api/games/history
Get user's game history with pagination.

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 10, max: 50)

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "games": [
    {
      "gameId": "unique_game_id",
      "problemId": {
        "title": "Two Sum",
        "difficulty": "easy",
        "category": "arrays"
      },
      "players": [
        {
          "userId": "player_id",
          "username": "player_name"
        }
      ],
      "status": "finished",
      "winner": "player_id",
      "finalScores": [
        {
          "playerId": "player_id",
          "score": 85,
          "completionTime": 45000,
          "submissions": 3
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-01T00:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### GET /api/games/:gameId
Get specific game details.

**Headers**: `Authorization: Bearer <token>`

**Response**: Full game object with problem details, submissions, and results.

### GET /api/games/active/list
Get list of currently active games for spectating.

**Response**:
```json
[
  {
    "gameId": "active_game_id",
    "status": "in-progress",
    "players": [
      {
        "username": "player1",
        "rating": 1450,
        "isBot": false
      },
      {
        "username": "CodeBot_xyz", 
        "rating": 1200,
        "isBot": true
      }
    ],
    "problemId": {
      "title": "Binary Search",
      "difficulty": "medium"
    },
    "spectatorCount": 12,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/games/leaderboard/top
Get top players ranking.

**Query Parameters**:
- `limit`: number (default: 20, max: 100)
- `period`: string (all|month|week, default: all)

**Response**:
```json
[
  {
    "rank": 1,
    "username": "GrandMaster_Code",
    "rating": 2450,
    "gamesPlayed": 127,
    "winRate": 78
  },
  {
    "rank": 2,
    "username": "AlgorithmNinja",
    "rating": 2380,
    "gamesPlayed": 98,
    "winRate": 82
  }
]
```

## 📚 Problem Management Endpoints

### GET /api/problems
Get list of available problems with filtering.

**Query Parameters**:
- `difficulty`: string (easy|medium|hard)
- `category`: string (arrays|strings|dynamic-programming|etc.)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "problems": [
    {
      "_id": "problem_id",
      "title": "Two Sum",
      "description": "Find two numbers that add up to target...",
      "difficulty": "easy",
      "category": "arrays",
      "tags": ["hash-table", "array"],
      "usageStats": {
        "timesUsed": 1247,
        "averageCompletionTime": 180000,
        "successRate": 0.73
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### GET /api/problems/:id
Get specific problem details (sanitized - no solutions or hidden test cases).

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "_id": "problem_id",
  "title": "Two Sum",
  "description": "Given an array of integers nums and an integer target...",
  "difficulty": "easy",
  "category": "arrays",
  "constraints": {
    "timeLimit": 2000,
    "memoryLimit": 128,
    "inputSize": "1 <= nums.length <= 10^4"
  },
  "examples": [
    {
      "input": "[2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ],
  "starterCode": {
    "javascript": "function twoSum(nums, target) {\n    // Your code here\n    return [];\n}",
    "python": "def twoSum(nums, target):\n    # Your code here\n    return []"
  },
  "testCases": [
    {
      "input": "[2,7,11,15]\n9",
      "expectedOutput": "[0,1]",
      "isHidden": false,
      "weight": 1
    }
  ],
  "tags": ["hash-table", "array"]
}
```

### GET /api/problems/meta/info
Get problem categories and metadata.

**Response**:
```json
{
  "categories": ["arrays", "strings", "dynamic-programming", "graphs", "trees", "sorting"],
  "difficulties": ["easy", "medium", "hard"],
  "totalProblems": 150
}
```

## 🔌 Socket.io Events

### Client → Server Events

#### joinQueue
Join the matchmaking queue.
```json
{
  "difficulty": "easy|medium|hard",
  "gameMode": "ranked|casual|practice", 
  "language": "javascript|python|java|cpp|c"
}
```

#### leaveQueue
Leave the matchmaking queue.
```json
{}
```

#### joinGame
Join a specific game room.
```json
{
  "gameId": "string"
}
```

#### spectateGame
Join a game as spectator.
```json
{
  "gameId": "string"
}
```

#### submitCode
Submit code solution during game.
```json
{
  "gameId": "string",
  "code": "string",
  "language": "string"
}
```

#### chatMessage
Send chat message.
```json
{
  "gameId": "string",
  "message": "string"
}
```

#### codeUpdate
Send real-time code updates (for spectators).
```json
{
  "gameId": "string", 
  "code": "string",
  "cursorPosition": {
    "line": 10,
    "column": 5
  }
}
```

### Server → Client Events

#### queueJoined
Confirmation of queue join.
```json
{
  "position": 3,
  "estimatedWait": 15000
}
```

#### queueLeft
Confirmation of queue leave.
```json
{}
```

#### gameState
Current game state update.
```json
{
  "id": "game_id",
  "players": [
    {
      "userId": "player_id",
      "username": "player_name",
      "rating": 1450,
      "isBot": false
    }
  ],
  "status": "waiting|starting|in-progress|finished",
  "startTime": 1641024000000,
  "scores": {
    "player_id": 85
  },
  "problem": {
    "title": "Problem Title",
    "difficulty": "medium"
  }
}
```

#### gameStarting
Game countdown initialization.
```json
{
  "gameId": "game_id",
  "countdown": 5,
  "problem": {
    "title": "Two Sum",
    "description": "...",
    "examples": [...],
    "starterCode": {...}
  }
}
```

#### countdown
Countdown tick.
```json
{
  "count": 3
}
```

#### gameStarted
Game officially begins.
```json
{
  "gameId": "game_id",
  "startTime": 1641024000000,
  "timeLimit": 1800000
}
```

#### submissionResult
Code submission result.
```json
{
  "playerId": "player_id",
  "score": 85,
  "status": "accepted|wrong-answer|time-limit-exceeded|compilation-error|runtime-error",
  "executionTime": 245,
  "testsPassed": 8,
  "totalTests": 10,
  "timestamp": 1641024000000
}
```

#### submissionProcessed
Personal submission feedback.
```json
{
  "status": "accepted",
  "score": 100,
  "executionTime": 150,
  "memory": 45,
  "testsPassed": 10,
  "totalTests": 10,
  "results": [
    {
      "status": "accepted",
      "executionTime": 15,
      "memory": 8,
      "correct": true
    }
  ]
}
```

#### gameEnded
Game completion with final results.
```json
{
  "gameId": "game_id",
  "winner": "player_id",
  "finalScores": [
    {
      "playerId": "player_id",
      "username": "winner_name", 
      "score": 100,
      "completionTime": 300000,
      "submissions": 2
    }
  ],
  "endTime": 1641024000000
}
```

#### chatMessage
Incoming chat message.
```json
{
  "playerId": "sender_id",
  "username": "sender_name",
  "message": "Good luck!",
  "timestamp": 1641024000000
}
```

#### playerCodeUpdate
Real-time code updates from other players.
```json
{
  "playerId": "player_id",
  "username": "player_name",
  "code": "current_code_content",
  "cursorPosition": {
    "line": 15,
    "column": 8
  },
  "timestamp": 1641024000000
}
```

#### spectatorJoined
Spectator successfully joined game.
```json
{
  "gameId": "game_id",
  "gameState": {...},
  "spectatorCount": 15
}
```

#### spectatorUpdate
Spectator count update.
```json
{
  "count": 18
}
```

## ⚠️ Error Responses

### HTTP Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Invalid or missing token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Duplicate data (username/email)
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

### Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [
    {
      "field": "username",
      "message": "Username must be unique"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Socket.io Error Events
```json
// Connection error
{
  "type": "connection_error",
  "message": "Authentication failed"
}

// Game error
{
  "type": "game_error", 
  "message": "Game not found or already ended",
  "gameId": "game_id"
}

// Submission error
{
  "type": "submission_error",
  "message": "Code execution failed",
  "details": "Compilation error on line 5"
}
```

## 🔄 Rate Limiting

### Limits by Endpoint Type
- **Authentication**: 5 requests per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per IP  
- **Code Submission**: 10 submissions per minute per user
- **Socket.io**: 1000 events per minute per connection

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1641024900
Retry-After: 60
```

## 📊 Pagination

All list endpoints support pagination with consistent format:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔍 Search & Filtering

### Problem Search
```
GET /api/problems?search=binary&difficulty=medium&category=arrays&tags=sorting
```

### Game History Filtering
```
GET /api/games/history?status=finished&difficulty=hard&from=2024-01-01&to=2024-01-31
```

### Leaderboard Filtering
```
GET /api/games/leaderboard/top?period=month&minGames=10&maxRank=50
```

This API documentation provides comprehensive coverage of all available endpoints, ensuring developers can easily integrate with the CodeBattle Arena platform.