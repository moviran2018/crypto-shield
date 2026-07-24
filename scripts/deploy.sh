#!/bin/bash
# Crypto Shield - Deploy Script
# Usage: bash scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}

echo "🛡️ Crypto Shield - Deploy to $ENVIRONMENT"
echo "=========================================="

# Build frontend
echo ""
echo "🔨 Building frontend..."
cd apps/frontend
npm run build
cd ../..

# Deploy workers
echo ""
echo "🚀 Deploying Cloudflare Workers..."
npm run deploy:workers

echo ""
echo "✅ Deployment complete!"
