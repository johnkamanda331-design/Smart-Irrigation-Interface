import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useFarm } from '@/context/FarmContext';
import { SignalBars } from '@/components/SignalBars';

const FIRMWARE_VERSION = 'v2.4.1';
const DEVICE_ID = 'ESP32-SIM800-A3F2';

function StatusRow({
  label,
  value,
  icon,
  iconColor,
  valueColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  valueColor?: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statusRow, { borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '15' }]}>
        {icon}
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: valueColor || colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function formatLastComm(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function StatusScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { sensorData } = useFarm();
  const topPad = Platform.OS === 'web' ? 64 : insets.top;

  const gsmStrength = ['None', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][sensorData.gsmSignal] || 'Unknown';

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: Platform.OS === 'web' ? 76 : insets.bottom + 16,
        },
      ]}
    >
      <View style={[styles.pageInner, width >= 960 && styles.pageInnerWide]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>System Status</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        Device health and connectivity
      </Text>

      <View style={[
        styles.onlineCard,
        {
          backgroundColor: sensorData.deviceOnline ? colors.primary + '12' : colors.destructive + '12',
          borderColor: sensorData.deviceOnline ? colors.primary + '40' : colors.destructive + '40',
        },
      ]}>
        <View style={[
          styles.onlinePulse,
          {
            backgroundColor: sensorData.deviceOnline ? colors.success : colors.destructive,
          },
        ]} />
        <View style={styles.onlineBody}>
          <Text style={[styles.onlineStatus, { color: sensorData.deviceOnline ? colors.primary : colors.destructive }]}>
            {sensorData.deviceOnline ? 'Device Online' : 'Device Offline'}
          </Text>
          <Text style={[styles.onlineSub, { color: colors.mutedForeground }]}>
            {sensorData.deviceOnline ? 'All systems operational' : 'Check GSM connection'}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={sensorData.deviceOnline ? 'check-circle' : 'close-circle'}
          size={28}
          color={sensorData.deviceOnline ? colors.success : colors.destructive}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Connectivity</Text>

        <View style={styles.signalBlock}>
          <SignalBars signal={sensorData.gsmSignal} size={32} />
          <View>
            <Text style={[styles.signalLabel, { color: colors.foreground }]}>
              GSM Signal — {gsmStrength}
            </Text>
            <Text style={[styles.signalSub, { color: colors.mutedForeground }]}>
              SIM800L — {sensorData.gsmSignal}/5 bars
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <StatusRow
          label="Last Communication"
          value={formatLastComm(sensorData.lastSyncTime)}
          iconColor={colors.primary}
          icon={<MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <StatusRow
          label="Protocol"
          value="GSM / SMS + HTTP"
          iconColor={colors.accent}
          icon={<MaterialCommunityIcons name="transmission-tower" size={18} color={colors.accent} />}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Device Info</Text>

        <StatusRow
          label="Device ID"
          value={DEVICE_ID}
          iconColor={colors.primary}
          icon={<MaterialCommunityIcons name="chip" size={18} color={colors.primary} />}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <StatusRow
          label="Microcontroller"
          value="ESP32 + SIM800L GSM"
          iconColor={colors.solar}
          icon={<MaterialCommunityIcons name="cpu-64-bit" size={18} color={colors.solar} />}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <StatusRow
          label="Firmware Version"
          value={FIRMWARE_VERSION}
          iconColor={colors.success}
          icon={<MaterialCommunityIcons name="update" size={18} color={colors.success} />}
          valueColor={colors.success}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <StatusRow
          label="Power Source"
          value="Solar + Li-Ion Battery"
          iconColor={colors.solar}
          icon={<MaterialCommunityIcons name="solar-panel-large" size={18} color={colors.solar} />}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Components</Text>

        {[
          { label: 'Water Flow Sensor', ok: sensorData.flowRate >= 0, icon: 'water-outline' },
          { label: 'Water Level Detector', ok: true, icon: 'water-check' },
          { label: 'MOSFET Pump Relay', ok: true, icon: 'electric-switch' },
          { label: 'Battery Monitor', ok: sensorData.batteryPercent > 10, icon: 'battery' },
          { label: 'Solar Regulator', ok: sensorData.solarVoltage > 5, icon: 'solar-panel' },
        ].map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <View style={styles.componentRow}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={18}
                color={item.ok ? colors.success : colors.destructive}
              />
              <Text style={[styles.componentLabel, { color: colors.foreground }]}>{item.label}</Text>
              <View style={[styles.compBadge, { backgroundColor: item.ok ? colors.success + '15' : colors.destructive + '15' }]}>
                <Text style={[styles.compBadgeText, { color: item.ok ? colors.success : colors.destructive }]}>
                  {item.ok ? 'OK' : 'FAULT'}
                </Text>
              </View>
            </View>
            {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  pageInner: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  pageInnerWide: {
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: -8,
  },
  onlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  onlinePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  onlineBody: { flex: 1 },
  onlineStatus: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  onlineSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  signalBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  signalLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  signalSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  componentLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  compBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});
