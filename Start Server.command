#!/bin/bash
cd "$(dirname "$0")"

# Set Python path
export PATH="$(pwd)/node_modules/.bin:/opt/homebrew/bin:$PATH"

# Create python symlink if it doesn't exist
mkdir -p node_modules/.bin
ln -sf /opt/homebrew/bin/python3 node_modules/.bin/python 2>/dev/null || true

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 process manager..."
    npm install -g pm2
fi

# Start the server using PM2
echo "Starting server with PM2..."
pm2 delete ytloader 2>/dev/null || true  # Delete existing instance if any
pm2 start server.js --name ytloader --time --restart-delay=3000 --update-env

# Save PM2 process list
pm2 save

# Set PM2 to start on system boot
pm2 startup 2>/dev/null

# Open the server URL in the default browser
open "http://192.168.1.118:3050"

echo ""
echo "Server is running with PM2 process manager."
echo "To view logs: pm2 logs ytloader"
echo "To monitor: pm2 monit"
echo "To stop: ./stop_server.command"
