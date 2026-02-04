// Webhook endpoint to receive MQTT messages from HiveMQ Cloud or similar service
// Configure your MQTT broker to send HTTP POST requests to this endpoint

let doorState = {
    isOpen: false,
    status: 'CLEAR',
    lastUpdated: new Date().toISOString()
};

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Parse incoming MQTT data
        // Adjust based on your MQTT broker's webhook format
        const { message, payload, topic, status } = req.body;
        
        // Extract the actual status from the payload
        const mqttStatus = payload || message || status || '';
        
        console.log('Webhook received:', { mqttStatus, body: req.body });
        
        // Update door state
        doorState = {
            isOpen: mqttStatus === 'DETECTED',
            status: mqttStatus.toString(),
            lastUpdated: new Date().toISOString()
        };
        
        return res.status(200).json({ 
            success: true, 
            message: 'State updated',
            state: doorState 
        });
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ 
            error: 'Failed to process webhook',
            details: error.message 
        });
    }
}
