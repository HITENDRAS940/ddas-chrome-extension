#!/bin/bash
# DDAS Backend Independent Runner

DDAS_DIR="/Users/hitendrasingh/Desktop/DDAS"
BACKEND_PID_FILE="$DDAS_DIR/backend.pid"
BACKEND_LOG_FILE="$DDAS_DIR/backend.log"

cd "$DDAS_DIR"

# Function to start backend
start_backend() {
    if [ -f "$BACKEND_PID_FILE" ]; then
        local pid=$(cat "$BACKEND_PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Backend is already running (PID: $pid)"
            return 0
        else
            rm -f "$BACKEND_PID_FILE"
        fi
    fi

    echo "🚀 Starting Spring Boot Backend..."

    # Start backend in background
    ./mvnw spring-boot:run > "$BACKEND_LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$BACKEND_PID_FILE"

    echo "⏳ Backend starting... (PID: $pid)"
    echo "📋 Logs: tail -f $BACKEND_LOG_FILE"

    # Wait for backend to be ready
    echo "Waiting for backend to start..."
    for i in {1..60}; do
        sleep 2
        if curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
            echo "✅ Backend is ready and responding!"
            return 0
        fi
        echo -n "."
    done

    echo
    echo "⚠️ Backend may still be starting. Check logs: tail -f $BACKEND_LOG_FILE"
    return 0
}

# Function to stop backend
stop_backend() {
    if [ -f "$BACKEND_PID_FILE" ]; then
        local pid=$(cat "$BACKEND_PID_FILE")
        echo "🛑 Stopping backend (PID: $pid)..."
        kill $pid 2>/dev/null

        # Wait for graceful shutdown
        for i in {1..10}; do
            if ! ps -p $pid > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done

        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            echo "Force killing backend..."
            kill -9 $pid 2>/dev/null
        fi

        rm -f "$BACKEND_PID_FILE"
        echo "✅ Backend stopped"
    else
        echo "Backend is not running"
    fi
}

# Function to check status
check_status() {
    if [ -f "$BACKEND_PID_FILE" ]; then
        local pid=$(cat "$BACKEND_PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            echo "✅ Backend is running (PID: $pid)"

            # Test API
            if curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
                echo "✅ Backend API is responding"
            else
                echo "⚠️ Backend is running but API not responding"
            fi
            return 0
        else
            echo "❌ Backend is not running (stale PID file)"
            rm -f "$BACKEND_PID_FILE"
            return 1
        fi
    else
        echo "❌ Backend is not running"
        return 1
    fi
}

case "$1" in
    start)
        start_backend
        ;;
    stop)
        stop_backend
        ;;
    restart)
        stop_backend
        sleep 2
        start_backend
        ;;
    status)
        check_status
        ;;
    logs)
        echo "📋 Backend Logs (Ctrl+C to exit):"
        tail -f "$BACKEND_LOG_FILE"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo
        echo "Commands:"
        echo "  start   - Start the Spring Boot backend"
        echo "  stop    - Stop the Spring Boot backend"
        echo "  restart - Restart the Spring Boot backend"
        echo "  status  - Check if backend is running"
        echo "  logs    - Show live logs"
        exit 1
        ;;
esac
