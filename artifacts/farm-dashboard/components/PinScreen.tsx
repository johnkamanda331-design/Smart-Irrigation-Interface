import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

const PIN_LENGTH = 4;

interface PinScreenProps {
  mode: 'unlock' | 'setup' | 'confirm' | 'change-old' | 'change-new' | 'change-confirm';
  title: string;
  subtitle?: string;
  failedAttempts?: number;
  remainingLockout?: number;
  isLocked?: boolean;
  onSubmit: (pin: string) => void;
  onCancel?: () => void;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

function DotRow({ filled, shake }: { filled: number; shake: Animated.Value }) {
  const colors = useColors();
  return (
    <Animated.View
      style={[
        styles.dotRow,
        {
          transform: [{ translateX: shake }],
        },
      ]}
    >
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i < filled ? colors.primary : 'transparent',
              borderColor: i < filled ? colors.primary : colors.border,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

function KeyPad({
  onPress,
  onDelete,
  disabled,
}: {
  onPress: (k: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.keypad}>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.keyRow}>
          {row.map((key, ki) => {
            if (key === '') {
              return <View key={ki} style={styles.keyEmpty} />;
            }
            if (key === 'del') {
              return (
                <TouchableOpacity
                  key={ki}
                  onPress={() => {
                    if (disabled) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDelete();
                  }}
                  style={[styles.key, { backgroundColor: colors.muted }]}
                  activeOpacity={0.7}
                >
                  <Feather name="delete" size={20} color={colors.foreground} />
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={ki}
                onPress={() => {
                  if (disabled) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPress(key);
                }}
                style={[
                  styles.key,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    opacity: disabled ? 0.4 : 1,
                  },
                ]}
                activeOpacity={0.7}
                disabled={disabled}
              >
                <Text style={[styles.keyText, { color: colors.foreground }]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function PinScreen({
  mode,
  title,
  subtitle,
  failedAttempts = 0,
  remainingLockout = 0,
  isLocked = false,
  onSubmit,
  onCancel,
}: PinScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (failedAttempts > 0 && failedAttempts < 5) {
      const remaining = 5 - failedAttempts;
      setError(`Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [failedAttempts]);

  useEffect(() => {
    if (remainingLockout > 0) {
      setError('');
      setPin('');
    }
  }, [remainingLockout]);

  function handleKey(key: string) {
    if (pin.length >= PIN_LENGTH) return;
    if (isLocked || remainingLockout > 0) return;
    const next = pin + key;
    setPin(next);
    setError('');
    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        onSubmit(next);
        setPin('');
      }, 120);
    }
  }

  function handleDelete() {
    if (remainingLockout > 0) return;
    setPin(prev => prev.slice(0, -1));
    setError('');
  }

  const isDisabled = remainingLockout > 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad },
      ]}
    >
      <View style={styles.topArea}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <MaterialCommunityIcons
            name={mode === 'unlock' ? 'lock-outline' : 'lock-reset'}
            size={32}
            color={colors.primary}
          />
        </View>

        <Text style={[styles.appName, { color: colors.mutedForeground }]}>Smart Farm</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={styles.midArea}>
        <DotRow filled={pin.length} shake={shakeAnim} />

        {isDisabled ? (
          <View style={[styles.lockoutBox, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive + '30' }]}>
            <MaterialCommunityIcons name="timer-sand" size={16} color={colors.destructive} />
            <Text style={[styles.lockoutText, { color: colors.destructive }]}>
              Too many attempts. Try again in {remainingLockout}s
            </Text>
          </View>
        ) : error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '30' }]}>
            <MaterialCommunityIcons name="alert-outline" size={15} color={colors.warning} />
            <Text style={[styles.errorText, { color: colors.warning }]}>{error}</Text>
          </View>
        ) : (
          <View style={styles.errorPlaceholder} />
        )}
      </View>

      <KeyPad onPress={handleKey} onDelete={handleDelete} disabled={isDisabled} />

      <View style={styles.bottomArea}>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.securityNote, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.securityNoteText, { color: colors.mutedForeground }]}>
            PIN never transmitted. Stored locally only.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  topArea: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  midArea: {
    alignItems: 'center',
    gap: 16,
    minHeight: 80,
    justifyContent: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  lockoutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  lockoutText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  errorPlaceholder: {
    height: 36,
  },
  keypad: {
    gap: 14,
    width: '100%',
    maxWidth: 280,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 24,
    fontFamily: 'Inter_400Regular',
  },
  bottomArea: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  securityNoteText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
