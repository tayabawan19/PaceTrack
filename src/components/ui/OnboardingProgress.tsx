import { StyleSheet, View } from 'react-native';

import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

type OnboardingProgressProps = {
  currentStep: number;
  totalSteps?: number;
};

export function OnboardingProgress({
  currentStep,
  totalSteps = 5,
}: OnboardingProgressProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isActive = step <= currentStep;
        return (
          <View
            key={step}
            style={[styles.dot, isActive ? styles.dotActive : styles.dotInactive]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: colors.border,
  },
});
