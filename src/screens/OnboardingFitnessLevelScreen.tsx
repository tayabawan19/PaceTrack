import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  OnboardingProgress,
  PrimaryButton,
  ScreenLayout,
} from '@/components/ui';
import type { FitnessLevel } from '@/context/OnboardingContext';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';

type LevelOption = {
  value: FitnessLevel;
  title: string;
  description: string;
};

const LEVEL_OPTIONS: LevelOption[] = [
  {
    value: 'beginner',
    title: 'Beginner',
    description: 'Just getting started with running',
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    description: 'Run regularly, building consistency',
  },
  {
    value: 'advanced',
    title: 'Advanced',
    description: 'Experienced runner chasing PRs',
  },
];

export type OnboardingFitnessLevelScreenProps = {
  initialLevel?: FitnessLevel | null;
  onContinuePress: (level: FitnessLevel) => void;
};

export function OnboardingFitnessLevelScreen({
  initialLevel = null,
  onContinuePress,
}: OnboardingFitnessLevelScreenProps) {
  const [selected, setSelected] = useState<FitnessLevel | null>(initialLevel);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <ScreenLayout>
      <OnboardingProgress currentStep={5} totalSteps={7} />

      <Text style={styles.title}>What&apos;s your fitness level?</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {LEVEL_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelected(option.value)}
              activeOpacity={0.85}
            >
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <PrimaryButton
        label="Continue"
        onPress={() => onContinuePress(selected as FitnessLevel)}
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
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    cardSelected: {
      borderColor: theme.primary,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    cardDescription: {
      fontSize: 14,
      color: theme.textMuted,
    },
    continueButton: {
      marginBottom: spacing.md,
    },
  });
