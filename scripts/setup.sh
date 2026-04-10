#!/bin/bash
set -e

echo ""
echo "==================================="
echo "  Task Manager - Setup"
echo "==================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required. Install from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
echo "✓ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# Create .env if not exists
echo ""
if [ ! -f .env ]; then
    cp .env.example .env
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/generate-a-secret-here/$SECRET/" .env
    else
        sed -i "s/generate-a-secret-here/$SECRET/" .env
    fi
    echo "✓ Created .env with random NEXTAUTH_SECRET"
else
    echo "✓ .env already exists"
fi

# Detect LAN IP and configure NEXTAUTH_URL
echo ""
if [[ "$OSTYPE" == "darwin"* ]]; then
    LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
else
    LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
fi

echo "Detected network IP: $LAN_IP"
read -p "Use this IP for network access? (Y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Nn]$ ]]; then
    read -p "Enter the server IP address or hostname: " LAN_IP
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"http://$LAN_IP:3000\"|" .env
else
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"http://$LAN_IP:3000\"|" .env
fi
echo "✓ Network URL set to http://$LAN_IP:3000"

# Generate Prisma client and set up database
echo ""
echo "Setting up database..."
npx prisma generate
npx prisma db push
echo "✓ Database ready"

# Ask about seed data
echo ""
read -p "Load demo data? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma db seed
    echo "✓ Demo data loaded"
    echo "  Login: admin@taskmanager.com / password123"
fi

echo ""
echo "==================================="
echo "  Setup complete!"
echo ""
echo "  Development:  npm run dev"
echo "  Production:   ./scripts/start.sh"
echo ""
echo "  Access URL:   http://$LAN_IP:3000"
echo "==================================="
echo ""
