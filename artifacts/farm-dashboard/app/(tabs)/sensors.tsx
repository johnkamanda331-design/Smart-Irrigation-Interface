import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useFarm } from '@/context/FarmContext';
import { LineChart } from '@/components/LineChart';

type TimeFilter = '1h' | '24h' | '7d';

function formatHistoryLabel(time: string, filter: TimeFilter) {
  const date = new Date(time);

  if (filter === '7d') {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function filterHistory(data: { time: string; value: number }[], filter: TimeFilter) {
  if (filter === '1h') return data.slice(-6);
  if (filter === '24h') return data.slice(-24);
  if (filter === '7d') return data.slice(-168);
  return data;
}

function ChartSection({
  title,
  unit,
  color,
  icon,
  data,
  current,
  filter,
  xLabelInterval,
}: {
  title: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
  data: { time: string; value: number }[];
  current: string;
  filter: TimeFilter;
  xLabelInterval?: number;
}) {
  const colors = useColors();
  const filtered = filterHistory(data, filter);
  const vals = filtered.map(d => d.value);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const peak = vals.length ? Math.max(...vals) : 0;

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.chartHeader}>
        <View style={styles.chartLeft}>
          <View style={[styles.chartIcon, { backgroundColor: color + '18' }]}>
            {icon}
          </View>
          <View>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>{title}</Text>
            <Text style={[styles.chartCurrent, { color }]}>
              {current} {unit}
            </Text>
          </View>
        </View>
        <View style={styles.chartStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg</Text>
            <Text style={[styles.statVal, { color: colors.foreground }]}>{avg.toFixed(1)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Peak</Text>
            <Text style={[styles.statVal, { color: colors.foreground }]}>{peak.toFixed(1)}</Text>
          </View>
        </View>
      </View>
      <LineChart
        data={filtered}
        color={color}
        unit={unit}
        height={110}
        xLabelInterval={xLabelInterval}
      />
    </View>
  );
}

export default function SensorsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sensorData, history } = useFarm();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<TimeFilter>('24h');

  const batteryData = history.map(h => ({ time: formatHistoryLabel(h.time, filter), value: h.battery }));
  const solarData = history.map(h => ({ time: formatHistoryLabel(h.time, filter), value: h.solar }));
  const flowData = history.map(h => ({ time: formatHistoryLabel(h.time, filter), value: h.flow }));

  const topPad = Platform.OS === 'web' ? 64 : insets.top;

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Sensor Details</Text>
        <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        Historical readings and trends • Showing {filter === '1h' ? 'last 6 hours' : filter === '24h' ? 'last 24 hours' : 'last 7 days'}
        </Text>

        <View style={[styles.filterRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        {(['1h', '24h', '7d'] as TimeFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              filter === f && { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterText,
              { color: filter === f ? colors.primary : colors.mutedForeground },
              filter === f && { fontFamily: 'Inter_700Bold' },
            ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      </View>

      <ChartSection
        title="Battery Voltage"
        unit="V"
        color={colors.battery}
        filter={filter}
        current={sensorData.batteryVoltage.toFixed(2)}
        data={batteryData}
        xLabelInterval={filter === '7d' ? Math.max(1, Math.floor(batteryData.length / 7)) : undefined}
        icon={<MaterialCommunityIcons name="battery-charging" size={20} color={colors.battery} />}
      />

      <ChartSection
        title="Solar Panel"
        unit="V"
        color={colors.solar}
        filter={filter}
        current={sensorData.solarVoltage.toFixed(1)}
        data={solarData}
        xLabelInterval={filter === '7d' ? Math.max(1, Math.floor(solarData.length / 7)) : undefined}
        icon={<MaterialCommunityIcons name="solar-panel" size={20} color={colors.solar} />}
      />

      <ChartSection
        title="Water Flow Rate"
        unit="L/m"
        color={colors.water}
        filter={filter}
        current={sensorData.flowRate.toFixed(1)}
        data={flowData}
        xLabelInterval={filter === '7d' ? Math.max(1, Math.floor(flowData.length / 7)) : undefined}
        icon={<MaterialCommunityIcons name="water-outline" size={20} color={colors.water} />}
      />
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
  filterRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  chartCurrent: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  chartStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});
