import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  OnboardingProgress,
  PrimaryButton,
  ScreenLayout,
} from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';

const MIN_KM = 1;
const MAX_KM = 100;

export type OnboardingWeeklyGoalScreenProps = {
  initialKm?: number;
  onFinishPress: (weeklyGoalKm: number) => void;
};

export function OnboardingWeeklyGoalScreen({
  initialKm = 10,
  onFinishPress,
}: OnboardingWeeklyGoalScreenProps) {
  const [km, setKm] = useState(initialKm);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const decrement = () => setKm((value) => Math.max(MIN_KM, value - 1));
  const increment = () => setKm((value) => Math.min(MAX_KM, value + 1));

  return (
    <ScreenLayout>
      <OnboardingProgress currentStep={5} />

      <View style={styles.body}>
        <Text style={styles.title}>Set your weekly running goal</Text>

        <View style={styles.goalCard}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={decrement}
            activeOpacity={0.85}
          >
            <Ionicons name="remove" size={28} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.goalDisplay}>
            <Text style={styles.goalValue}>{km}</Text>
            <Text style={styles.goalUnit}>km / week</Text>
          </View>

          <TouchableOpacity
            style={styles.adjustButton}
            onPress={increment}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <PrimaryButton
        label="Finish Setup"
        onPress={() => onFinishPress(km)}
        style={styles.finishButton}
      />
    </ScreenLayout>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    body: {
      flex: 1,
      paddingTop: spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: spacing.xl,
    },
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    adjustButton: {
      width: 52,
      height: 52,
      borderRadius: radius.full,
      backgroundColor: theme.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalDisplay: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    goalValue: {
      fontSize: 48,
      fontWeight: '700',
      color: theme.text,
    },
    goalUnit: {
      fontSize: 15,
      color: theme.textMuted,
    },
    finishButton: {
      marginBottom: spacing.md,
    },
  });
