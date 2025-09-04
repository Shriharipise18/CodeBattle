# Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Local Development
```bash
# Clone repository
git clone <your-repo>
cd multiplayer-coding-game

# Start services
docker-compose up -d

# Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Option 2: Production Deployment
```bash
# Deploy to production
./deployment/deploy.sh production

# Monitor deployment
kubectl get pods -n coding-game -w
```

### Option 3: Cloud Platforms

#### AWS ECS Deployment
```bash
# Build and push images
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-west-2.amazonaws.com

docker build -t coding-game-server .
docker tag coding-game-server:latest <account>.dkr.ecr.us-west-2.amazonaws.com/coding-game-server:latest
docker push <account>.dkr.ecr.us-west-2.amazonaws.com/coding-game-server:latest

# Deploy ECS service
aws ecs update-service --cluster coding-game --service coding-game-server --force-new-deployment
```

#### Google Cloud Run Deployment  
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/coding-game-server
gcloud run deploy coding-game-server --image gcr.io/PROJECT-ID/coding-game-server --platform managed --region us-central1
```

## 🔧 Environment Configuration

### Required Environment Variables

**Backend (.env)**:
```env
# Server
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-at-least-256-bits

# Database
MONGODB_URI=mongodb://username:password@host:port/database
REDIS_URL=redis://username:password@host:port

# External Services  
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-judge0-api-key

# Client
CLIENT_URL=https://yourdomain.com

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

**Frontend (.env.production)**:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_ENVIRONMENT=production
```

## 🐳 Docker Deployment

### Development Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    ports: ["27017:27017"]
    
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    
  server:
    build: ./server
    ports: ["3001:3001"]
    depends_on: [mongodb, redis]
    
  client:
    build: .
    ports: ["5173:5173"]
    depends_on: [server]
```

### Production Setup
```yaml
# docker-compose.prod.yml  
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    
  server:
    build:
      context: .
      dockerfile: server/Dockerfile.prod
    deploy:
      replicas: 3
      
  mongodb:
    image: mongo:7.0
    deploy:
      replicas: 3
      
  redis:
    image: redis:7-alpine
    deploy:
      replicas: 2
```

## ☸️ Kubernetes Deployment

### Prerequisites
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Configure cluster access
kubectl config set-context --current --namespace=coding-game
```

### Deployment Steps
```bash
# 1. Create namespace
kubectl apply -f deployment/kubernetes/namespace.yaml

# 2. Create secrets (update with your values)
kubectl apply -f deployment/kubernetes/secrets.yaml

# 3. Deploy databases
kubectl apply -f deployment/kubernetes/mongodb-deployment.yaml
kubectl apply -f deployment/kubernetes/redis-deployment.yaml

# 4. Wait for databases
kubectl wait --for=condition=ready pod -l app=mongodb -n coding-game --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n coding-game --timeout=300s

# 5. Deploy application
kubectl apply -f deployment/kubernetes/app-deployment.yaml

# 6. Monitor deployment
kubectl get pods -n coding-game -w
kubectl logs -f deployment/coding-game-server -n coding-game
```

## 🌐 Cloud Platform Specific Deployments

### AWS ECS with Fargate
```json
{
  "family": "coding-game-server",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [{
    "name": "server",
    "image": "your-account.dkr.ecr.region.amazonaws.com/coding-game-server:latest",
    "portMappings": [{
      "containerPort": 3001,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "PORT", "value": "3001"}
    ],
    "secrets": [
      {
        "name": "JWT_SECRET",
        "valueFrom": "arn:aws:secretsmanager:region:account:secret:coding-game-secrets"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/coding-game-server",
        "awslogs-region": "us-west-2",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
```

### Google Cloud Platform
```yaml
# app.yaml for App Engine
runtime: nodejs18
env: standard
instance_class: F2

env_variables:
  NODE_ENV: production
  MONGODB_URI: mongodb+srv://username:password@cluster.mongodb.net/database
  REDIS_URL: redis://redis-host:6379

automatic_scaling:
  min_instances: 2
  max_instances: 10
  target_cpu_utilization: 0.7
```

