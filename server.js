const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MQTT Configuration
const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC = 'home/ir/state';

// Connect to MQTT broker
const mqttClient = mqtt.connect(MQTT_BROKER);

// Store current door state
let currentDoorState = {
    isOpen: false,
    status: 'CLEAR',
    lastUpdated: new Date().toISOString()
};

// Array to store SSE clients
let sseClients = [];

mqttClient.on('connect', () => {
    console.log('✓ Connected to MQTT broker');
    mqttClient.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
            console.log(`✓ Subscribed to topic: ${MQTT_TOPIC}`);
        } else {
            console.error('✗ Subscription error:', err);
        }
    });
});

mqttClient.on('message', (topic, message) => {
    const status = message.toString();
    console.log(`📡 MQTT message received: ${status}`);
    
    // Update current state
    currentDoorState = {
        isOpen: status === 'DETECTED',
        status: status,
        lastUpdated: new Date().toISOString()
    };
    
    // Broadcast to all SSE clients
    broadcastToClients(currentDoorState);
});

mqttClient.on('error', (err) => {
    console.error('MQTT Error:', err);
});

// Broadcast state to all connected SSE clients
function broadcastToClients(data) {
    sseClients.forEach(client => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
    console.log(`📤 Broadcasted to ${sseClients.length} client(s)`);
}

// REST API Endpoints

// Get current door state
app.get('/api/door/status', (req, res) => {
    res.json(currentDoorState);
});

// Server-Sent Events endpoint for real-time updates
app.get('/api/door/stream', (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send initial state
    res.write(`data: ${JSON.stringify(currentDoorState)}\n\n`);
    
    // Add client to the list
    sseClients.push(res);
    console.log(`✓ New SSE client connected (Total: ${sseClients.length})`);
    
    // Remove client when connection closes
    req.on('close', () => {
        sseClients = sseClients.filter(client => client !== res);
        console.log(`✗ SSE client disconnected (Total: ${sseClients.length})`);
    });
});

// Manual control endpoint (for testing)
app.post('/api/door/test', (req, res) => {
    const { isOpen } = req.body;
    
    currentDoorState = {
        isOpen: isOpen,
        status: isOpen ? 'DETECTED' : 'CLEAR',
        lastUpdated: new Date().toISOString()
    };
    
    broadcastToClients(currentDoorState);
    res.json({ success: true, state: currentDoorState });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 MQTT Broker: ${MQTT_BROKER}`);
    console.log(`📢 Topic: ${MQTT_TOPIC}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    mqttClient.end();
    process.exit(0);
});
