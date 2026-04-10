import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  status?: 'ok' | 'warning' | 'critical';
  accent?: string;
}

export function MetricCard({ title, value, subtitle, icon, status, accent }: MetricCardProps) {
  const colors = useColors();

  const statusColor = status === 'ok'
    ? colors.success
    : status === 'warning'
    ? colors.warning
    : status === 'critical'
    ? colors.destructive
    : accent || colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: statusColor + '18' }]}>
        {icon}
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.mutedForeground }]}>{title}</Text>
        <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
        {subtitle ? (
          <View style={styles.subtitleRow}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.subtitle, { color: statusColor }]}>{subtitle}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 150,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
