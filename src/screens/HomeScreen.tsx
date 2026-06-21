import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-chart-kit';

import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@/theme/spacing';
import { SkeletonBox } from '@/components/SkeletonBox';
import { HomeHeader } from '@/components/HomeHeader';
import { IconCircle } from '@/components/IconCircle';
import { ScreenBackground } from '@/components/ui';

// MOCKED — requires wearable device integration (e.g. Apple Health / Google Fit), not available from phone GPS alone
const MOCK_HEART_RATE = 124;
const PHOTO_HERO_IMAGE_URI = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600';
const screenWidth = Dimensions.get('window').width;

// Helper to group and aggregate weekly calories from runs list
const getLast7DaysData = (runs: any[]) => {
  const labels: string[] = [];
  const data: number[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    labels.push(label);

    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const dayCalories = runs
      .filter((run) => {
        const runTime = new Date(run.startedAt).getTime();
        return runTime >= startOfDay && runTime < endOfDay;
      })
      .reduce((sum, run) => sum + (run.caloriesBurned || 0), 0);

    data.push(dayCalories);
  }

  return { labels, data };
};

// Change this URL if your local development server IP changes
const API_URL = 'http://192.168.100.2:5000/api';

type HomeScreenProps = {
  userName?: string;
  onStartRunPress: () => void;
};

type ProgressRingProps = {
  progress: number;
  children: ReactNode;
};

const RING_SIZE = 200;
const RING_STROKE = 12;

function ProgressRing({ progress, children }: ProgressRingProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const clamped = Math.min(1, Math.max(0, progress));
  const angle = clamped * 360;
  const firstHalf = Math.min(angle, 180);
  const secondHalf = Math.max(angle - 180, 0);

  return (
    <View style={styles.ringOuter}>
      <View style={styles.ringTrack} />

      {firstHalf > 0 && (
        <View style={styles.ringHalfLeft}>
          <View
            style={[
              styles.ringHalfRotatorLeft,
              { transform: [{ rotate: `${firstHalf}deg` }] },
            ]}
          >
            <View style={styles.ringHalfArcLeft} />
          </View>
        </View>
      )}

      {secondHalf > 0 && (
        <View style={styles.ringHalfRight}>
          <View
            style={[
              styles.ringHalfRotatorRight,
              { transform: [{ rotate: `${secondHalf}deg` }] },
            ]}
          >
            <View style={styles.ringHalfArcRight} />
          </View>
        </View>
      )}

      <View style={styles.ringCenter}>{children}</View>
    </View>
  );
}

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  subtext?: string;
};

function StatCard({ icon, value, label, subtext }: StatCardProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.statCard}>
      <IconCircle name={icon} size={20} filled={false} style={{ marginBottom: spacing.xs }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
    </View>
  );
}

type RecentRunCardProps = {
  date: string;
  distance: string;
  duration: string;
  onPress: () => void;
};

function RecentRunCard({ date, distance, duration, onPress }: RecentRunCardProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <TouchableOpacity style={styles.recentRunCard} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.recentRunDate}>{date}</Text>
      <Text style={styles.recentRunDistance}>{distance}</Text>
      <Text style={styles.recentRunDuration}>{duration}</Text>
    </TouchableOpacity>
  );
}

