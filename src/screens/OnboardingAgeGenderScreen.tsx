import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  OnboardingProgress,
  PrimaryButton,
  ScreenLayout,
} from '@/components/ui';
import type { Gender } from '@/context/OnboardingContext';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export type OnboardingAgeGenderScreenProps = {
  initialAge?: string;
  initialGender?: Gender | null;
  onContinuePress: (age: string, gender: Gender) => void;
};

export function OnboardingAgeGenderScreen({
  initialAge = '',
  initialGender = null,
  onContinuePress,
}: OnboardingAgeGenderScreenProps) {
  const [age, setAge] = useState(initialAge);
  const [gender, setGender] = useState<Gender | null>(initialGender);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const canContinue =
    age.trim().length > 0 && Number(age) > 0 && gender !== null;

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
          <OnboardingProgress currentStep={2} totalSteps={7} />

          <Text style={styles.title}>Tell us about yourself</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={(value) => setAge(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="Enter your age"
              placeholderTextColor={theme.textMuted}
              maxLength={3}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pillRow}>
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pill, selected && styles.pillSelected]}
                    onPress={() => setGender(option.value)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selected && styles.pillTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <PrimaryButton
          label="Continue"
          onPress={() => onContinuePress(age.trim(), gender as Gender)}
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
      marginBottom: spacing.xl,
    },
    section: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
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
    pillRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pill: {
      flex: 1,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: theme.primary,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    pillText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
    pillTextSelected: {
      color: theme.text,
    },
    continueButton: {
      marginBottom: spacing.md,
    },
  });
