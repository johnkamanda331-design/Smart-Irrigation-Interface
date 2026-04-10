import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface SignalBarsProps {
  signal: number;
  size?: number;
}

export function SignalBars({ signal, size = 16 }: SignalBarsProps) {
  const colors = useColors();
  const bars = 5;
  const color = signal >= 4 ? colors.success : signal >= 2 ? colors.warning : colors.destructive;

  return (
    <View style={[styles.container, { height: size }]}>
      {Array.from({ length: bars }, (_, i) => {
        const height = size * (0.3 + (i / bars) * 0.7);
        const active = i < signal;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height,
                width: size * 0.15,
                backgroundColor: active ? color : colors.border,
                borderRadius: 2,
                alignSelf: 'flex-end',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {},
});
