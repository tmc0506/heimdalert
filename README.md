# Smart Door Monitoring System

A real-time door monitoring system using ESP32 IR sensor, MQTT, and a web interface.

## Architecture

```
ESP32 IR Sensor → MQTT Broker → Node.js Server → Web Interface
                  (HiveMQ)      (Express + SSE)   (HTML/CSS/JS)
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 3. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

## ESP32 Configuration

Your ESP32 is already configured to:
- Connect to WiFi: "Hidden Network"
- Publish to MQTT topic: `home/ir/state`
- Send "DETECTED" when door is open
- Send "CLEAR" when door is closed

## API Endpoints

### REST API

- **GET** `/api/door/status` - Get current door state
  ```json
  {
    "isOpen": false,
    "status": "CLEAR",
    "lastUpdated": "2026-02-04T10:30:00.000Z"
  }
  ```

- **GET** `/api/door/stream` - Server-Sent Events stream for real-time updates

- **POST** `/api/door/test` - Manual testing endpoint
  ```json
  {
    "isOpen": true
  }
  ```

## Testing Without ESP32

You can test the system manually using curl:

```bash
# Simulate door open
curl -X POST http://localhost:3000/api/door/test -H "Content-Type: application/json" -d "{\"isOpen\": true}"

# Simulate door closed
curl -X POST http://localhost:3000/api/door/test -H "Content-Type: application/json" -d "{\"isOpen\": false}"
```

## How It Works

1. **ESP32** reads IR sensor state and publishes to MQTT broker
2. **Node.js server** subscribes to MQTT topic and receives updates
3. **Server** broadcasts state changes to all connected web clients via SSE
4. **Web interface** updates in real-time with door status

## Features

- ✅ Real-time door status updates
- ✅ Mobile-first responsive design
- ✅ Glassmorphism UI
- ✅ Automatic reconnection on connection loss
- ✅ Manual toggle for testing
- ✅ Timestamp tracking

## Troubleshooting

**Server won't start:**
- Make sure port 3000 is available
- Check if dependencies are installed (`npm install`)

**No updates from ESP32:**
- Verify ESP32 is connected to WiFi
- Check MQTT broker is accessible
- Confirm topic name matches: `home/ir/state`

**Web interface shows no connection:**
- Ensure server is running
- Check browser console for errors
- Verify CORS is not blocking requests
