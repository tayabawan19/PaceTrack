import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  OnboardingProgress,
  PrimaryButton,
  ScreenLayout,
} from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';

export type OnboardingHeightWeightScreenProps = {
  initialHeight?: string;
  initialWeight?: string;
  onContinuePress: (height: string, weight: string) => void;
};

export function OnboardingHeightWeightScreen({
  initialHeight = '',
  initialWeight = '',
  onContinuePress,
}: OnboardingHeightWeightScreenProps) {
  const [height, setHeight] = useState(initialHeight);
  const [weight, setWeight] = useState(initialWeight);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const canContinue =
    height.trim().length > 0 &&
    Number(height) > 0 &&
    weight.trim().length > 0 &&
    Number(weight) > 0;

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <OnboardingProgress currentStep={3} totalSteps={7} />

          <Text style={styles.title}>Your height & weight</Text>
          <Text style={styles.subtitle}>
            This helps us calculate your calories accurately
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={(value) => setHeight(value.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="170"
                placeholderTextColor={theme.textMuted}
                maxLength={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={(value) => setWeight(value.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="70"
                placeholderTextColor={theme.textMuted}
                maxLength={3}
              />
            </View>
          </View>
        </ScrollView>

        <PrimaryButton
          label="Continue"
          onPress={() => onContinuePress(height.trim(), weight.trim())}
          disabled={!canContinue}
          style={styles.continueButton}
        />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: spacing.md,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textMuted,
      marginBottom: spacing.xl,
    },
    inputRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    inputContainer: {
      flex: 1,
      gap: spacing.xs,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    input: {
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 18,
      color: theme.text,
    },
    continueButton: {
      marginBottom: spacing.md,
    },
  });
