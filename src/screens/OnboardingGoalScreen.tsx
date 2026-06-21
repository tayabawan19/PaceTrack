import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  OnboardingProgress,
  PrimaryButton,
  ScreenLayout,
} from '@/components/ui';
import type { FitnessGoal } from '@/context/OnboardingContext';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';
import { IconCircle } from '@/components/IconCircle';

type GoalOption = {
  value: FitnessGoal;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const GOAL_OPTIONS: GoalOption[] = [
  { value: 'lose_weight', title: 'Lose Weight', icon: 'flame' },
  { value: 'build_endurance', title: 'Build Endurance', icon: 'heart' },
  { value: 'train_race', title: 'Train for a Race', icon: 'trophy' },
  { value: 'stay_active', title: 'Stay Active', icon: 'walk' },
];

export type OnboardingGoalScreenProps = {
  initialGoal?: FitnessGoal | null;
  onContinuePress: (goal: FitnessGoal) => void;
};

export function OnboardingGoalScreen({
  initialGoal = null,
  onContinuePress,
}: OnboardingGoalScreenProps) {
  const [selected, setSelected] = useState<FitnessGoal | null>(initialGoal);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <ScreenLayout>
      <OnboardingProgress currentStep={6} totalSteps={7} />

      <Text style={styles.title}>What&apos;s your main goal?</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {GOAL_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelected(option.value)}
              activeOpacity={0.85}
            >
              <IconCircle name={option.icon} size={24} filled={false} />
              <Text style={styles.cardTitle}>{option.title}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <PrimaryButton
        label="Continue"
        onPress={() => onContinuePress(selected as FitnessGoal)}
        disabled={selected === null}
        style={styles.continueButton}
      />
    </ScreenLayout>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: spacing.lg,
    },
    list: {
      flex: 1,
    },
    listContent: {
      gap: spacing.md,
      paddingBottom: spacing.md,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    cardSelected: {
      borderColor: theme.primary,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    continueButton: {
      marginBottom: spacing.md,
    },
  });
