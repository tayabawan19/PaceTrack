import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

export type OnboardingNameScreenProps = {
  initialName?: string;
  onContinuePress: (name: string) => void;
};

export function OnboardingNameScreen({
  initialName = '',
  onContinuePress,
}: OnboardingNameScreenProps) {
  const [name, setName] = useState(initialName);
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const canContinue = name.trim().length > 0;

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <OnboardingProgress currentStep={1} totalSteps={7} />

        <View style={styles.body}>
          <Text style={styles.title}>What&apos;s your name?</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={theme.textMuted}
            autoFocus
          />
        </View>

        <PrimaryButton
          label="Continue"
          onPress={() => onContinuePress(name.trim())}
          disabled={!canContinue}
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
    body: {
      flex: 1,
      paddingTop: spacing.lg,
      gap: spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
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
  });
