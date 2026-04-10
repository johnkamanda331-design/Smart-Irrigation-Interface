import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSensorData, getSensorDataHistory, controlPump, setBaseUrl } from '@workspace/api-client-react';

const apiBaseUrl = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_BASE_URL ?? null : null;
if (apiBaseUrl) {
  setBaseUrl(apiBaseUrl);
}

export interface SensorData {
  batteryVoltage: number;
  batteryPercent: number;
  solarVoltage: number;
  flowRate: number;
  waterLevel: 'OK' | 'LOW' | 'EMPTY';
  pumpStatus: boolean;
  gsmSignal: number;
  deviceOnline: boolean;
  lastSyncTime: Date;
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  startTime: string;
  duration: number;
  days: string[];
  enabled: boolean;
}

export interface Settings {
  minWaterLevel: number;
  batteryCutoff: number;
  minFlowRate: number;
  alertBattery: boolean;
  alertFlow: boolean;
  alertWater: boolean;
  autoMode: boolean;
}

export interface HistoricalPoint {
  time: string;
  battery: number;
  solar: number;
  flow: number;
}

interface FarmContextType {
  sensorData: SensorData;
  alerts: Alert[];
  schedules: Schedule[];
  settings: Settings;
  history: HistoricalPoint[];
  unreadAlerts: number;
  togglePump: () => Promise<void>;
  toggleAutoMode: () => void;
  markAlertRead: (id: string) => void;
  clearAllAlerts: () => void;
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  refreshData: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

function generateHistory(): HistoricalPoint[] {
  const points: HistoricalPoint[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600000);
    const hour = t.getHours();
    const solarBase = hour >= 6 && hour <= 18
      ? Math.max(0, 12 * Math.sin(((hour - 6) / 12) * Math.PI))
      : 0;
    points.push({
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      battery: parseFloat((3.7 + Math.random() * 0.4 + (solarBase > 5 ? 0.05 : -0.02)).toFixed(2)),
      solar: parseFloat((solarBase + (Math.random() - 0.5)).toFixed(2)),
      flow: parseFloat((Math.random() > 0.3 ? 2.5 + Math.random() * 1.5 : 0).toFixed(2)),
    });
  }
  return points;
}

const INITIAL_SENSOR: SensorData = {
  batteryVoltage: 3.82,
  batteryPercent: 72,
  solarVoltage: 14.3,
  flowRate: 3.2,
  waterLevel: 'OK',
  pumpStatus: true,
  gsmSignal: 3,
  deviceOnline: true,
  lastSyncTime: new Date(),
};

const INITIAL_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Low Battery',
    message: 'Battery voltage dropped to 3.6V. Check solar panel.',
    timestamp: new Date(Date.now() - 1800000),
    read: false,
  },
  {
    id: '2',
    type: 'critical',
    title: 'Flow Interruption',
    message: 'No water flow detected for 5 minutes.',
    timestamp: new Date(Date.now() - 7200000),
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Irrigation Complete',
    message: 'Scheduled irrigation cycle completed successfully.',
    timestamp: new Date(Date.now() - 86400000),
    read: true,
  },
];

const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: '1',
    name: 'Morning Irrigation',
    startTime: '06:00',
    duration: 30,
    days: ['Mon', 'Wed', 'Fri'],
    enabled: true,
  },
  {
    id: '2',
    name: 'Evening Cycle',
    startTime: '18:30',
    duration: 20,
    days: ['Daily'],
    enabled: false,
  },
];

