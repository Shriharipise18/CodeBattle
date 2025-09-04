#!/bin/bash

# Production deployment script for CodeBattle Arena
set -e

echo "🚀 Starting CodeBattle Arena deployment..."

# Configuration
ENVIRONMENT=${1:-production}
BUILD_VERSION=$(date +%Y%m%d-%H%M%S)
DOCKER_REGISTRY=${DOCKER_REGISTRY:-your-registry.com}
APP_NAME="coding-game"

echo "📋 Deployment Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Version: $BUILD_VERSION"
echo "  Registry: $DOCKER_REGISTRY"
echo ""

# Build images
echo "🏗️  Building Docker images..."
docker build -t $DOCKER_REGISTRY/$APP_NAME-server:$BUILD_VERSION -f server/Dockerfile.prod .
docker build -t $DOCKER_REGISTRY/$APP_NAME-client:$BUILD_VERSION -f Dockerfile.prod .

echo "✅ Images built successfully"

# Push to registry
if [ "$ENVIRONMENT" = "production" ]; then
  echo "📤 Pushing images to registry..."
  docker push $DOCKER_REGISTRY/$APP_NAME-server:$BUILD_VERSION
  docker push $DOCKER_REGISTRY/$APP_NAME-client:$BUILD_VERSION
  echo "✅ Images pushed successfully"
fi

# Deploy based on environment
case $ENVIRONMENT in
  "local")
    echo "🐳 Starting local deployment..."
    docker-compose -f docker-compose.yml up -d
    ;;
    
  "staging")
    echo "🎭 Starting staging deployment..."
    docker-compose -f deployment/docker-compose.staging.yml up -d
    ;;
    
  "production")
    echo "🚀 Starting production deployment..."
    
    # Update Kubernetes manifests with new image tags
    sed -i "s/:latest/:$BUILD_VERSION/g" deployment/kubernetes/*.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f deployment/kubernetes/namespace.yaml
    kubectl apply -f deployment/kubernetes/secrets.yaml
    kubectl apply -f deployment/kubernetes/configmap.yaml
    kubectl apply -f deployment/kubernetes/mongodb-deployment.yaml
    kubectl apply -f deployment/kubernetes/redis-deployment.yaml
    kubectl apply -f deployment/kubernetes/app-deployment.yaml
    
    # Wait for deployment to complete
    kubectl rollout status deployment/coding-game-server -n coding-game
    
    echo "✅ Production deployment completed"
    ;;
    
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# Health check
echo "🏥 Performing health check..."
sleep 10

if [ "$ENVIRONMENT" = "local" ]; then
  HEALTH_URL="http://localhost:3001/health"
else
  HEALTH_URL="https://api.yourdomain.com/health"
fi

if curl -f $HEALTH_URL > /dev/null 2>&1; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "📍 Application URLs:"

case $ENVIRONMENT in
  "local")
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:3001"
    echo "  MongoDB:  mongodb://localhost:27017"
    echo "  Redis:    redis://localhost:6379"
    ;;
  "production")
    echo "  Frontend: https://yourdomain.com"
    echo "  Backend:  https://api.yourdomain.com"
    echo "  Monitoring: https://grafana.yourdomain.com"
    ;;
esac

echo ""
echo "📚 Next steps:"
echo "  1. Run health checks: ./scripts/health-check.sh"
echo "  2. Run integration tests: npm run test"
echo "  3. Monitor logs: docker-compose logs -f"
echo "  4. Scale if needed: docker-compose up -d --scale server=3"