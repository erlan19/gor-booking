#!/bin/bash
set -e

# ── GOR Booking System — Quick Deploy ──
# Usage: ./deploy.sh [docker|railway|vps]

MODE=${1:-docker}
COMPOSE_FILE="docker-compose.yml"

echo "🚀 GOR Booking — Deploy Mode: $MODE"
echo ""

# ── 1. Docker Compose (Local/VPS) ──
if [ "$MODE" = "docker" ]; then
  echo "📦 Deploying with Docker Compose..."

  # Generate JWT secret if not set
  if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | xxd -p | tr -d '\n')
    echo "⚠️  Generated JWT_SECRET (save this for .env): ${JWT_SECRET:0:16}..."
  fi

  # Check for .env.production
  if [ ! -f .env.production ]; then
    echo "📝 No .env.production found — using defaults (not recommended for production)"
  fi

  # Stop existing containers
  docker compose -f $COMPOSE_FILE down 2>/dev/null || true

  # Build and start
  docker compose -f $COMPOSE_FILE up -d --build

  # Wait for health checks
  echo "⏳ Waiting for services to be healthy..."
  sleep 5
  docker compose -f $COMPOSE_FILE ps

  echo ""
  echo "✅ Deployed!"
  echo "   Frontend: http://localhost:80"
  echo "   Backend:  http://localhost:4000/api/v1/health"
  echo "   Database: localhost:5432"
  echo ""
  echo "📋 Logs: docker compose -f $COMPOSE_FILE logs -f backend"

# ── 2. Railway (PaaS) ──
elif [ "$MODE" = "railway" ]; then
  echo "🚂 Deploying to Railway..."

  # Check if railway CLI is installed
  if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install: npm i -g @railway/cli"
    exit 1
  fi

  # Check login
  if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    railway login
  fi

  # Initialize project
  railway init 2>/dev/null || true

  # Set environment variables
  echo "⚙️  Setting environment variables..."
  railway variables set JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | xxd -p | tr -d '\n')
  railway variables set MIDTRANS_IS_PRODUCTION=false
  railway variables set PORT=4000

  # Add PostgreSQL service
  echo "🗄️  Adding PostgreSQL service..."
  railway add --plugin postgresql 2>/dev/null || true

  # Deploy
  railway up

  echo ""
  echo "✅ Deployed to Railway!"
  railway domain 2>/dev/null || echo "   Set custom domain: railway domain"

# ── 3. VPS (Direct) ──
elif [ "$MODE" = "vps" ]; then
  echo "🖥️  VPS Deployment Guide:"
  echo ""
  echo "SSH into your VPS and run:"
  echo ""
  echo "  # Install dependencies"
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -"
  echo "  sudo apt install -y postgresql nginx nodejs npm"
  echo ""
  echo "  # Setup PostgreSQL"
  echo "  sudo -u postgres createuser -s root"
  echo "  sudo -u postgres createdb gor"
  echo ""
  echo "  # Clone & build"
  echo "  git clone <repo-url> && cd gor"
  echo "  npm install && cd frontend/gor-client && npm install && npm run build && cd ../.."
  echo ""
  echo "  # Configure"
  echo "  cp .env.production.example backend/gor-api/.env"
  echo "  # Edit backend/gor-api/.env with real values"
  echo ""
  echo "  # Setup Nginx"
  echo "  sudo cp nginx.production.conf /etc/nginx/sites-available/gor"
  echo "  sudo ln -s /etc/nginx/sites-available/gor /etc/nginx/sites-enabled/"
  echo "  sudo nginx -t && sudo systemctl restart nginx"
  echo ""
  echo "  # Setup PM2"
  echo "  cd backend/gor-api"
  echo "  npx prisma migrate deploy"
  echo "  npx prisma db push"
  echo "  pm2 start 'npx tsx src/index.ts' --name gor-api"
  echo "  pm2 startup && pm2 save"
  echo ""
  echo "  # SSL with Certbot"
  echo "  sudo apt install -y certbot python3-certbot-nginx"
  echo "  sudo certbot --nginx -d yourdomain.com"

else
  echo "❌ Unknown mode: $MODE"
  echo "Usage: ./deploy.sh [docker|railway|vps]"
  exit 1
fi