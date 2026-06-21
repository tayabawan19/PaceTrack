import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';
import { ScreenHeader } from '@/components/ScreenHeader';
import { IconCircle } from '@/components/IconCircle';
import { ScreenBackground } from '@/components/ui';

const API_URL = 'https://pacetrack-backend.onrender.com/api';

type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export type AchievementsScreenProps = {
  onBackPress: () => void;
};

export function AchievementsScreen({ onBackPress }: AchievementsScreenProps) {
  const { token } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const fetchAchievements = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/runs/achievements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve achievements.');
      }

      const data = await response.json();
      setAchievements(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [token]);

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (error) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAchievements}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const unlockedPercentage = totalCount > 0 ? unlockedCount / totalCount : 0;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.statusBarStyle} />

      {/* Redesigned Header Component */}
      <ScreenHeader title="Achievements" showBackButton onBackPress={onBackPress} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            {unlockedCount} of {totalCount} unlocked
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${unlockedPercentage * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Grid layout */}
        <View style={styles.grid}>
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.card,
                !achievement.unlocked && styles.cardLocked,
              ]}
            >
              <IconCircle
                name={achievement.unlocked ? 'trophy' : 'lock-closed'}
                size={24}
                filled={achievement.unlocked}
              />
              <Text style={styles.cardTitle}>{achievement.title}</Text>
              <Text style={styles.cardDescription}>{achievement.description}</Text>
            </View>
          ))}
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
      color: '#FFFFFF',
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
    progressCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      gap: spacing.sm,
    },
    progressText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: theme.surfaceLight,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: radius.full,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    card: {
      width: '47.5%',
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      textAlign: 'center',
      gap: spacing.sm,
    },
    cardLocked: {
      opacity: 0.4,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    cardDescription: {
      fontSize: 11,
      color: theme.textMuted,
      textAlign: 'center',
    },
  });
