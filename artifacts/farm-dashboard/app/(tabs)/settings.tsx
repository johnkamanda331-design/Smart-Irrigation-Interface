import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFarm, Schedule } from '@/context/FarmContext';
import { useAuth } from '@/context/AuthContext';
import { PinSetupFlow } from '@/components/PinSetupFlow';
import { PinScreen } from '@/components/PinScreen';

function SliderInput({
  label,
  value,
  min,
  max,
  unit,
  onInc,
  onDec,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onInc: () => void;
  onDec: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.sliderRow, { borderColor: colors.border }]}>
      <View style={styles.sliderLeft}>
        <Text style={[styles.sliderLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.sliderVal, { color: colors.primary }]}>
          {value.toFixed(1)} {unit}
        </Text>
      </View>
      <View style={styles.sliderBtns}>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDec(); }}
          style={[styles.adjBtn, { borderColor: colors.border }]}
          disabled={value <= min}
        >
          <Feather name="minus" size={16} color={value <= min ? colors.mutedForeground : colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onInc(); }}
          style={[styles.adjBtn, { borderColor: colors.border }]}
          disabled={value >= max}
        >
          <Feather name="plus" size={16} color={value >= max ? colors.mutedForeground : colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ScheduleCard({
  schedule,
  onToggle,
  onDelete,
}: {
  schedule: Schedule;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.schedCard, {
      backgroundColor: colors.card,
      borderColor: schedule.enabled ? colors.primary + '40' : colors.border,
    }]}>
      <View style={styles.schedHeader}>
        <View style={[styles.schedIconWrap, { backgroundColor: colors.primary + '15' }]}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.schedBody}>
          <Text style={[styles.schedName, { color: colors.foreground }]}>{schedule.name}</Text>
          <Text style={[styles.schedTime, { color: colors.mutedForeground }]}>
            {schedule.startTime} — {schedule.duration} min — {schedule.days.join(', ')}
          </Text>
        </View>
        <View style={styles.schedActions}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(); }}
            style={[styles.schedToggle, { backgroundColor: schedule.enabled ? colors.primary + '15' : colors.muted }]}
          >
            <Text style={[styles.schedToggleText, { color: schedule.enabled ? colors.primary : colors.mutedForeground }]}>
              {schedule.enabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Alert.alert('Delete Schedule', `Delete "${schedule.name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ]);
          }}>
            <Feather name="trash-2" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

type SecurityModal = 'setup' | 'change' | 'remove' | null;

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, schedules, updateSettings, updateSchedule, deleteSchedule, addSchedule } = useFarm();
  const { hasPin, lock, removePin, changePin, checkPin, failedAttempts, remainingLockout } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('06:00');
  const [newDuration, setNewDuration] = useState('30');
  const [securityModal, setSecurityModal] = useState<SecurityModal>(null);
  const [changePinStep, setChangePinStep] = useState<'old' | 'new' | 'confirm'>('old');
  const [changePinOld, setChangePinOld] = useState('');
  const [changePinNew, setChangePinNew] = useState('');
  const [changePinError, setChangePinError] = useState(false);
  const [changePinAttempts, setChangePinAttempts] = useState(0);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  function handleAddSchedule() {
    if (!newName.trim()) return;
    addSchedule({
      name: newName.trim(),
      startTime: newTime,
      duration: parseInt(newDuration) || 30,
      days: ['Daily'],
      enabled: true,
    });
    setShowAddModal(false);
    setNewName('');
    setNewTime('06:00');
    setNewDuration('30');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

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
    >
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Settings</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        Schedules and system thresholds
      </Text>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pump Schedules</Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {schedules.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clock-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No schedules</Text>
          </View>
        ) : (
          <View style={styles.schedList}>
            {schedules.map(s => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                onToggle={() => updateSchedule(s.id, { enabled: !s.enabled })}
                onDelete={() => deleteSchedule(s.id)}
              />
            ))}
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Alert Thresholds</Text>

        <SliderInput
          label="Battery Cutoff Voltage"
          value={settings.batteryCutoff}
          min={3.0}
          max={4.0}
          unit="V"
          onInc={() => updateSettings({ batteryCutoff: Math.min(4.0, settings.batteryCutoff + 0.1) })}
          onDec={() => updateSettings({ batteryCutoff: Math.max(3.0, settings.batteryCutoff - 0.1) })}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SliderInput
          label="Min Flow Detection"
          value={settings.minFlowRate}
          min={0.1}
          max={2.0}
          unit="L/m"
          onInc={() => updateSettings({ minFlowRate: Math.min(2.0, parseFloat((settings.minFlowRate + 0.1).toFixed(1))) })}
          onDec={() => updateSettings({ minFlowRate: Math.max(0.1, parseFloat((settings.minFlowRate - 0.1).toFixed(1))) })}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SliderInput
          label="Min Water Level"
          value={settings.minWaterLevel}
          min={5}
          max={80}
          unit="%"
          onInc={() => updateSettings({ minWaterLevel: Math.min(80, settings.minWaterLevel + 5) })}
          onDec={() => updateSettings({ minWaterLevel: Math.max(5, settings.minWaterLevel - 5) })}
        />
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}>
        <MaterialCommunityIcons name="information-outline" size={18} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.accent }]}>
          Changes are applied immediately. The device will receive updated thresholds on the next GSM sync.
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Security</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.secRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (hasPin) {
              setChangePinStep('old');
              setChangePinOld('');
              setChangePinNew('');
              setChangePinError(false);
              setChangePinAttempts(0);
              setSecurityModal('change');
            } else {
              setSecurityModal('setup');
            }
          }}
          activeOpacity={0.75}
        >
          <View style={[styles.secIcon, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name={hasPin ? 'lock-outline' : 'lock-open-outline'} size={18} color={colors.primary} />
          </View>
          <View style={styles.secBody}>
            <Text style={[styles.secTitle, { color: colors.foreground }]}>
              {hasPin ? 'Change PIN' : 'Enable PIN Lock'}
            </Text>
            <Text style={[styles.secSub, { color: colors.mutedForeground }]}>
              {hasPin ? '4-digit PIN is active' : 'Add a PIN to protect the dashboard'}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {hasPin && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.secRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                lock();
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.secIcon, { backgroundColor: colors.accent + '15' }]}>
                <MaterialCommunityIcons name="lock-clock" size={18} color={colors.accent} />
              </View>
              <View style={styles.secBody}>
                <Text style={[styles.secTitle, { color: colors.foreground }]}>Lock Now</Text>
                <Text style={[styles.secSub, { color: colors.mutedForeground }]}>
                  Require PIN to access the dashboard
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.secRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setChangePinAttempts(0);
                setSecurityModal('remove');
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.secIcon, { backgroundColor: colors.destructive + '15' }]}>
                <MaterialCommunityIcons name="lock-remove-outline" size={18} color={colors.destructive} />
              </View>
              <View style={styles.secBody}>
                <Text style={[styles.secTitle, { color: colors.destructive }]}>Remove PIN</Text>
                <Text style={[styles.secSub, { color: colors.mutedForeground }]}>
                  Disable PIN lock for this device
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal visible={securityModal === 'setup'} animationType="slide">
        <PinSetupFlow
          onDone={() => setSecurityModal(null)}
          onCancel={() => setSecurityModal(null)}
        />
      </Modal>

      <Modal visible={securityModal === 'remove'} animationType="slide">
        <PinScreen
          mode="unlock"
          title="Confirm removal"
          subtitle="Enter your current PIN to disable the lock"
          failedAttempts={changePinAttempts}
          onSubmit={async (pin) => {
            const ok = await removePin(pin);
            if (ok) {
              setSecurityModal(null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              setChangePinAttempts(p => p + 1);
            }
          }}
          onCancel={() => setSecurityModal(null)}
        />
      </Modal>

      <Modal visible={securityModal === 'change'} animationType="slide">
        {changePinStep === 'old' && (
          <PinScreen
            mode="change-old"
            title="Enter current PIN"
            subtitle="Verify your identity before changing"
            failedAttempts={changePinAttempts}
            onSubmit={async (pin) => {
              const ok = await checkPin(pin);
              if (ok) {
                setChangePinOld(pin);
                setChangePinStep('new');
                setChangePinError(false);
              } else {
                setChangePinAttempts(p => p + 1);
              }
            }}
            onCancel={() => setSecurityModal(null)}
          />
        )}
        {changePinStep === 'new' && (
          <PinScreen
            mode="change-new"
            title="Enter new PIN"
            subtitle="Choose a new 4-digit PIN"
            failedAttempts={0}
            onSubmit={(pin) => {
              setChangePinNew(pin);
              setChangePinStep('confirm');
            }}
            onCancel={() => setChangePinStep('old')}
          />
        )}
        {changePinStep === 'confirm' && (
          <PinScreen
            mode="change-confirm"
            title="Confirm new PIN"
            subtitle="Re-enter your new PIN"
            failedAttempts={changePinError ? 1 : 0}
            onSubmit={async (pin) => {
              if (pin !== changePinNew) {
                setChangePinError(true);
                setChangePinStep('new');
                setChangePinNew('');
                return;
              }
              await changePin(changePinOld, pin);
              setSecurityModal(null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
            onCancel={() => setChangePinStep('new')}
          />
        )}
      </Modal>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Schedule</Text>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Name</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Morning Irrigation"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Start Time (HH:MM)</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="06:00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Duration (minutes)</Text>
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              value={newDuration}
              onChangeText={setNewDuration}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={colors.mutedForeground}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={[styles.modalBtn, { borderWidth: 1, borderColor: colors.border }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddSchedule}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
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
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  schedList: { gap: 10 },
  schedCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  schedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schedBody: { flex: 1 },
  schedName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  schedTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  schedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  schedToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  schedToggleText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sliderLeft: { gap: 2 },
  sliderLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  sliderVal: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  sliderBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  adjBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: -6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  secIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secBody: {
    flex: 1,
    gap: 2,
  },
  secTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  secSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
