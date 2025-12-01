#!/bin/bash
# Local Development Script
# Starts the development server with local environment

echo "🚀 Starting Local Development..."
echo "================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "Please create .env.local from .env.example"
    exit 1
fi

# Copy local env
cp .env.local .env

# Start dev server
echo "Starting Vite dev server..."
npm run dev
