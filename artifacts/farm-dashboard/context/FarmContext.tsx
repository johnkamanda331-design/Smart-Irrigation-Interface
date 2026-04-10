import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  togglePump: () => void;
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
  const [history] = useState<HistoricalPoint[]>(generateHistory());

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => ({
        ...prev,
        batteryVoltage: parseFloat((prev.batteryVoltage + (Math.random() - 0.5) * 0.02).toFixed(2)),
        batteryPercent: Math.min(100, Math.max(0, prev.batteryPercent + (Math.random() - 0.45))),
        solarVoltage: parseFloat((prev.solarVoltage + (Math.random() - 0.5) * 0.3).toFixed(1)),
        flowRate: prev.pumpStatus ? parseFloat((2.5 + Math.random() * 2).toFixed(1)) : 0,
        lastSyncTime: new Date(),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const togglePump = useCallback(() => {
    setSensorData(prev => ({
      ...prev,
      pumpStatus: !prev.pumpStatus,
      flowRate: !prev.pumpStatus ? 3.2 : 0,
    }));
  }, []);

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
    setSensorData(prev => ({
      ...prev,
      lastSyncTime: new Date(),
      gsmSignal: Math.floor(Math.random() * 5) + 1,
    }));
  }, []);

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
