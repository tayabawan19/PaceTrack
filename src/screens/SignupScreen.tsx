import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AuthInput,
  PrimaryButton,
  ScreenLayout,
} from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { spacing } from '@theme/spacing';
import { ScreenHeader } from '@/components/ScreenHeader';

export type SignupScreenProps = {
  onBackPress: () => void;
  onSignUpPress: (email: string, password: string) => void;
  onLogInPress: () => void;
};

export function SignupScreen({
  onBackPress,
  onSignUpPress,
  onLogInPress,
}: SignupScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  return (
    <ScreenLayout padded={false}>
      <ScreenHeader title="Create Account" showBackButton onBackPress={onBackPress} />
      
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <AuthInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              placeholder="At least 6 characters"
            />
          </View>

          <PrimaryButton
            label="Sign Up"
            onPress={() => onSignUpPress(email.trim(), password)}
            disabled={!canSubmit}
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onLogInPress}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    form: {
      gap: spacing.lg,
      marginBottom: spacing.lg,
    },
    submitButton: {
      marginBottom: spacing.lg,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: theme.textMuted,
    },
    footerLink: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary,
    },
  });
