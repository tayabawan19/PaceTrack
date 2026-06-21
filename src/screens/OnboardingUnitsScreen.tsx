import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import {
  OnboardingProgress,
  PrimaryButton,
  ScreenLayout,
} from '@/components/ui';
import type { PreferredUnits } from '@/context/OnboardingContext';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';

type UnitOption = {
  value: PreferredUnits;
  title: string;
  description: string;
};

const UNIT_OPTIONS: UnitOption[] = [
  {
    value: 'metric',
    title: 'Kilometers & kg',
    description: 'Use metric system for distance and weight calculations',
  },
  {
    value: 'imperial',
    title: 'Miles & lbs',
    description: 'Use imperial system for distance and weight calculations',
  },
];

export type OnboardingUnitsScreenProps = {
  initialUnits?: PreferredUnits;
  onContinuePress: (units: PreferredUnits) => void;
};

export function OnboardingUnitsScreen({
  initialUnits = 'metric',
  onContinuePress,
}: OnboardingUnitsScreenProps) {
  const [selected, setSelected] = useState<PreferredUnits>(initialUnits);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <ScreenLayout>
      <OnboardingProgress currentStep={4} totalSteps={7} />

      <Text style={styles.title}>Preferred units</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {UNIT_OPTIONS.map((option) => {
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
        onPress={() => onContinuePress(selected)}
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
