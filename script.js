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

    // Connect to real-time sensor data via polling (Vercel-compatible)
    startSensorSimulation() {
        console.log('🔌 Connecting to sensor...');
        
        // Show connecting status
        this.setConnectingStatus();
        
        // Fetch initial state
        this.fetchCurrentState();
        
        // Start polling for updates every 2 seconds
        this.startPolling();
    }
    
    async fetchCurrentState() {
        try {
            // Use relative path for Vercel deployment
            const response = await fetch('/api/status');
            const data = await response.json();
            this.updateDoorStatus(data.isOpen, data.lastUpdated);
            console.log('✓ State loaded:', data);
        } catch (error) {
            console.error('✗ Failed to fetch state:', error);
            this.setConnectingStatus();
        }
    }
    
    startPolling() {
        // Poll every 2 seconds for updates
        this.pollingInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                
                // Handle connection status messages
                if (data.status === 'WIFI_CONNECTING') {
                    this.setWiFiConnectingStatus();
                } else if (data.status === 'MQTT_CONNECTING') {
                    this.setMQTTConnectingStatus();
                } else if (data.status === 'MQTT_DISCONNECTED') {
                    this.setMQTTConnectingStatus();
                } else if (data.status === 'MQTT_CONNECTED') {
                    console.log('✓ MQTT connected, awaiting sensor data...');
                } else if (data.hasOwnProperty('isOpen')) {
                    // Normal door state update
                    this.updateDoorStatus(data.isOpen, data.lastUpdated);
                }
            } catch (error) {
                console.error('✗ Polling error:', error);
                this.setConnectingStatus();
            }
        }, 2000);
        
        console.log('✓ Polling started (2s interval)');
    }
    
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            console.log('✓ Polling stopped');
        }
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
