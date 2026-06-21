import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius } from '@theme/spacing';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, disabled, style }: ButtonProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.primary, disabled && styles.primaryDisabled, style]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <Text style={[styles.primaryText, disabled && styles.primaryTextDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function OutlineButton({ label, onPress, style }: ButtonProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.outline, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.outlineText}>{label}</Text>
    </TouchableOpacity>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    primary: {
      backgroundColor: theme.primary,
      borderRadius: radius.full,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryDisabled: {
      backgroundColor: theme.surfaceLight,
      opacity: 0.6,
    },
    primaryText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF', // Contrast white text for both light and dark themes
    },
    primaryTextDisabled: {
      color: theme.textMuted,
    },
    outline: {
      backgroundColor: theme.background,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: theme.primary,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlineText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.primary,
    },
  });
