#!/bin/bash

# Kill any process running on port 3000
echo "Checking for processes on port 3000..."

# For macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Find and kill process on port 3000
    PID=$(lsof -ti:3000)
    if [ ! -z "$PID" ]; then
        echo "Found process $PID running on port 3000. Killing it..."
        kill -9 $PID
        echo "Process killed successfully."
        sleep 1
    else
        echo "No process found on port 3000."
    fi
# For Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Find and kill process on port 3000
    PID=$(lsof -ti:3000)
    if [ ! -z "$PID" ]; then
        echo "Found process $PID running on port 3000. Killing it..."
        kill -9 $PID
        echo "Process killed successfully."
        sleep 1
    else
        echo "No process found on port 3000."
    fi
# For Windows (Git Bash/WSL)
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # For Windows, use netstat and taskkill
    PID=$(netstat -ano | grep :3000 | grep LISTENING | awk '{print $5}' | head -1)
    if [ ! -z "$PID" ]; then
        echo "Found process $PID running on port 3000. Killing it..."
        taskkill //PID $PID //F
        echo "Process killed successfully."
        sleep 1
    else
        echo "No process found on port 3000."
    fi
fi

echo "Starting development server..."
npm run dev:next