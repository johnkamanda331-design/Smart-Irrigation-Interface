// Temporary sensor data API helpers
// These will be replaced by generated client when running pnpm generate:api

// Get API base URL from environment or default to localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function getSensorData({ deviceId }: { deviceId: string }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sensor-data?deviceId=${encodeURIComponent(deviceId)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    throw error;
  }
}

export async function getSensorDataHistory({ 
  deviceId, 
  limit = 24 
}: { 
  deviceId: string; 
  limit?: number; 
}) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/sensor-data/history?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching sensor history:', error);
    throw error;
  }
}

export async function postSensorData(data: {
  deviceId: string;
  batteryVoltage: number;
  batteryPercent: number;
  solarVoltage: number;
  flowRate: number;
  waterLevel: 'OK' | 'LOW' | 'EMPTY';
  pumpStatus: boolean;
  gsmSignal: number;
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sensor-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Error posting sensor data:', error);
    throw error;
  }
}
