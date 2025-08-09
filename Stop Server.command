#!/bin/bash
cd "$(dirname "$0")"

echo "Stopping YTloader server..."

# Stop the PM2 process
pm2 delete ytloader 2>/dev/null && echo "Stopped YTloader server" || echo "No running YTloader server found"

# Save the PM2 process list
pm2 save 2>/dev/null

echo ""
echo "Server has been stopped."
echo "To check status: pm2 status"

# Keep the terminal open for a moment to see the message
sleep 2
