// ==================== //
// Door Status Manager
// ==================== //

class DoorStatusManager {
    constructor() {
        this.doorStatus = document.querySelector('.door-status');
        this.stateText = document.querySelector('.door-status__state');
        this.message = document.querySelector('.door-status__message');
        this.lastUpdated = document.querySelector('.detail-item__value');
        this.init();
    }

    init() {
        // Initialize the sensor reading simulation
        this.startSensorSimulation();
        
        // Set initial timestamp to current time
        this.updateTimestamp();
    }

    updateDoorStatus(isOpen, timestamp = null) {
        if (isOpen) {
            this.doorStatus.classList.remove('door-status--open');
            this.doorStatus.classList.add('door-status--closed');
            this.stateText.textContent = 'Closed';
            this.message.textContent = 'Door is securely closed';
        } else {
            this.doorStatus.classList.remove('door-status--closed');
            this.doorStatus.classList.add('door-status--open');
            this.stateText.textContent = 'Open';
            this.message.textContent = 'Door is currently open';
        }
        
        this.updateTimestamp(timestamp);
    }

    updateTimestamp(timestamp = null) {
        const date = timestamp ? new Date(timestamp) : new Date();
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        this.lastUpdated.textContent = time;
    }

    setConnectingStatus() {
        this.doorStatus.classList.remove('door-status--open', 'door-status--closed');
        this.stateText.textContent = 'Connecting...';
        this.message.textContent = 'Establishing connection to sensor';
    }

    setWiFiConnectingStatus() {
        this.doorStatus.classList.remove('door-status--open', 'door-status--closed');
        this.stateText.textContent = 'Connecting...';
        this.message.textContent = 'Connecting to WiFi network';
    }

    setMQTTConnectingStatus() {
        this.doorStatus.classList.remove('door-status--open', 'door-status--closed');
        this.stateText.textContent = 'Connecting...';
        this.message.textContent = 'Connecting to MQTT broker';
    }

    // Toggle method for manual testing
    toggleDoor() {
        const isCurrentlyOpen = this.doorStatus.classList.contains('door-status--open');
        this.updateDoorStatus(!isCurrentlyOpen);
    }

    // Connect to real-time sensor data via Server-Sent Events
    startSensorSimulation() {
        console.log('🔌 Connecting to sensor stream...');
        
        // Show connecting status
        this.setConnectingStatus();
        
        // Fetch initial state
        this.fetchCurrentState();
        
        // Connect to SSE stream for real-time updates
        this.connectToStream();
    }
    
    async fetchCurrentState() {
        try {
            const response = await fetch('http://localhost:3000/api/door/status');
            const data = await response.json();
            this.updateDoorStatus(data.isOpen, data.lastUpdated);
            console.log('✓ Initial state loaded:', data);
        } catch (error) {
            console.error('✗ Failed to fetch initial state:', error);
        }
    }
    
    connectToStream() {
        const eventSource = new EventSource('http://localhost:3000/api/door/stream');
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('📡 Real-time update:', data);
            
            // Handle connection status messages
            if (data.status === 'WIFI_CONNECTING') {
                this.setWiFiConnectingStatus();
            } else if (data.status === 'MQTT_CONNECTING') {
                this.setMQTTConnectingStatus();
            } else if (data.status === 'MQTT_DISCONNECTED') {
                this.setMQTTConnectingStatus();
            } else if (data.status === 'MQTT_CONNECTED') {
                // Connection restored, wait for door state
                console.log('✓ MQTT connected, awaiting sensor data...');
            } else if (data.hasOwnProperty('isOpen')) {
                // Normal door state update
                this.updateDoorStatus(data.isOpen, data.lastUpdated);
            }
        };
        
        eventSource.onerror = (error) => {
            console.error('✗ SSE Connection error:', error);
            this.setConnectingStatus();
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                console.log('🔄 Reconnecting...');
                this.connectToStream();
            }, 5000);
        };
        
        eventSource.onopen = () => {
            console.log('✓ Connected to real-time sensor stream');
        };
    }

    // Public method to update status from external sensor readings
    handleSensorReading(sensorData) {
        if (typeof sensorData === 'object') {
            if (sensorData.status === 'WIFI_CONNECTING') {
                this.setWiFiConnectingStatus();
            } else if (sensorData.status === 'MQTT_CONNECTING' || sensorData.status === 'MQTT_DISCONNECTED') {
                this.setMQTTConnectingStatus();
            } else if (sensorData.hasOwnProperty('isOpen')) {
                this.updateDoorStatus(sensorData.isOpen, sensorData.lastUpdated);
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const doorManager = new DoorStatusManager();
    
    // Make it globally accessible for sensor integration
    window.doorManager = doorManager;
    
    // Example of how to use it with sensor readings:
    // window.doorManager.handleSensorReading({ isOpen: true });
});
