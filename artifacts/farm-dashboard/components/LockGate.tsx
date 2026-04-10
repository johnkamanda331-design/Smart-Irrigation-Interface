import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { PinScreen } from './PinScreen';
import { PinSetupFlow } from './PinSetupFlow';

interface LockGateProps {
  children: React.ReactNode;
}

export function LockGate({ children }: LockGateProps) {
  const { isLocked, hasPin, isLoading, failedAttempts, remainingLockout, verifyPin } = useAuth();
  const [settingUpPin, setSettingUpPin] = useState(false);

  if (isLoading) return null;

  if (!hasPin && !settingUpPin) {
    return <>{children}</>;
  }

  if (settingUpPin) {
    return (
      <View style={styles.full}>
        <PinSetupFlow
          onDone={() => setSettingUpPin(false)}
          onCancel={() => setSettingUpPin(false)}
        />
      </View>
    );
  }

  if (isLocked) {
    return (
      <View style={styles.full}>
        <PinScreen
          mode="unlock"
          title="Enter your PIN"
          subtitle="Authentication required to access the dashboard"
          failedAttempts={failedAttempts}
          remainingLockout={remainingLockout}
          isLocked={remainingLockout > 0}
          onSubmit={verifyPin}
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
});
