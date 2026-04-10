import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFarm } from '@/context/FarmContext';
import { MetricCard } from '@/components/MetricCard';
import { SignalBars } from '@/components/SignalBars';
import { MiniChart } from '@/components/MiniChart';
import { BatteryGauge } from '@/components/BatteryGauge';

function formatRelativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sensorData, history, refreshData, unreadAlerts } = useFarm();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refreshData();
    setTimeout(() => setRefreshing(false), 1200);
  }, [refreshData]);

  const recentHistory = history.slice(-12);
  const batteryHistory = recentHistory.map(h => h.battery);
  const solarHistory = recentHistory.map(h => h.solar);
  const flowHistory = recentHistory.map(h => h.flow);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Smart Irrigation</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Farm Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          {unreadAlerts > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.alertBadgeText}>{unreadAlerts}</Text>
            </View>
          )}
          <View style={[styles.onlineIndicator, { backgroundColor: sensorData.deviceOnline ? colors.success : colors.destructive }]} />
          <Text style={[styles.syncTime, { color: colors.mutedForeground }]}>
            {formatRelativeTime(sensorData.lastSyncTime)}
          </Text>
        </View>
      </View>

      <View style={[styles.statusBanner, {
        backgroundColor: sensorData.deviceOnline ? colors.primary + '15' : colors.destructive + '15',
        borderColor: sensorData.deviceOnline ? colors.primary + '40' : colors.destructive + '40',
      }]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: sensorData.deviceOnline ? colors.success : colors.destructive }]} />
          <Text style={[styles.statusText, { color: sensorData.deviceOnline ? colors.primary : colors.destructive }]}>
            {sensorData.deviceOnline ? 'Device Online — GSM Active' : 'Device Offline'}
          </Text>
        </View>
        <SignalBars signal={sensorData.gsmSignal} size={18} />
      </View>

      <View style={styles.batteryRow}>
        <View style={[styles.bigCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bigCardHeader}>
            <Text style={[styles.bigCardLabel, { color: colors.mutedForeground }]}>BATTERY</Text>
            <MiniChart data={batteryHistory} color={colors.battery} width={60} height={28} />
          </View>
          <BatteryGauge percent={sensorData.batteryPercent} voltage={sensorData.batteryVoltage} />
        </View>

        <View style={[styles.bigCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bigCardHeader}>
            <Text style={[styles.bigCardLabel, { color: colors.mutedForeground }]}>SOLAR</Text>
            <MiniChart data={solarHistory} color={colors.solar} width={60} height={28} />
          </View>
          <Text style={[styles.bigValue, { color: colors.solar }]}>{sensorData.solarVoltage.toFixed(1)}</Text>
          <Text style={[styles.bigUnit, { color: colors.mutedForeground }]}>Volts</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <MetricCard
          title="Pump"
          value={sensorData.pumpStatus ? 'ON' : 'OFF'}
          subtitle={sensorData.pumpStatus ? 'Running' : 'Stopped'}
          status={sensorData.pumpStatus ? 'ok' : 'warning'}
          accent={colors.pump}
          icon={
            <MaterialCommunityIcons
              name="water-pump"
              size={22}
              color={sensorData.pumpStatus ? colors.pump : colors.mutedForeground}
            />
          }
        />
        <MetricCard
          title="Flow Rate"
          value={`${sensorData.flowRate.toFixed(1)}`}
          subtitle="L/min"
          status={sensorData.flowRate > 1 ? 'ok' : sensorData.flowRate > 0 ? 'warning' : 'critical'}
          accent={colors.water}
          icon={
            <MaterialCommunityIcons
              name="water-outline"
              size={22}
              color={colors.water}
            />
          }
        />
      </View>

      <View style={styles.grid}>
        <MetricCard
          title="Water Level"
          value={sensorData.waterLevel}
          subtitle={sensorData.waterLevel === 'OK' ? 'Normal' : 'Check tank'}
          status={sensorData.waterLevel === 'OK' ? 'ok' : 'critical'}
          icon={
            <MaterialCommunityIcons
              name={sensorData.waterLevel === 'OK' ? 'water' : 'water-off'}
              size={22}
              color={sensorData.waterLevel === 'OK' ? colors.water : colors.destructive}
            />
          }
        />
        <MetricCard
          title="GSM Signal"
          value={`${sensorData.gsmSignal}/5`}
          subtitle={sensorData.gsmSignal >= 3 ? 'Good' : 'Weak'}
          status={sensorData.gsmSignal >= 3 ? 'ok' : 'warning'}
          icon={
            <MaterialCommunityIcons
              name="signal"
              size={22}
              color={colors.accent}
            />
          }
        />
      </View>

      <View style={[styles.flowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.flowHeader}>
          <Text style={[styles.flowTitle, { color: colors.foreground }]}>Flow History</Text>
          <Text style={[styles.flowSub, { color: colors.mutedForeground }]}>Last 12 readings</Text>
        </View>
        <MiniChart
          data={flowHistory}
          color={colors.water}
          width={undefined}
          height={48}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  batteryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bigCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  bigCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bigCardLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bigValue: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  bigUnit: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: -4,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  flowCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flowTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  flowSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
