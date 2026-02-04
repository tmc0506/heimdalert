// Simple in-memory storage for door state
// In production, use Vercel KV or a database
let doorState = {
    isOpen: false,
    status: 'CLEAR',
    lastUpdated: new Date().toISOString()
};

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        // Return current door state
        return res.status(200).json(doorState);
    }
    
    if (req.method === 'POST') {
        // Update door state (for testing)
        const { isOpen, status } = req.body;
        
        doorState = {
            isOpen: isOpen !== undefined ? isOpen : doorState.isOpen,
            status: status || (isOpen ? 'DETECTED' : 'CLEAR'),
            lastUpdated: new Date().toISOString()
        };
        
        return res.status(200).json({ success: true, state: doorState });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}
