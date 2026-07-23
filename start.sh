#!/usr/bin/env bash

set -Eeuo pipefail

# 1. PROJECT ROOT DETECTION
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  set +e
  echo ""
  echo "Shutting down frontend and backend processes..."

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "Stopping Frontend server (PID $FRONTEND_PID)..."
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping Backend server (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$FRONTEND_PID" ]]; then
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]]; then
    wait "$BACKEND_PID" 2>/dev/null || true
  fi

  echo "Frontend and Backend stopped cleanly."
  echo "Note: Database container/service was left untouched."
}

trap cleanup SIGINT SIGTERM EXIT

SEED_MODE=false

for arg in "$@"; do
  case "$arg" in
    --seed)
      SEED_MODE=true
      ;;
    --help|-h)
      echo "Employee Leave Management System - Local Startup Script"
      echo ""
      echo "Usage:"
      echo "  ./start.sh          Start backend and frontend services"
      echo "  ./start.sh --seed   Seed database with demo accounts before starting"
      echo "  ./start.sh --help   Show this help message"
      echo ""
      trap - EXIT
      exit 0
      ;;
    *)
      echo "Error: Unknown argument '$arg'"
      echo "Run './start.sh --help' for available options."
      trap - EXIT
      exit 1
      ;;
  esac
done

echo "=================================================="
echo " Starting Employee Leave Management System"
echo "=================================================="

# 2. TOOL VALIDATION
for tool in node npm curl; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: Required tool '$tool' is not installed or not in PATH."
    trap - EXIT
    exit 1
  fi
done

# 3. ENVIRONMENT FILE VALIDATION
if [[ ! -f "$PROJECT_ROOT/backend/.env" ]]; then
  echo "Error: Backend configuration missing at backend/.env"
  echo "Please create it by running:"
  echo "  cp backend/.env.example backend/.env"
  trap - EXIT
  exit 1
fi

if [[ ! -f "$PROJECT_ROOT/frontend/.env.local" ]]; then
  echo "Error: Frontend configuration missing at frontend/.env.local"
  echo "Please create it by running:"
  echo "  cp frontend/.env.local.example frontend/.env.local"
  trap - EXIT
  exit 1
fi

# Parse MONGODB_URI safely from backend/.env
RAW_MONGO_URI=$(grep -E '^[[:space:]]*MONGODB_URI=' "$PROJECT_ROOT/backend/.env" | cut -d '=' -f 2- | tr -d '"' | tr -d "'" | tr -d '\r')
MONGODB_URI="${RAW_MONGO_URI:-mongodb://127.0.0.1:27017/employee_leave_management}"

MONGO_HOST="127.0.0.1"
MONGO_PORT="27017"