export function HomeScreen({ onStartRunPress }: HomeScreenProps) {
  const { token } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [allRuns, setAllRuns] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number } | null>(null);
  const [loadingPastRunId, setLoadingPastRunId] = useState<string | null>(null);

  const chartData = useMemo(() => {
    return getLast7DaysData(allRuns);
  }, [allRuns]);

  const fetchDashboardData = async (isRefreshing = false) => {
    if (!token) return;
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, meRes, runsRes, streakRes] = await Promise.all([
        fetch(`${API_URL}/runs/stats`, { headers }),
        fetch(`${API_URL}/auth/me`, { headers }),
        fetch(`${API_URL}/runs`, { headers }),
        fetch(`${API_URL}/runs/streak`, { headers }),
      ]);

      if (!statsRes.ok || !meRes.ok || !runsRes.ok || !streakRes.ok) {
        throw new Error('Failed to retrieve dashboard information.');
      }

      const statsData = await statsRes.json();
      const meData = await meRes.json();
      const runsData = await runsRes.json();
      const streakData = await streakRes.json();

      setStats(statsData);
      setUserInfo(meData);
      setAllRuns(runsData);
      setRecentRuns(runsData.slice(0, 5)); // display the 5 most recent runs
      setStreak(streakData);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while fetching data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Greeting parser based on current time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Convert pace value to min'sec"
  const formatPace = (pace: number) => {
    if (!pace || pace === 0) return '--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

  const handleRecentRunPress = async (runId: string) => {
    setLoadingPastRunId(runId);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${API_URL}/runs/${runId}`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to load past run details.');
      }
      
      const runDetails = await response.json();
      // Navigate to RunSummary Screen in read-only mode
      navigation.navigate('RunSummary', { runData: runDetails, isReadOnly: true });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not fetch run details.');
    } finally {
      setLoadingPastRunId(null);
    }
  };

  if (loading) {
    return (
      <ScreenBackground style={{ backgroundColor: 'transparent' }}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style={theme.statusBarStyle} />
          <View style={styles.scrollContent}>
            {/* Header skeleton matching HomeHeader */}
            <View style={[styles.header, { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: spacing.lg }]}>
              <View style={styles.headerText}>
                <SkeletonBox width={100} height={14} borderRadius={radius.sm} style={{ marginBottom: spacing.xs }} />
                <SkeletonBox width={180} height={28} borderRadius={radius.sm} style={{ marginBottom: spacing.xs }} />
                <SkeletonBox width={140} height={12} borderRadius={radius.sm} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <SkeletonBox width={24} height={24} borderRadius={radius.full} />
                <SkeletonBox width={64} height={64} borderRadius={radius.full} />
              </View>
            </View>

            {/* Hero progress ring card skeleton */}
            <View style={[styles.heroCard, { alignItems: 'center', justifyContent: 'center' }]}>
              <SkeletonBox width={RING_SIZE} height={RING_SIZE} borderRadius={RING_SIZE / 2} />
              <SkeletonBox width={150} height={20} borderRadius={radius.sm} style={{ marginTop: spacing.md }} />
            </View>

            {/* Stat Cards row skeleton */}
            <View style={styles.statsRow}>
              <SkeletonBox width="30%" height={90} borderRadius={radius.md} />
              <SkeletonBox width="30%" height={90} borderRadius={radius.md} />
              <SkeletonBox width="30%" height={90} borderRadius={radius.md} />
            </View>

            {/* Start Run button skeleton */}
            <SkeletonBox width="100%" height={56} borderRadius={radius.full} style={{ marginBottom: spacing.lg }} />

            {/* Recent Runs section skeleton */}
            <View style={styles.recentSection}>
              <SkeletonBox width={120} height={22} borderRadius={radius.sm} style={{ marginBottom: spacing.md }} />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <SkeletonBox width={140} height={100} borderRadius={radius.md} />
                <SkeletonBox width={140} height={100} borderRadius={radius.md} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (error) {
    return (
      <ScreenBackground style={{ backgroundColor: 'transparent' }}>
        <SafeAreaView style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboardData()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const displayName = userInfo?.profile?.name || userInfo?.email?.split('@')[0] || 'Runner';
  const totalRuns = stats?.totalRuns || 0;
  const isStateA = totalRuns === 0;

  return (
    <ScreenBackground style={{ backgroundColor: 'transparent' }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.statusBarStyle} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDashboardData(true)}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {/* Redesigned Header Component */}
          <HomeHeader
            userName={displayName}
            currentStreak={streak?.currentStreak || 0}
            onProfilePress={() => navigation.navigate('Profile')}
          />

          {isStateA ? (
            <>
              {/* Hero progress card */}
              <View style={styles.heroCard}>
                <ProgressRing progress={0}>
                  <Text style={styles.heroEmptyText}>Let&apos;s get moving</Text>
                </ProgressRing>
                <Text style={styles.heroGoalLabelMuted}>
                  Your first run starts your journey
                </Text>
              </View>

              {/* Stat Cards row */}
              <View style={styles.statsRow}>
                <StatCard
                  icon="footsteps"
                  value="—"
                  label="Steps"
                  subtext="After your first run"
                />
                <StatCard
                  icon="flame"
                  value="—"
                  label="Calories"
                  subtext="After your first run"
                />
                <StatCard
                  icon="speedometer"
                  value="—"
                  label="Avg Pace"
                  subtext="After your first run"
                />
              </View>
            </>
          ) : (
            <>
              {/* Photo-backed stat card */}
              <ImageBackground
                source={{ uri: PHOTO_HERO_IMAGE_URI }}
                style={styles.photoHeroCard}
                imageStyle={styles.photoHeroCardImage}
              >
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.4)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.photoHeroContent}>
                  <Text style={styles.photoHeroLabel}>Your Distance</Text>
                  <Text style={styles.photoHeroValue}>
                    {stats.todayDistanceKm.toFixed(2)} <Text style={styles.photoHeroUnit}>km</Text>
                  </Text>
                  {/* TODO: Calculate actual change vs last week when comparison data is available in the API response */}
                  <View style={styles.photoHeroBadge}>
                    <Text style={styles.photoHeroBadgeText}>+0%</Text>
                  </View>
                </View>
              </ImageBackground>

              {/* Side-by-side small cards */}
              <View style={styles.sideBySideRow}>
                <View style={styles.halfCard}>
                  <Ionicons name="footsteps" size={24} color={theme.primary} />
                  <Text style={styles.cardValue}>{stats.todaySteps.toLocaleString()}</Text>
                  <Text style={styles.cardLabel}>steps</Text>
                </View>
                <View style={styles.halfCard}>
                  <Ionicons name="heart" size={24} color="#EF4444" />
                  <Text style={styles.cardValue}>{MOCK_HEART_RATE}</Text>
                  <Text style={styles.cardLabel}>bpm</Text>
                </View>
              </View>

              {/* Calories Burnt weekly bar chart */}
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>Calories Burnt (Weekly)</Text>
                <BarChart
                  data={{
                    labels: chartData.labels,
                    datasets: [
                      {
                        data: chartData.data,
                      },
                    ],
                  }}
                  width={screenWidth - spacing.lg * 2}
                  height={200}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: theme.surface,
                    backgroundGradientTo: theme.surface,
                    fillShadowGradient: theme.primary,
                    fillShadowGradientOpacity: 1,
                    decimalPlaces: 0,
                    color: () => theme.primary,
                    labelColor: () => theme.textMuted,
                    propsForBackgroundLines: {
                      stroke: theme.border,
                      strokeWidth: 0.5,
                    },
                  }}
                  style={styles.chart}
                  withInnerLines={true}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  fromZero={true}
                  showBarTops={false}
                />
              </View>
            </>
          )}

          {/* Start Run button */}
          <TouchableOpacity
            style={[
              styles.startRunButton,
              isStateA && styles.startRunButtonProminent,
            ]}
            activeOpacity={0.85}
            onPress={onStartRunPress}
          >
            <Ionicons name="play" size={20} color={theme.text} />
            <Text style={styles.startRunText}>Start Run</Text>
          </TouchableOpacity>

          {/* Recent Runs section */}
          <View style={styles.recentSection}>
            <Text style={styles.recentSectionTitle}>Recent Runs</Text>

            {isStateA ? (
              // STATE A: Centered empty state
              <View style={styles.emptyRunsContainer}>
                <Ionicons name="map-outline" size={48} color={theme.textMuted} style={styles.emptyIcon} />
                <Text style={styles.emptyRunsTitle}>No runs yet</Text>
                <Text style={styles.emptyRunsSubtitle}>Your first run could be today</Text>
              </View>
            ) : (
              // STATE B: Real list of recent runs
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentRunsList}
              >
                {recentRuns.map((run) => {
                  const dateText = new Date(run.startedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                  const distanceText = `${run.distanceKm.toFixed(1)} km`;
                  const durationText = `${Math.floor(run.durationSeconds / 60)} min`;
                  
                  return (
                    <RecentRunCard
                      key={run._id}
                      date={dateText}
                      distance={distanceText}
                      duration={durationText}
                      onPress={() => handleRecentRunPress(run._id)}
                    />
                  );
                })}
              </ScrollView>
            )}
          </View>
        </ScrollView>

        {/* Loading overlay for past run retrieval */}
        {loadingPastRunId && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
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
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    headerText: {
      flex: 1,
    },
    profileIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.md,
    },
    heroCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    ringOuter: {
      width: RING_SIZE,
      height: RING_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringTrack: {
      position: 'absolute',
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: RING_SIZE / 2,
      borderWidth: RING_STROKE,
      borderColor: theme.border,
    },
    ringHalfLeft: {
      position: 'absolute',
      left: 0,
      width: RING_SIZE / 2,
      height: RING_SIZE,
      overflow: 'hidden',
    },
    ringHalfRight: {
      position: 'absolute',
      right: 0,
      width: RING_SIZE / 2,
      height: RING_SIZE,
      overflow: 'hidden',
    },
    ringHalfRotatorLeft: {
      width: RING_SIZE,
      height: RING_SIZE,
      position: 'absolute',
      left: 0,
      top: 0,
    },
    ringHalfRotatorRight: {
      width: RING_SIZE,
      height: RING_SIZE,
      position: 'absolute',
      left: -RING_SIZE / 2,
      top: 0,
    },
    ringHalfArcLeft: {
      width: RING_SIZE / 2,
      height: RING_SIZE,
      position: 'absolute',
      left: RING_SIZE / 2,
      borderTopRightRadius: RING_SIZE / 2,
      borderBottomRightRadius: RING_SIZE / 2,
      borderWidth: RING_STROKE,
      borderLeftWidth: 0,
      borderColor: theme.primary,
    },
    ringHalfArcRight: {
      width: RING_SIZE / 2,
      height: RING_SIZE,
      position: 'absolute',
      left: 0,
      borderTopLeftRadius: RING_SIZE / 2,
      borderBottomLeftRadius: RING_SIZE / 2,
      borderWidth: RING_STROKE,
      borderRightWidth: 0,
      borderColor: theme.primary,
    },
    ringCenter: {
      width: RING_SIZE - RING_STROKE * 2 - spacing.sm,
      height: RING_SIZE - RING_STROKE * 2 - spacing.sm,
      borderRadius: (RING_SIZE - RING_STROKE * 2 - spacing.sm) / 2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    heroDistance: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.text,
    },
    heroUnit: {
      fontSize: 14,
      color: theme.textMuted,
      marginTop: spacing.xs,
    },
    heroEmptyText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
    heroGoalLabel: {
      marginTop: spacing.md,
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '600',
    },
    heroGoalLabelMuted: {
      marginTop: spacing.md,
      fontSize: 14,
      color: theme.textMuted,
      fontStyle: 'italic',
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: theme.text,
      fontWeight: '600',
    },
    statSubtext: {
      fontSize: 9,
      color: theme.textMuted,
      textAlign: 'center',
    },
    startRunButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      borderRadius: radius.full,
      height: 52,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    startRunButtonProminent: {
      height: 52,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    startRunText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
    },
    recentSection: {
      gap: spacing.md,
    },
    recentSectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    recentRunsList: {
      gap: spacing.md,
      paddingRight: spacing.lg,
    },
    recentRunCard: {
      width: 140,
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: theme.border,
    },
    recentRunDate: {
      fontSize: 13,
      color: theme.textMuted,
    },
    recentRunDistance: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    recentRunDuration: {
      fontSize: 14,
      color: theme.textMuted,
    },
    emptyRunsContainer: {
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    emptyIcon: {
      marginBottom: spacing.xs,
    },
    emptyRunsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    emptyRunsSubtitle: {
      fontSize: 14,
      color: theme.textMuted,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99,
    },
    photoHeroCard: {
      height: 160,
      borderRadius: radius.lg,
      overflow: 'hidden',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    photoHeroCardImage: {
      borderRadius: radius.lg - 1,
    },
    photoHeroContent: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      alignItems: 'flex-start',
    },
    photoHeroLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    photoHeroValue: {
      fontSize: 32,
      fontWeight: '800',
      color: '#FFFFFF',
      marginVertical: spacing.xs,
    },
    photoHeroUnit: {
      fontSize: 18,
      fontWeight: '600',
    },
    photoHeroBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    photoHeroBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    sideBySideRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    halfCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      gap: spacing.xs,
    },
    cardValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginTop: spacing.xs,
    },
    cardLabel: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '600',
    },
    chartSection: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    chart: {
      marginVertical: spacing.xs,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingRight: spacing.lg,
      backgroundColor: theme.surface,
    },
  });
