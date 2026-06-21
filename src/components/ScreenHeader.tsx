import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';

export type ScreenHeaderProps = {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: ReactNode;
};

export function ScreenHeader({
  title,
  showBackButton = false,
  onBackPress,
  rightElement,
}: ScreenHeaderProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <LinearGradient
      colors={[theme.background, `${theme.primary}14`]} // subtle theme.primary tint (8%)
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerContainer}
    >
      <View style={styles.row}>
        {/* Left Container */}
        <View style={styles.leftContainer}>
          {showBackButton && onBackPress && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Container */}
        <View style={styles.centerContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Container */}
        <View style={styles.rightContainer}>
          {rightElement || <View style={{ width: 40 }} />}
        </View>
      </View>
    </LinearGradient>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    headerContainer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftContainer: {
      width: 40,
      alignItems: 'flex-start',
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: spacing.sm,
    },
    rightContainer: {
      width: 40,
      alignItems: 'flex-end',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
  });