const INITIAL_SETTINGS: Settings = {
  minWaterLevel: 20,
  batteryCutoff: 3.4,
  minFlowRate: 0.5,
  alertBattery: true,
  alertFlow: true,
  alertWater: true,
  autoMode: false,
};

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [sensorData, setSensorData] = useState<SensorData>(INITIAL_SENSOR);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [history, setHistory] = useState<HistoricalPoint[]>(generateHistory());
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch device ID from storage
  useEffect(() => {
    const loadDeviceId = async () => {
      try {
        const id = await AsyncStorage.getItem('deviceId');
        if (id) {
          setDeviceId(id);
        } else {
          // Generate a new device ID if not exists
          const newId = `device_${Date.now()}`;
          await AsyncStorage.setItem('deviceId', newId);
          setDeviceId(newId);
        }
      } catch (error) {
        console.error('Failed to load device ID:', error);
      }
    };
    loadDeviceId();
  }, []);

  // Fetch sensor data from API
  const fetchSensorData = useCallback(async () => {
    if (!deviceId) return;
    try {
      setIsLoading(true);
      const data = await getSensorData({ deviceId });
      if (data?.data) {
        setSensorData(prev => ({
          ...prev,
          batteryVoltage: parseFloat(String(data.data.batteryVoltage || prev.batteryVoltage)),
          batteryPercent: data.data.batteryPercent || prev.batteryPercent,
          solarVoltage: parseFloat(String(data.data.solarVoltage || prev.solarVoltage)),
          flowRate: parseFloat(String(data.data.flowRate || prev.flowRate)),
          waterLevel: data.data.waterLevel || prev.waterLevel,
          pumpStatus: data.data.pumpStatus ?? prev.pumpStatus,
          gsmSignal: data.data.gsmSignal || prev.gsmSignal,
          deviceOnline: data.data.deviceOnline ?? prev.deviceOnline,
          lastSyncTime: new Date(),
        }));
      }
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Fetch historical data from API
  const fetchHistory = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await getSensorDataHistory({ deviceId, limit: 24 });
      if (data?.data && Array.isArray(data.data)) {
        const points: HistoricalPoint[] = data.data.map(record => ({
          time: new Date(record.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          battery: parseFloat(String(record.batteryVoltage)),
          solar: parseFloat(String(record.solarVoltage)),
          flow: parseFloat(String(record.flowRate)),
        }));
        setHistory(points);
      }
    } catch (error) {
      console.error('Failed to fetch sensor history:', error);
    }
  }, [deviceId]);

  // Set up polling interval
  useEffect(() => {
    if (!deviceId) return;

    // Fetch immediately
    fetchSensorData();
    fetchHistory();

    // Set up polling every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchSensorData();
    }, 30000);

    // Fetch history every 5 minutes
    const historyInterval = setInterval(() => {
      fetchHistory();
    }, 300000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      clearInterval(historyInterval);
    };
  }, [deviceId, fetchSensorData, fetchHistory]);

  const togglePump = useCallback(async () => {
    if (!deviceId) return;

    try {
      const command = sensorData.pumpStatus ? 'OFF' : 'ON';
      await controlPump({
        deviceId,
        command,
      });

      // Update local state optimistically
      setSensorData(prev => ({
        ...prev,
        pumpStatus: !prev.pumpStatus,
        flowRate: !prev.pumpStatus ? 3.2 : 0,
      }));
    } catch (error) {
      console.error('Failed to toggle pump:', error);
      // Could show an error alert here
    }
  }, [deviceId, sensorData.pumpStatus]);

  const toggleAutoMode = useCallback(() => {
    setSettings(prev => ({ ...prev, autoMode: !prev.autoMode }));
  }, []);

  const markAlertRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }, []);

  const addSchedule = useCallback((schedule: Omit<Schedule, 'id'>) => {
    const newSchedule: Schedule = { ...schedule, id: Date.now().toString() };
    setSchedules(prev => [...prev, newSchedule]);
  }, []);

  const updateSchedule = useCallback((id: string, update: Partial<Schedule>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSettings = useCallback((update: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...update }));
  }, []);

  const refreshData = useCallback(() => {
    fetchSensorData();
    fetchHistory();
  }, [fetchSensorData, fetchHistory]);

  const unreadAlerts = alerts.filter(a => !a.read).length;

  return (
    <FarmContext.Provider
      value={{
        sensorData,
        alerts,
        schedules,
        settings,
        history,
        unreadAlerts,
        togglePump,
        toggleAutoMode,
        markAlertRead,
        clearAllAlerts,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        updateSettings,
        refreshData,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within FarmProvider');
  return ctx;
}
