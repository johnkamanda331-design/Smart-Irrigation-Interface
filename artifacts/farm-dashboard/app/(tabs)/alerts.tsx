import React from 'react';
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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFarm, Alert } from '@/context/FarmContext';

function formatTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function AlertCard({ alert, onRead }: { alert: Alert; onRead: () => void }) {
  const colors = useColors();

  const config = {
    critical: {
      color: colors.destructive,
      bg: colors.destructive + '12',
      border: colors.destructive + '40',
      icon: 'alert-circle' as const,
      label: 'CRITICAL',
    },
    warning: {
      color: colors.warning,
      bg: colors.warning + '12',
      border: colors.warning + '40',
      icon: 'alert' as const,
      label: 'WARNING',
    },
    info: {
      color: colors.info,
      bg: colors.info + '12',
      border: colors.info + '40',
      icon: 'information' as const,
      label: 'INFO',
    },
  }[alert.type];

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onRead();
      }}
      style={[
        styles.alertCard,
        {
          backgroundColor: alert.read ? colors.card : config.bg,
          borderColor: alert.read ? colors.border : config.border,
          opacity: alert.read ? 0.7 : 1,
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.alertIcon, { backgroundColor: config.color + '20' }]}>
        <MaterialCommunityIcons name={config.icon} size={22} color={config.color} />
      </View>
      <View style={styles.alertBody}>
        <View style={styles.alertTop}>
          <View style={[styles.alertBadge, { backgroundColor: config.color + '20' }]}>
            <Text style={[styles.alertBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>
          {!alert.read && (
            <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
          )}
        </View>
        <Text style={[styles.alertTitle, { color: colors.foreground }]}>{alert.title}</Text>
        <Text style={[styles.alertMsg, { color: colors.mutedForeground }]}>{alert.message}</Text>
        <Text style={[styles.alertTime, { color: colors.mutedForeground }]}>
          {formatTime(alert.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { alerts, markAlertRead, clearAllAlerts, unreadAlerts } = useFarm();

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
        <View style={styles.header}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Alerts</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
            {unreadAlerts > 0 ? `${unreadAlerts} unread notification${unreadAlerts > 1 ? 's' : ''}` : 'All caught up'}
          </Text>
        </View>
        {unreadAlerts > 0 && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              clearAllAlerts();
            }}
            style={[styles.clearBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.clearText, { color: colors.primary }]}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {alerts.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="bell-check-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No alerts</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onRead={() => markAlertRead(alert.id)}
            />
          ))}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  clearBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  list: {
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: {
    flex: 1,
    gap: 4,
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  alertMsg: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  alertTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
});
