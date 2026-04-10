import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFarm } from '@/context/FarmContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

function PumpButton() {
  const colors = useColors();
  const { sensorData, togglePump } = useFarm();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function handlePress() {
    const action = sensorData.pumpStatus ? 'turn OFF' : 'turn ON';
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} the pump?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: sensorData.pumpStatus ? 'Turn Off' : 'Turn On',
          style: sensorData.pumpStatus ? 'destructive' : 'default',
          onPress: async () => {
            scale.value = withSpring(0.94, {}, () => {
              scale.value = withSpring(1);
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              await togglePump();
            } catch (error) {
              Alert.alert('Error', 'Failed to control pump. Please try again.');
            }
          },
        },
      ]
    );
  }

  const pumpColor = sensorData.pumpStatus ? colors.pump : colors.mutedForeground;

  return (
    <View style={[styles.pumpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.pumpLabel, { color: colors.mutedForeground }]}>MAIN PUMP</Text>

      <Animated.View style={[styles.pumpCircleWrap, animStyle]}>
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.pumpCircle,
            {
              backgroundColor: sensorData.pumpStatus ? colors.pump + '18' : colors.muted,
              borderColor: pumpColor,
            },
          ]}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="water-pump" size={48} color={pumpColor} />
          <Text style={[styles.pumpStateText, { color: pumpColor }]}>
            {sensorData.pumpStatus ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={[styles.pumpStatus, {
        backgroundColor: sensorData.pumpStatus ? colors.success + '15' : colors.muted,
      }]}>
        <View style={[styles.statusDot, {
          backgroundColor: sensorData.pumpStatus ? colors.success : colors.mutedForeground,
        }]} />
        <Text style={[styles.pumpStatusText, {
          color: sensorData.pumpStatus ? colors.success : colors.mutedForeground,
        }]}>
          {sensorData.pumpStatus ? 'Running — Tap to Stop' : 'Stopped — Tap to Start'}
        </Text>
      </View>
    </View>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  icon,
  iconColor,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  iconColor: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.toggleRow, { borderColor: colors.border }]}>
      <View style={[styles.toggleIcon, { backgroundColor: iconColor + '15' }]}>
        {icon}
      </View>
      <View style={styles.toggleBody}>
        <Text style={[styles.toggleTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange(v);
        }}
        trackColor={{ false: colors.muted, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
      />
    </View>
  );
}

export default function ControlScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { sensorData, settings, toggleAutoMode, toggleDemoMode, updateSettings } = useFarm();

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Control Panel</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        Manage pump and system modes
      </Text>

      <PumpButton />

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Operation Mode</Text>

        <ToggleRow
          title="Demo Mode"
          subtitle="Use mock data without connecting to hardware"
          value={settings.demoMode}
          onChange={() => toggleDemoMode()}
          iconColor={colors.secondary}
          icon={<MaterialCommunityIcons name="test-tube" size={20} color={colors.secondary} />}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ToggleRow
          title="Auto Mode"
          subtitle="System controls pump automatically based on schedule"
          value={settings.autoMode}
          onChange={() => toggleAutoMode()}
          iconColor={colors.primary}
          icon={<MaterialCommunityIcons name="robot-outline" size={20} color={colors.primary} />}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ToggleRow
          title="Flow Alerts"
          subtitle="Alert when no water flow is detected"
          value={settings.alertFlow}
          onChange={(v) => updateSettings({ alertFlow: v })}
          iconColor={colors.water}
          icon={<MaterialCommunityIcons name="water-outline" size={20} color={colors.water} />}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ToggleRow
          title="Battery Alerts"
          subtitle="Alert when battery drops below cutoff"
          value={settings.alertBattery}
          onChange={(v) => updateSettings({ alertBattery: v })}
          iconColor={colors.battery}
          icon={<MaterialCommunityIcons name="battery-alert" size={20} color={colors.battery} />}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ToggleRow
          title="Water Level Alerts"
          subtitle="Alert when tank water is low or empty"
          value={settings.alertWater}
          onChange={(v) => updateSettings({ alertWater: v })}
          iconColor={colors.accent}
          icon={<MaterialCommunityIcons name="water-minus" size={20} color={colors.accent} />}
        />
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          Manual pump control is disabled while Auto Mode is active. Disable Auto Mode to control the pump manually.
        </Text>
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
  pumpCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  pumpLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  pumpCircleWrap: {},
  pumpCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pumpStateText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  pumpStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pumpStatusText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  toggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBody: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  toggleSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
