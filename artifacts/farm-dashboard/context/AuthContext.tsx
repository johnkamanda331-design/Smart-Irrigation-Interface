import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = '@farm_pin';
const ATTEMPTS_KEY = '@farm_pin_attempts';
const LOCKOUT_KEY = '@farm_pin_lockout';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;

interface AuthContextType {
  isLocked: boolean;
  hasPin: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  remainingLockout: number;
  isLoading: boolean;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  checkPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  removePin: (pin: string) => Promise<boolean>;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function simpleHash(pin: string): string {
  let hash = 0;
  const salt = 'farmIrrigationSalt2024';
  const str = salt + pin + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + pin.length.toString();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingLockout, setRemainingLockout] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [storedPin, storedAttempts, storedLockout] = await Promise.all([
          AsyncStorage.getItem(PIN_KEY),
          AsyncStorage.getItem(ATTEMPTS_KEY),
          AsyncStorage.getItem(LOCKOUT_KEY),
        ]);
        setHasPin(!!storedPin);
        setFailedAttempts(storedAttempts ? parseInt(storedAttempts) : 0);

        if (storedLockout) {
          const lockoutTime = parseInt(storedLockout);
          if (lockoutTime > Date.now()) {
            setLockoutUntil(lockoutTime);
          } else {
            await AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
            setFailedAttempts(0);
          }
        }

        if (!storedPin) {
          setIsLocked(false);
        }
      } catch (e) {
        setIsLocked(false);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!lockoutUntil) {
      setRemainingLockout(0);
      return;
    }
    const update = () => {
      const remaining = Math.max(0, lockoutUntil - Date.now());
      setRemainingLockout(Math.ceil(remaining / 1000));
      if (remaining === 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const setupPin = useCallback(async (pin: string) => {
    const hashed = simpleHash(pin);
    await AsyncStorage.setItem(PIN_KEY, hashed);
    setHasPin(true);
    setIsLocked(false);
    setFailedAttempts(0);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    if (lockoutUntil && lockoutUntil > Date.now()) return false;
    const stored = await AsyncStorage.getItem(PIN_KEY);
    if (!stored) return true;

    const hashed = simpleHash(pin);
    if (hashed === stored) {
      setFailedAttempts(0);
      setLockoutUntil(null);
      await AsyncStorage.multiRemove([ATTEMPTS_KEY, LOCKOUT_KEY]);
      setIsLocked(false);
      return true;
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      await AsyncStorage.setItem(ATTEMPTS_KEY, newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(until);
        await AsyncStorage.setItem(LOCKOUT_KEY, until.toString());
        setFailedAttempts(0);
        await AsyncStorage.setItem(ATTEMPTS_KEY, '0');
      }
      return false;
    }
  }, [failedAttempts, lockoutUntil]);

  const checkPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await AsyncStorage.getItem(PIN_KEY);
    if (!stored) return true;
    return simpleHash(pin) === stored;
  }, []);

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    const stored = await AsyncStorage.getItem(PIN_KEY);
    if (!stored) return false;
    if (simpleHash(oldPin) !== stored) return false;
    await AsyncStorage.setItem(PIN_KEY, simpleHash(newPin));
    return true;
  }, []);

  const removePin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await AsyncStorage.getItem(PIN_KEY);
    if (!stored) return false;
    if (simpleHash(pin) !== stored) return false;
    await AsyncStorage.multiRemove([PIN_KEY, ATTEMPTS_KEY, LOCKOUT_KEY]);
    setHasPin(false);
    setFailedAttempts(0);
    setLockoutUntil(null);
    return true;
  }, []);

  const lock = useCallback(() => {
    if (hasPin) setIsLocked(true);
  }, [hasPin]);

  return (
    <AuthContext.Provider value={{
      isLocked,
      hasPin,
      failedAttempts,
      lockoutUntil,
      remainingLockout,
      isLoading,
      setupPin,
      verifyPin,
      checkPin,
      changePin,
      removePin,
      lock,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
