// Mock sensor data API helpers
// Returns mock data for development

export async function getSensorData({ deviceId }: { deviceId: string }) {
  return {
    deviceId,
    batteryVoltage: 13.2,
    batteryPercent: 85,
    solarVoltage: 18.5,
    flowRate: 2.5,
    waterLevel: 'OK',
    pumpStatus: true,
    gsmSignal: 4,
    timestamp: new Date().toISOString()
  };
}

export async function getSensorDataHistory({ 
  deviceId, 
  limit = 24 
}: { 
  deviceId: string; 
  limit?: number; 
}) {
  return Array.from({ length: limit }, (_, i) => ({
    deviceId,
    batteryVoltage: 13.2 - Math.random() * 2,
    batteryPercent: 85 - Math.random() * 10,
    solarVoltage: 18.5 + Math.random() * 2,
    flowRate: 2.5 + Math.random() * 1,
    waterLevel: 'OK' as const,
    pumpStatus: true,
    gsmSignal: 4,
    timestamp: new Date(Date.now() - i * 3600000).toISOString()
  }));
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
    // Mock: In production, this would POST to the API
    console.log('Mock sensor data submission:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error with mock sensor data:', error);
    throw error;
  }
}
