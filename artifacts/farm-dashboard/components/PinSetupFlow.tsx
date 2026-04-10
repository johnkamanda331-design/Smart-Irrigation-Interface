import React, { useState } from 'react';
import { PinScreen } from './PinScreen';
import { useAuth } from '@/context/AuthContext';

interface PinSetupFlowProps {
  onDone: () => void;
  onCancel?: () => void;
}

export function PinSetupFlow({ onDone, onCancel }: PinSetupFlowProps) {
  const { setupPin } = useAuth();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [mismatch, setMismatch] = useState(false);

  function handleFirstPin(pin: string) {
    setFirstPin(pin);
    setMismatch(false);
    setStep('confirm');
  }

  async function handleConfirmPin(pin: string) {
    if (pin !== firstPin) {
      setMismatch(true);
      setStep('enter');
      setFirstPin('');
      return;
    }
    await setupPin(pin);
    onDone();
  }

  if (step === 'confirm') {
    return (
      <PinScreen
        mode="confirm"
        title="Confirm your PIN"
        subtitle="Re-enter your 4-digit PIN to confirm"
        onSubmit={handleConfirmPin}
        onCancel={() => {
          setStep('enter');
          setFirstPin('');
        }}
      />
    );
  }

  return (
    <PinScreen
      mode="setup"
      title="Create a PIN"
      subtitle={mismatch ? "PINs didn't match. Please try again." : "Set a 4-digit PIN to secure your dashboard"}
      onSubmit={handleFirstPin}
      onCancel={onCancel}
      failedAttempts={mismatch ? 1 : 0}
    />
  );
}