if [[ "$MONGODB_URI" =~ mongodb://([^/:]+)(:([0-9]+))? ]]; then
  MONGO_HOST="${BASH_REMATCH[1]}"
  if [[ -n "${BASH_REMATCH[3]:-}" ]]; then
    MONGO_PORT="${BASH_REMATCH[3]}"
  fi
fi

IS_LOCAL=false
if [[ "$MONGO_HOST" == "127.0.0.1" || "$MONGO_HOST" == "localhost" || "$MONGO_HOST" == "0.0.0.0" ]]; then
  IS_LOCAL=true
fi

check_mongo_reachable() {
  if command -v nc >/dev/null 2>&1; then
    nc -z -w 3 "$MONGO_HOST" "$MONGO_PORT" >/dev/null 2>&1
  else
    node -e "
      const net = require('net');
      const socket = net.createConnection($MONGO_PORT, '$MONGO_HOST');
      socket.setTimeout(2000);
      socket.on('connect', () => { socket.end(); process.exit(0); });
      socket.on('error', () => { process.exit(1); });
      socket.on('timeout', () => { socket.destroy(); process.exit(1); });
    " >/dev/null 2>&1
  fi
}

# 4. MONGODB STARTUP LOGIC
if [[ "$IS_LOCAL" == "false" ]]; then
  echo "Using configured remote MongoDB database."
else
  echo "Checking local MongoDB reachability ($MONGO_HOST:$MONGO_PORT)..."
  if check_mongo_reachable; then
    echo "MongoDB is already running."
  else
    echo "MongoDB is not reachable. Checking Docker..."
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
      if docker inspect leave_mgmt_mongo >/dev/null 2>&1; then
        echo "Starting existing MongoDB Docker container (leave_mgmt_mongo)..."
        docker start leave_mgmt_mongo >/dev/null
      else
        echo "Creating and starting new MongoDB Docker container (leave_mgmt_mongo)..."
        docker run -d -p 27017:27017 --name leave_mgmt_mongo -v leave_mgmt_mongo_data:/data/db mongo:7 >/dev/null
      fi

      echo "Waiting for MongoDB to become ready..."
      MAX_WAIT=30
      ELAPSED=0
      until check_mongo_reachable || [[ $ELAPSED -ge $MAX_WAIT ]]; do
        sleep 1
        ELAPSED=$((ELAPSED + 1))
      done

      if ! check_mongo_reachable; then
        echo "Error: MongoDB container started but connection to $MONGO_HOST:$MONGO_PORT timed out."
        trap - EXIT
        exit 1
      fi
      echo "MongoDB container is ready."
    else
      echo "Error: Local MongoDB is not running on $MONGO_HOST:$MONGO_PORT and Docker is unavailable."
      echo "Please start your local MongoDB service or configure a remote MONGODB_URI in backend/.env"
      trap - EXIT
      exit 1
    fi
  fi
fi

# 5. DEPENDENCY CHECK
if [[ ! -d "$PROJECT_ROOT/backend/node_modules" ]]; then
  echo "Installing backend dependencies (node_modules missing)..."
  (cd "$PROJECT_ROOT/backend" && npm install)
fi

if [[ ! -d "$PROJECT_ROOT/frontend/node_modules" ]]; then
  echo "Installing frontend dependencies (node_modules missing)..."
  (cd "$PROJECT_ROOT/frontend" && npm install)
fi

# 6. OPTIONAL DATABASE SEEDING
if [[ "$SEED_MODE" == "true" ]]; then
  echo "Seeding database with demo records..."
  (cd "$PROJECT_ROOT/backend" && npm run seed)
  echo "Database seeded successfully."
fi

# 7. BACKEND STARTUP
echo "Starting Backend server on port 3001..."
(cd "$PROJECT_ROOT/backend" && npm run dev) &
BACKEND_PID=$!

echo "Waiting for Backend API to become reachable..."
MAX_WAIT_BE=20
ELAPSED_BE=0
BE_READY=false

until [[ $ELAPSED_BE -ge $MAX_WAIT_BE ]]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || true)
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "404" ]]; then
    BE_READY=true
    break
  fi
  sleep 1
  ELAPSED_BE=$((ELAPSED_BE + 1))
done

if [[ "$BE_READY" == "false" ]]; then
  echo "Error: Backend server failed to start or did not become reachable within ${MAX_WAIT_BE}s."
  trap - EXIT
  cleanup
  exit 1
fi

# 8. FRONTEND STARTUP
echo "Starting Frontend server on port 3010..."
(cd "$PROJECT_ROOT/frontend" && npm run dev -- -p 3010) &
FRONTEND_PID=$!

echo "Waiting for Frontend app to become reachable..."
MAX_WAIT_FE=20
ELAPSED_FE=0
FE_READY=false

until [[ $ELAPSED_FE -ge $MAX_WAIT_FE ]]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3010 || true)
  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "304" ]]; then
    FE_READY=true
    break
  fi
  sleep 1
  ELAPSED_FE=$((ELAPSED_FE + 1))
done

if [[ "$FE_READY" == "false" ]]; then
  echo "Error: Frontend server failed to start or did not become reachable within ${MAX_WAIT_FE}s."
  trap - EXIT
  cleanup
  exit 1
fi

# 9. TERMINAL OUTPUT
echo ""
echo "=================================================="
echo " Employee Leave Management System is running"
echo "=================================================="
echo ""
echo " Frontend:"
echo "   http://localhost:3010"
echo ""
echo " Backend API:"
echo "   http://localhost:3001/api"
echo ""
echo " Demo Manager:"
echo "   manager@example.com"
echo "   Manager@123"
echo ""
echo " Demo Employee:"
echo "   employee@example.com"
echo "   Employee@123"
echo ""
echo "Press Ctrl+C to stop frontend and backend."
echo "=================================================="
echo ""

wait
