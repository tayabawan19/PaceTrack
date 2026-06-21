import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  PrimaryButton,
  ScreenLayout,
} from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';
import { ScreenHeader } from '@/components/ScreenHeader';

const OTP_LENGTH = 6;

export type OtpVerificationScreenProps = {
  email: string;
  onVerifyPress: (code: string) => void;
  onResendPress: () => void;
  onBackPress: () => void;
};

export function OtpVerificationScreen({
  email,
  onVerifyPress,
  onResendPress,
  onBackPress,
}: OtpVerificationScreenProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const canVerify = code.length === OTP_LENGTH;

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(digits);
  };

  return (
    <ScreenLayout padded={false}>
      <ScreenHeader title="Verify Email" showBackButton onBackPress={onBackPress} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            autoFocus
          />

          <Pressable style={styles.otpRow} onPress={() => inputRef.current?.focus()}>
            {Array.from({ length: OTP_LENGTH }, (_, index) => {
              const digit = code[index] ?? '';
              const isFocused = code.length === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isFocused && styles.otpBoxFocused,
                    digit !== '' && styles.otpBoxFilled,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit}</Text>
                </View>
              );
            })}
          </Pressable>

          <PrimaryButton
            label="Verify"
            onPress={() => onVerifyPress(code)}
            disabled={!canVerify}
            style={styles.verifyButton}
          />

          <Text style={styles.resendText}>
            Didn&apos;t receive the code?{' '}
            <Text style={styles.resendLink} onPress={onResendPress}>
              Resend
            </Text>
          </Text>
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
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: spacing.md,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.textMuted,
      marginBottom: spacing.xl,
    },
    email: {
      color: theme.text,
      fontWeight: '600',
    },
    hiddenInput: {
      position: 'absolute',
      opacity: 0,
      height: 0,
      width: 0,
    },
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    otpBox: {
      flex: 1,
      aspectRatio: 1,
      maxWidth: 48,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    otpBoxFocused: {
      borderColor: theme.primary,
    },
    otpBoxFilled: {
      borderColor: theme.primary,
    },
    otpDigit: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
    },
    verifyButton: {
      marginBottom: spacing.lg,
    },
    resendText: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
    },
    resendLink: {
      color: theme.primary,
      fontWeight: '600',
    },
  });
