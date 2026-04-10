import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface BatteryGaugeProps {
  percent: number;
  voltage: number;
}

export function BatteryGauge({ percent, voltage }: BatteryGaugeProps) {
  const colors = useColors();
  const color = percent > 50 ? colors.success : percent > 20 ? colors.warning : colors.destructive;
  const segments = 5;
  const filled = Math.round((percent / 100) * segments);

  return (
    <View style={styles.wrap}>
      <View style={[styles.battery, { borderColor: color }]}>
        {Array.from({ length: segments }, (_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                backgroundColor: i < filled ? color : colors.muted,
                opacity: i < filled ? 1 : 0.35,
              },
            ]}
          />
        ))}
        <View style={[styles.cap, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.label, { color }]}>{Math.round(percent)}%</Text>
      <Text style={[styles.volt, { color: colors.mutedForeground }]}>{voltage.toFixed(2)}V</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  battery: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 6,
    padding: 3,
    gap: 2,
    alignItems: 'center',
    position: 'relative',
  },
  segment: {
    width: 14,
    height: 20,
    borderRadius: 3,
  },
  cap: {
    position: 'absolute',
    right: -6,
    width: 4,
    height: 10,
    borderRadius: 2,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  volt: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
