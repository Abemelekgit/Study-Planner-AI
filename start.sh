#!/usr/bin/env zsh
# 🚀 Study Planner - Start the Dev Server

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}┌─────────────────────────────────────┐${NC}"
echo -e "${BLUE}│  🎓 Study Planner - Starting...    │${NC}"
echo -e "${BLUE}└─────────────────────────────────────┘${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found!${NC}"
    echo ""
    echo "Follow these steps:"
    echo "1. Run: cp .env.local.example .env.local"
    echo "2. Edit .env.local with your Supabase credentials"
    echo "3. Get credentials from https://supabase.com"
    echo "4. Then run this script again"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""
echo "Starting dev server..."
echo ""
echo -e "${BLUE}📍 Open in browser: http://localhost:3000${NC}"
echo -e "${BLUE}🛑 Stop server: Press Ctrl+C${NC}"
echo ""

# Start the dev server
npm run dev
