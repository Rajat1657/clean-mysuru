#!/bin/bash

# Terminate any previous background instances
pkill -9 -f "server.py" 2>/dev/null || true
pkill -9 -f "mysuru_clean_vision" 2>/dev/null || true

WS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WS_DIR"

echo "=========================================================="
echo "  🏙️ MYSURU CLEAN VISION : MASTER SYSTEM LAUNCHER"
echo "=========================================================="

# 1. Source ROS 2 workspace
if [ -f "/opt/ros/humble/setup.bash" ]; then
    source /opt/ros/humble/setup.bash
elif [ -f "/opt/ros/rolling/setup.bash" ]; then
    source /opt/ros/rolling/setup.bash
fi

source "$WS_DIR/install/setup.bash"

# Cleanup trap to kill all child background processes on Ctrl+C (SIGINT)
trap 'echo "\n[SYSTEM LAUNCHER] Shutting down all processes cleanly..."; kill 0; exit' SIGINT SIGTERM EXIT

# 2. Launch HTTP API Server (Port 5000)
echo "[1/3] Launching HTTP API Backend Server (Port 5000)..."
python3 "$WS_DIR/src/mysuru_clean_vision/mysuru_clean_vision/server.py" &
API_PID=$!
sleep 1

# 3. Launch React Web Dashboard (Port 3000)
echo "[2/3] Launching Modern React Web Dashboard (http://localhost:3000)..."
cd "$WS_DIR/src/mysuru_clean_vision/web_dashboard"
npm run preview -- --port 3000 --host &
REACT_PID=$!
sleep 2

# 4. Launch ROS 2 Nodes (Video Publisher + Detection Node)
echo "[3/3] Launching ROS 2 Edge AI Vision Pipeline..."
cd "$WS_DIR"
ros2 launch mysuru_clean_vision demo.launch.py &
ROS_PID=$!

echo "=========================================================="
echo "  ✅ ALL 3 SYSTEMS OPERATIONAL!"
echo "  🌐 Open Web Dashboard: http://localhost:3000"
echo "  Press Ctrl+C anytime to stop all processes cleanly."
echo "=========================================================="

# Keep master script running until user presses Ctrl+C
wait
