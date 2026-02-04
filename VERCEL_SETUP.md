# MQTT + Vercel Integration Guide

## Architecture

Your app is now configured to work with Vercel's serverless architecture:

- **Frontend**: Static HTML/CSS/JS served by Vercel
- **Backend**: Serverless API functions in `/api` folder
- **MQTT**: Webhook-based integration (no persistent connections)
- **Updates**: Client polls `/api/status` every 2 seconds

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### 2. Set Up MQTT Webhook

Since Vercel doesn't support persistent MQTT connections, configure your MQTT broker to send HTTP webhooks:

#### Option A: HiveMQ Cloud (Recommended)
1. Sign up at https://console.hivemq.cloud/
2. Create a free cluster
3. Go to **Extensions** → **Webhooks**
4. Add webhook:
   - **URL**: `https://your-app.vercel.app/api/webhook`
   - **Topic**: `home/ir/state`
   - **Method**: POST
   - **Headers**: `Content-Type: application/json`

#### Option B: Custom MQTT to HTTP Bridge
Run this bridge service on a server with persistent connection capability:

```javascript
// mqtt-bridge.js
const mqtt = require('mqtt');
const axios = require('axios');

const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const WEBHOOK_URL = 'https://your-app.vercel.app/api/webhook';

const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
    client.subscribe('home/ir/state');
    console.log('Bridge connected');
});

client.on('message', async (topic, message) => {
    try {
        await axios.post(WEBHOOK_URL, {
            topic,
            payload: message.toString(),
            timestamp: new Date().toISOString()
        });
        console.log('Forwarded to webhook:', message.toString());
    } catch (error) {
        console.error('Webhook error:', error.message);
    }
});
```

Deploy this bridge on Railway, Render, or any server that supports Node.js.

### 3. Test the Integration

```bash
# Test the status endpoint
curl https://your-app.vercel.app/api/status

# Test the webhook (simulate MQTT message)
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"payload": "DETECTED", "topic": "home/ir/state"}'

# Check updated status
curl https://your-app.vercel.app/api/status
```

## API Endpoints

- `GET /api/status` - Get current door state
- `POST /api/status` - Update door state (for testing)
- `POST /api/webhook` - Receive MQTT messages via HTTP webhook

## Local Development

For local development, you can still use the original `server.js`:

```bash
npm start
```

Or test the Vercel functions locally:

```bash
vercel dev
```

## Limitations

- **No real-time SSE**: Replaced with 2-second polling
- **No persistent MQTT**: Requires webhook bridge
- **Shared state**: In-memory state is per-function instance (consider Vercel KV for production)

## Production Recommendations

For production with high traffic, use **Vercel KV** for state persistence:

```bash
# Install Vercel KV
npm install @vercel/kv

# Update api/status.js and api/webhook.js to use KV instead of in-memory storage
```

See: https://vercel.com/docs/storage/vercel-kv
