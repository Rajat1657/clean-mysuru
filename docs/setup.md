# ⚙️ Setup & Deployment Guide

## Prerequisites
- **Linux OS**: Ubuntu 22.04 LTS (recommended)
- **Node.js**: v18.x or higher
- **Python**: 3.10+ with `opencv-python`, `torch`, `ultralytics`
- **ROS 2**: Humble Hawksbill (optional for core React UI and REST server)

---

## Quick Start (One Command Launch)

Launch the complete application (Web Dashboard + Backend Server + Vision Engine Simulator) with a single command:

```bash
chmod +x start_all.sh
./start_all.sh
```

Once executed, open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## Manual Step-by-Step Setup

### 1. Web Dashboard
```bash
cd web_dashboard
npm install
npm run dev
```

### 2. Backend Server
```bash
cd mysuru_clean_vision
python3 server.py
```
