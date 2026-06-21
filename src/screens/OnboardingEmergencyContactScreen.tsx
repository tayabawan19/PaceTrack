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
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';

export type OnboardingEmergencyContactScreenProps = {
  initialName?: string;
  initialPhone?: string;
  onFinishPress: (name: string, phone: string) => void;
  onSkipPress: () => void;
};

export function OnboardingEmergencyContactScreen({
  initialName = '',
  initialPhone = '',
  onFinishPress,
  onSkipPress,
}: OnboardingEmergencyContactScreenProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const { theme } = useTheme();
  const styles = getStyles(theme);

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
          <OnboardingProgress currentStep={7} totalSteps={7} />

          <Text style={styles.title}>Emergency contact</Text>
          <Text style={styles.subtitle}>
            Optional, but recommended for solo runs
          </Text>

          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter contact name"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Contact Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Finish Setup"
            onPress={() => onFinishPress(name.trim(), phone.trim())}
            style={styles.finishButton}
          />

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkipPress}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
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
    form: {
      gap: spacing.lg,
    },
    section: {
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
    footer: {
      gap: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    finishButton: {
      width: '100%',
    },
    skipButton: {
      paddingVertical: spacing.xs,
    },
    skipText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textMuted,
      textDecorationLine: 'underline',
    },
  });
