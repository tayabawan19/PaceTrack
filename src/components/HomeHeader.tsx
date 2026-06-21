import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';

export type HomeHeaderProps = {
  userName: string;
  currentStreak: number;
  onProfilePress: () => void;
  onNotificationsPress?: () => void;
};

export function HomeHeader({
  userName,
  currentStreak,
  onProfilePress,
  onNotificationsPress,
}: HomeHeaderProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const displayName = userName || 'Runner';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <LinearGradient
      colors={[theme.background, `${theme.primary}14`]} // 8% opacity tint of theme.primary
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerContainer}
    >
      <View style={styles.row}>
        {/* Left Side */}
        <View style={styles.leftContainer}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
          {currentStreak > 0 ? (
            <Text style={styles.subtitle}>
              🔥 <Text style={styles.streakText}>{currentStreak} day streak</Text> — keep it going!
            </Text>
          ) : (
            <Text style={styles.subtitle}>{getFormattedDate()}</Text>
          )}
        </View>

        {/* Right Side */}
        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationsPress || (() => Alert.alert('Notifications', 'Coming soon!'))}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradientBorder}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{initial}</Text>
              </View>
            </LinearGradient>
            {currentStreak > 0 && (
              <View style={styles.flameBadge}>
                <Ionicons name="flame" size={12} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    headerContainer: {
      marginHorizontal: -spacing.lg,
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
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftContainer: {
      flex: 1,
      marginRight: spacing.md,
    },
    greeting: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '500',
    },
    userName: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.text,
      marginVertical: 2,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textMuted,
      fontWeight: '500',
    },
    streakText: {
      fontWeight: '700',
      color: theme.primary,
    },
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    notificationButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatarGradientBorder: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
    },
    flameBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.background,
    },
  });
