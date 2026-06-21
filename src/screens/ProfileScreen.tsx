import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation, NavigationProp } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenBackground } from '@/components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestNotificationPermissions,
  scheduleStreakReminder,
  cancelStreakReminder,
} from '@/utils/notifications';

const API_URL = 'https://pacetrack-backend.onrender.com/api';

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Lose Weight',
  build_endurance: 'Build Endurance',
  train_race: 'Train for a Race',
  stay_active: 'Stay Active',
};

const FITNESS_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export type ProfileScreenProps = {
  onBackPress: () => void;
};

export function ProfileScreen({ onBackPress }: ProfileScreenProps) {
  const { token, signOut } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme, mode, toggleMode } = useTheme();
  const styles = getStyles(theme);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [runStats, setRunStats] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [voiceCoachingEnabled, setVoiceCoachingEnabled] = useState(true);

  const fetchProfileAndStats = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };

      const [profileRes, statsRes, notifPref, voicePref] = await Promise.all([
        fetch(`${API_URL}/auth/me`, { headers }),
        fetch(`${API_URL}/runs/stats`, { headers }),
        AsyncStorage.getItem('@notification_reminder_enabled'),
        AsyncStorage.getItem('@voice_coaching_enabled'),
      ]);

      if (!profileRes.ok || !statsRes.ok) {
        throw new Error('Failed to load profile details.');
      }

      const pData = await profileRes.json();
      const sData = await statsRes.json();

      setProfileData(pData);
      setRunStats(sData);
      setNotificationsEnabled(notifPref !== 'false');
      setVoiceCoachingEnabled(voicePref !== 'false');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('@notification_reminder_enabled', value ? 'true' : 'false');
      if (value) {
        const granted = await requestNotificationPermissions();
        if (granted) {
          await scheduleStreakReminder();
        } else {
          Alert.alert(
            'Permissions Required',
            'Please enable notifications in your device settings to receive reminders.'
          );
          setNotificationsEnabled(false);
          await AsyncStorage.setItem('@notification_reminder_enabled', 'false');
        }
      } else {
        await cancelStreakReminder();
      }
    } catch (err) {
      console.error('[Profile] Error toggling notifications:', err);
    }
  };
 
  const handleToggleVoiceCoaching = async (value: boolean) => {
    setVoiceCoachingEnabled(value);
    try {
      await AsyncStorage.setItem('@voice_coaching_enabled', value ? 'true' : 'false');
    } catch (err) {
      console.error('[Profile] Error toggling voice coaching:', err);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, [token]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          signOut();
          // Reset navigation stack to Welcome screen
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            })
          );
        },
      },
    ]);
  };

  const getMemberSince = (createdAtStr?: string) => {
    if (!createdAtStr) return 'Joined';
    const date = new Date(createdAtStr);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (error || !profileData || !runStats) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Failed to load profile data.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfileAndStats}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const { email, profile, createdAt } = profileData;
  const displayName = profile?.name || email.split('@')[0] || 'Runner';
  const initial = displayName.charAt(0).toUpperCase();

  // Formatting utility fields
  const displayGoal = profile?.goal ? (GOAL_LABELS[profile.goal] || profile.goal) : 'Not set';
  const displayFitness = profile?.fitnessLevel
    ? (FITNESS_LABELS[profile.fitnessLevel] || profile.fitnessLevel)
    : 'Not set';
  const displayGender = profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set';
  const displayHeight = profile?.height ? `${profile.height} cm` : 'Not set';
  const displayWeight = profile?.weight ? `${profile.weight} kg` : 'Not set';
  const displayAge = profile?.age ? `${profile.age} years` : 'Not set';
  const displayTarget = profile?.weeklyGoalKm ? `${profile.weeklyGoalKm} km` : 'Not set';

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.statusBarStyle} />
      
      {/* Redesigned Header Component */}
      <ScreenHeader title="Profile" showBackButton onBackPress={onBackPress} />
 
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar and Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>

        {/* Highlight Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{runStats.totalRuns}</Text>
            <Text style={styles.statLabel}>Total Runs</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{runStats.totalDistanceKm.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Total Dist</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValueCompact}>{getMemberSince(createdAt)}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>

        {/* Profile Detail List */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsCardTitle}>Account details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{displayAge}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="male-female-outline" size={20} color={theme.primary} />
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{displayGender}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="body-outline" size={20} color={theme.primary} />
            <Text style={styles.detailLabel}>Height</Text>
            <Text style={styles.detailValue}>{displayHeight}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="barbell-outline" size={20} color={theme.primary} />
            <Text style={styles.detailLabel}>Weight</Text>
            <Text style={styles.detailValue}>{displayWeight}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="fitness-outline" size={20} color={theme.primary} />
            <Text style={styles.detailLabel}>Fitness Level</Text>
            <Text style={styles.detailValue}>{displayFitness}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="trophy-outline" size={20} color={theme.primary} />
            <Text style={styles.detailLabel}>Fitness Goal</Text>
            <Text style={styles.detailValue}>{displayGoal}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="flag-outline" size={20} color={theme.primary} />
            <Text style={styles.detailLabel}>Weekly Target</Text>
            <Text style={styles.detailValue}>{displayTarget}</Text>
          </View>

          {/* Achievements Navigation Row */}
          <TouchableOpacity
            style={styles.detailRowPressable}
            onPress={() => navigation.navigate('Achievements')}
            activeOpacity={0.7}
          >
            <Ionicons name="trophy-outline" size={20} color={theme.primary} />
            <Text style={styles.detailLabel}>Achievements</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Dark Mode Switch Toggle Row */}
          <View style={styles.detailRow}>
            <Ionicons 
              name={mode === 'dark' ? 'moon' : 'sunny'} 
              size={20} 
              color={theme.primary} 
            />
            <Text style={styles.detailLabel}>Dark Mode</Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleMode}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={Platform.OS === 'android' ? (mode === 'dark' ? theme.primary : '#f4f3f4') : undefined}
              ios_backgroundColor={theme.border}
            />
          </View>

          {/* Notifications Switch Toggle Row */}
          <View style={styles.detailRow}>
            <Ionicons 
              name="notifications-outline" 
              size={20} 
              color={theme.primary} 
            />
            <Text style={styles.detailLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={Platform.OS === 'android' ? (notificationsEnabled ? theme.primary : '#f4f3f4') : undefined}
              ios_backgroundColor={theme.border}
            />
          </View>

          {/* Voice Coaching Switch Toggle Row */}
          <View style={styles.detailRow}>
            <Ionicons 
              name="volume-high-outline" 
              size={20} 
              color={theme.primary} 
            />
            <Text style={styles.detailLabel}>Voice Coaching</Text>
            <Switch
              value={voiceCoachingEnabled}
              onValueChange={handleToggleVoiceCoaching}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={Platform.OS === 'android' ? (voiceCoachingEnabled ? theme.primary : '#f4f3f4') : undefined}
              ios_backgroundColor={theme.border}
            />
          </View>
        </View>

        {/* Edit and Logout actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => Alert.alert('Edit Profile', 'Editing profile is coming soon.')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    errorText: {
      fontSize: 16,
      color: theme.text,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: theme.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    retryButtonText: {
      color: '#FFFFFF', // Contrast white text
      fontSize: 16,
      fontWeight: '700',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    avatarSection: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    avatarCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    avatarLetter: {
      fontSize: 36,
      fontWeight: '700',
      color: '#FFFFFF', // Contrast white text
    },
    profileName: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
    },
    profileEmail: {
      fontSize: 14,
      color: theme.textMuted,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    statValueCompact: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      paddingVertical: 2,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: spacing.xs,
    },
    detailsCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    detailsCardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: spacing.xs,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textMuted,
    },
    actionsContainer: {
      gap: spacing.md,
      marginTop: spacing.sm,
      alignItems: 'center',
    },
    editButton: {
      width: '100%',
      borderColor: theme.primary,
      borderWidth: 1.5,
      borderRadius: radius.full,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.primary,
    },
    detailRowPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 2,
    },
    logoutButton: {
      paddingVertical: spacing.sm,
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#EF4444', // Red danger text
    },
  });
