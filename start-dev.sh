#!/bin/bash

# Start development environment script for Nestup Web App

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Nestup Web App development environment...${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}No .env file found in root directory. Creating from example...${NC}"
  cp .env.example .env || echo -e "${RED}Failed to create .env file. Please create it manually.${NC}"
fi

# Check if backend .env file exists
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}No .env file found in backend directory. Creating from example...${NC}"
  cp backend/.env.example backend/.env || echo -e "${RED}Failed to create backend .env file. Please create it manually.${NC}"
fi

# Check if frontend .env.local file exists
if [ ! -f "frontend/.env.local" ]; then
  echo -e "${YELLOW}No .env.local file found in frontend directory. Creating from example...${NC}"
  cp frontend/.env.example frontend/.env.local || echo -e "${RED}Failed to create frontend .env.local file. Please create it manually.${NC}"
fi

# Start backend and frontend in separate terminals
echo -e "${GREEN}Starting backend server...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!

echo -e "${GREEN}Starting frontend server...${NC}"
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}Starting Strapi CMS...${NC}"
cd ../backend/cms && npm run develop &
STRAPI_PID=$!

# Function to handle script termination
function cleanup {
  echo -e "${YELLOW}Shutting down servers...${NC}"
  kill $BACKEND_PID
  kill $FRONTEND_PID
  kill $STRAPI_PID
  echo -e "${GREEN}Servers stopped.${NC}"
  exit 0
}

# Register the cleanup function for when script receives SIGINT (Ctrl+C)
trap cleanup SIGINT

# Keep script running
echo -e "${GREEN}Development environment is running. Press Ctrl+C to stop.${NC}"
wait
