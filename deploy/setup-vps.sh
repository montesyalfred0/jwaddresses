#!/bin/bash
# Setup script for JW Addresses on Contabo VPS
# Run this script on the VPS after cloning the repo

set -e

echo "=== JW Addresses VPS Setup ==="

# Install prerequisites
echo "Installing prerequisites..."
sudo apt update && sudo apt install -y postgresql postgresql-contrib redis-server nginx curl

# Install Node.js via fnm
if ! command -v fnm &> /dev/null; then
    echo "Installing fnm..."
    curl -o- https://fnm.vercel.app/install | bash
    export PATH="$HOME/.fnm:$PATH"
    eval "$(fnm env)"
fi

fnm install 24 && fnm use 24
node --version

# Install PM2
echo "Installing PM2..."
npm install -g pm2

# Setup project directory
echo "Setting up project directory..."
sudo mkdir -p /var/www/jwaddresses
sudo chown $USER:$USER /var/www/jwaddresses

# Clone project (uncomment if not already cloned)
# cd /var/www/jwaddresses
# git clone https://github.com/tu-usuario/jwaddresses.git .

# Install backend dependencies
echo "Installing backend dependencies..."
cd /var/www/jwaddresses/backend
npm install --production

# Setup PostgreSQL
echo "Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE jwaddresses;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER jwapp WITH PASSWORD 'CHANGE_THIS_PASSWORD';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jwaddresses TO jwapp;"

echo ""
echo "=== MANUAL STEPS REQUIRED ==="
echo "1. Create root .env at /var/www/jwaddresses/.env:"
echo "   DB_USER=jwapp"
echo "   DB_NAME=jwaddresses"
echo "   DB_PASSWORD=your_secure_db_password"
echo "   REDIS_PASSWORD=your_secure_redis_password"
echo ""
echo "2. Create backend/.env from example:"
echo "   cp backend/.env.example backend/.env"
echo "   Edit JWT_SECRET, DB_PASSWORD and other variables:"
echo "   - Generate JWT_SECRET: openssl rand -hex 32"
echo ""
echo "3. Run database schema:"
echo "   psql -U jwapp -d jwaddresses -f backend/init.sql"
echo ""
echo "4. Copy nginx config:"
echo "   sudo cp deploy/nginx-jwaddresses.conf /etc/nginx/sites-available/jwaddresses"
echo "   sudo ln -sf /etc/nginx/sites-available/jwaddresses /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "5. Build frontend:"
echo "   cd /var/www/jwaddresses/frontend && npm install && npm run build"
echo ""
echo "6. Start backend with PM2:"
echo "   cd /var/www/jwaddresses/backend"
echo "   pm2 start src/index.js --name jwaddresses-api"
echo "   pm2 save"
echo "   pm2 startup  # follow the command it outputs"
echo ""
echo "=== Setup complete ==="