### DigitalOcean App Platform
```yaml
# .do/app.yaml
name: coding-game-platform
region: nyc1

services:
- name: server
  source_dir: server
  github:
    repo: your-username/coding-game
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 2
  instance_size_slug: basic-s
  envs:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    value: ${JWT_SECRET}
    type: SECRET
  
- name: client
  source_dir: /
  github:
    repo: your-username/coding-game
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-s

databases:
- name: mongodb
  engine: MONGODB
  version: "6"
  size: basic-xs
  
- name: redis
  engine: REDIS
  version: "7"
  size: basic-xs
```

## 🔍 Health Checks & Monitoring

### Health Check Endpoints
```javascript
// Backend health check
GET /health
Response: {
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "connections": {
    "mongodb": "connected",
    "redis": "connected"
  },
  "memory": {
    "used": "256MB",
    "free": "768MB"
  }
}

// Detailed health check
GET /health/detailed
Response: {
  "services": {
    "database": { "status": "healthy", "latency": "5ms" },
    "redis": { "status": "healthy", "latency": "2ms" },
    "judge0": { "status": "healthy", "latency": "100ms" }
  },
  "metrics": {
    "activeGames": 42,
    "playersOnline": 156,
    "queueLength": 8
  }
}
```

### Monitoring Setup
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
- job_name: 'coding-game'
  static_configs:
  - targets: ['localhost:3001']
  metrics_path: /metrics
  
- job_name: 'mongodb'
  static_configs:
  - targets: ['mongodb-exporter:9216']
  
- job_name: 'redis'
  static_configs:
  - targets: ['redis-exporter:9121']
```

## 📋 Pre-deployment Checklist

### Security
- [ ] Environment variables configured
- [ ] Secrets properly encrypted
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Input validation active

### Performance
- [ ] Database indexes created
- [ ] Connection pools configured
- [ ] Caching enabled
- [ ] Asset compression active
- [ ] CDN configured (if applicable)

### Monitoring
- [ ] Health checks configured
- [ ] Logging centralized
- [ ] Error tracking setup
- [ ] Performance monitoring active
- [ ] Alerting rules defined

### Backup & Recovery
- [ ] Database backup scheduled
- [ ] Disaster recovery plan
- [ ] Data retention policies
- [ ] Restore procedures tested

## 🛠️ Troubleshooting

### Common Issues

**Connection Refused**:
```bash
# Check service status
docker-compose ps
kubectl get pods -n coding-game

# Check logs
docker-compose logs server
kubectl logs deployment/coding-game-server -n coding-game
```

**Database Connection Issues**:
```bash
# Test MongoDB connection
docker exec -it mongodb-container mongosh "mongodb://localhost:27017/test"

# Test Redis connection  
docker exec -it redis-container redis-cli ping
```

**Socket.io Connection Problems**:
```bash
# Check WebSocket upgrade headers
curl -H "Upgrade: websocket" -H "Connection: Upgrade" http://localhost:3001/socket.io/

# Verify sticky sessions
curl -H "Cookie: io=session_id" http://localhost:3001/socket.io/
```

### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check database performance
db.collection.explain("executionStats").find(query)

# Monitor Redis performance
redis-cli --latency-history
```

## 📱 Mobile & Progressive Web App

### PWA Configuration
```json
// public/manifest.json
{
  "name": "CodeBattle Arena",
  "short_name": "CodeBattle",
  "description": "Real-time multiplayer coding platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#3B82F6",
  "orientation": "landscape-primary",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker (Optional)
```javascript
// public/sw.js
const CACHE_NAME = 'coding-game-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

This comprehensive deployment guide covers all aspects of running CodeBattle Arena in various environments, from local development to enterprise production deployments.