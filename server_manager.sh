#!/bin/bash
# DDAS HTTP Server Manager

DDAS_DIR="/Users/hitendrasingh/Desktop/DDAS"
PID_FILE="$DDAS_DIR/server.pid"
LOG_FILE="$DDAS_DIR/server.log"

cd "$DDAS_DIR"

case "$1" in
    start)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 $PID 2>/dev/null; then
                echo "✅ Server already running (PID: $PID)"
                echo "🌐 URL: http://localhost:5001"
                exit 0
            else
                rm -f "$PID_FILE"
            fi
        fi

        echo "🚀 Starting DDAS HTTP Server..."

        # Install Flask dependencies if needed
        python3 -c "import flask, flask_cors" 2>/dev/null || {
            echo "📦 Installing Flask dependencies..."
            pip3 install flask flask-cors requests
        }

        # Start server in background
        python3 server.py > "$LOG_FILE" 2>&1 &
        PID=$!
        echo $PID > "$PID_FILE"

        # Wait for server to start
        sleep 3

        # Verify server is running
        if curl -s http://localhost:5001/health >/dev/null 2>&1; then
            echo "✅ DDAS HTTP Server started successfully!"
            echo "🌐 Server URL: http://localhost:5001"
            echo "❤️ Health check: http://localhost:5001/health"
            echo "📋 Logs: tail -f $LOG_FILE"
            echo "🛑 Stop with: $0 stop"
        else
            echo "❌ Server failed to start properly"
            echo "📋 Check logs: cat $LOG_FILE"
        fi
        ;;

    stop)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            echo "🛑 Stopping server (PID: $PID)..."
            kill $PID 2>/dev/null
            sleep 2
            kill -9 $PID 2>/dev/null
            rm -f "$PID_FILE"
            echo "✅ Server stopped"
        else
            echo "❌ Server not running"
        fi

        # Also kill by process name
        pkill -f "python3 server.py" 2>/dev/null
        ;;

    status)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 $PID 2>/dev/null; then
                echo "✅ Server is running (PID: $PID)"

                # Test server health
                if curl -s http://localhost:5001/health >/dev/null 2>&1; then
                    echo "✅ Server is responding"
                    curl -s http://localhost:5001/health | python3 -m json.tool 2>/dev/null || echo "Health check successful"
                else
                    echo "⚠️ Server running but not responding"
                fi
                exit 0
            else
                echo "❌ Server not running (stale PID file)"
                rm -f "$PID_FILE"
            fi
        else
            echo "❌ Server is not running"
        fi
        exit 1
        ;;

    restart)
        $0 stop
        sleep 2
        $0 start
        ;;

    logs)
        if [ -f "$LOG_FILE" ]; then
            echo "📋 Server Logs (Ctrl+C to exit):"
            tail -f "$LOG_FILE"
        else
            echo "❌ No log file found"
        fi
        ;;

    test)
        echo "🧪 Testing server connection..."
        if curl -s http://localhost:5001/health >/dev/null 2>&1; then
            echo "✅ Server is accessible"
            curl -s http://localhost:5001/health | python3 -m json.tool
        else
            echo "❌ Server is not accessible"
            echo "💡 Try: $0 start"
        fi
        ;;

    *)
        echo "DDAS HTTP Server Manager"
        echo "Usage: $0 {start|stop|restart|status|logs|test}"
        echo
        echo "Commands:"
        echo "  start   - Start the HTTP server on port 5001"
        echo "  stop    - Stop the HTTP server"
        echo "  restart - Restart the HTTP server"
        echo "  status  - Check server status and health"
        echo "  logs    - View live server logs"
        echo "  test    - Test server connection"
        echo
        echo "URLs:"
        echo "  Health: http://localhost:5001/health"
        echo "  Process: http://localhost:5001/process (POST)"
        exit 1
        ;;
esac
