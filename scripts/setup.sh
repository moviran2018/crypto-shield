#!/bin/bash
# Crypto Shield - Setup Script
# Usage: bash scripts/setup.sh

set -e

echo "🛡️ Crypto Shield v4.0 - Setup"
echo "================================"

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 20"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js >= 20 required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v)"

# Copy environment file if not exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your API keys"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build all packages
echo ""
echo "🔨 Building packages..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Run database migrations: npm run db:migrate"
echo "  3. Start development: npm run dev"
echo ""
echo "📖 See README.md for full documentation"
