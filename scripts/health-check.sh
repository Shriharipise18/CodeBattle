#!/bin/bash

# Health check script for all services
set -e

ENVIRONMENT=${1:-local}
TIMEOUT=10

echo "🏥 Running health checks for $ENVIRONMENT environment..."

# Define endpoints based on environment
if [ "$ENVIRONMENT" = "local" ]; then
  BASE_URL="http://localhost:3001"
  FRONTEND_URL="http://localhost:5173"
  MONGO_URL="mongodb://localhost:27017"
  REDIS_URL="redis://localhost:6379"
else
  BASE_URL="https://api.yourdomain.com"
  FRONTEND_URL="https://yourdomain.com"
fi

# Check backend health
echo "🔍 Checking backend health..."
if curl -f -m $TIMEOUT $BASE_URL/health > /dev/null 2>&1; then
  echo "  ✅ Backend is healthy"
else
  echo "  ❌ Backend health check failed"
  exit 1
fi

# Check frontend
echo "🔍 Checking frontend..."
if curl -f -m $TIMEOUT $FRONTEND_URL > /dev/null 2>&1; then
  echo "  ✅ Frontend is accessible"
else
  echo "  ❌ Frontend health check failed"
  exit 1
fi

# Check API endpoints
echo "🔍 Checking API endpoints..."
endpoints=(
  "/api/problems/meta/info"
  "/api/games/active/list"
)

for endpoint in "${endpoints[@]}"; do
  if curl -f -m $TIMEOUT $BASE_URL$endpoint > /dev/null 2>&1; then
    echo "  ✅ $endpoint is responding"
  else
    echo "  ❌ $endpoint health check failed"
  fi
done

# Check database connections (local only)
if [ "$ENVIRONMENT" = "local" ]; then
  echo "🔍 Checking database connections..."
  
  # Check MongoDB
  if docker exec coding-game-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "  ✅ MongoDB is connected"
  else
    echo "  ❌ MongoDB connection failed"
  fi
  
  # Check Redis
  if docker exec coding-game-redis redis-cli ping | grep -q PONG; then
    echo "  ✅ Redis is connected"
  else
    echo "  ❌ Redis connection failed" 
  fi
fi

# Performance test
echo "🔍 Running performance test..."
start_time=$(date +%s%N)
curl -s $BASE_URL/health > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

echo "  ⚡ Response time: ${response_time}ms"

if [ $response_time -gt 1000 ]; then
  echo "  ⚠️  Response time is high (>1000ms)"
else
  echo "  ✅ Response time is good"
fi

echo ""
echo "🎉 Health check completed!"

# System resource check (local only)
if [ "$ENVIRONMENT" = "local" ]; then
  echo ""
  echo "📊 System Resources:"
  echo "  CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
  echo "  Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
  echo "  Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"
fi