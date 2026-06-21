import { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRunTracker } from '@/hooks/useRunTracker';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';
import { ScreenBackground } from '@/components/ui';

export type TrackRunScreenProps = {
  onBackPress?: () => void;
  onFinishRun: (runData: {
    distanceKm: number;
    durationSeconds: number;
    avgPaceMinPerKm: number;
    caloriesBurned: number;
    route: any[];
  }) => void;
  plannedRoute?: { latitude: number; longitude: number }[];
  plannedDistanceKm?: number;
};

export function TrackRunScreen({
  onBackPress,
  onFinishRun,
  plannedRoute,
  plannedDistanceKm,
}: TrackRunScreenProps) {
  const {
    isTracking,
    isPaused,
    route,
    distanceKm,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  } = useRunTracker();

  const [duration, setDuration] = useState(0);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Timer increment effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTracking && !isPaused) {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTracking, isPaused]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatDuration = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(mins)}:${pad(remainingSecs)}`;
    }
    return `${pad(mins)}:${pad(remainingSecs)}`;
  };

  // Calculate live pace (min/km)
  const getPace = () => {
    if (distanceKm === 0) return '--';
    const paceVal = (duration / 60) / distanceKm; // minutes per km
    const paceMins = Math.floor(paceVal);
    const paceSecs = Math.round((paceVal - paceMins) * 60);
    return `${paceMins}:${paceSecs.toString().padStart(2, '0')}`;
  };

  const getLiveCalories = () => {
    return Math.round(distanceKm * 70 * 1.036);
  };

  // MOCKED — would require barometric altitude data via expo-location's altitude field, inconsistent across devices, treating as placeholder
  const getMockElevation = () => {
    return Math.round(12 + distanceKm * 10);
  };

  // MOCKED — requires wearable device integration
  const getMockBpm = () => {
    return isTracking && !isPaused ? 132 : 120;
  };

  const handleBackPress = () => {
    if (!onBackPress) return;
    if (isTracking) {
      Alert.alert(
        'Exit Workout?',
        'If you exit now, your active run progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit & Discard',
            style: 'destructive',
            onPress: () => {
              stopTracking();
              onBackPress();
            },
          },
        ]
      );
    } else {
      onBackPress();
    }
  };

  const handleStart = () => {
    setDuration(0);
    startTracking();
  };

  const handleStop = () => {
    // Temporarily pause tracking to stop the timer while user confirms
    const wasPausedBefore = isPaused;
    if (!isPaused) {
      pauseTracking();
    }

    Alert.alert(
      'Finish Run?',
      'Are you sure you want to complete this run and view the summary?',
      [
        {
          text: 'Cancel',
          onPress: () => {
            // Resume if it wasn't paused before
            if (!wasPausedBefore) {
              resumeTracking();
            }
          },
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            stopTracking();
            
            // Calculate pace
            const avgPaceMinPerKm = distanceKm > 0 ? (duration / 60) / distanceKm : 0;
            
            // Calculate calories: distanceKm * weight (70kg) * 1.036
            const caloriesBurned = Math.round(distanceKm * 70 * 1.036);

            onFinishRun({
              distanceKm: parseFloat(distanceKm.toFixed(2)),
              durationSeconds: duration,
              avgPaceMinPerKm: parseFloat(avgPaceMinPerKm.toFixed(2)),
              caloriesBurned,
              route,
            });
          },
        },
      ]
    );
  };

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <StatusBar style={theme.statusBarStyle} />

        {/* Map View */}
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsUserLocation
          followsUserLocation
          showsMyLocationButton={false}
          initialRegion={{
            latitude: route[route.length - 1]?.latitude || plannedRoute?.[0]?.latitude || 37.78825,
            longitude: route[route.length - 1]?.longitude || plannedRoute?.[0]?.longitude || -122.4324,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          {plannedRoute && plannedRoute.length > 0 && (
            <Polyline
              coordinates={plannedRoute}
              strokeColor="rgba(255, 107, 53, 0.3)" // faint primary orange
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          )}

          {route.length > 1 && (
            <Polyline
              coordinates={route}
              strokeColor={theme.primary}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Top Bar Overlay */}
        {onBackPress && (
          <SafeAreaView style={styles.topBarOverlay}>
            <TouchableOpacity style={styles.circularButton} onPress={handleBackPress}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.circularButton} 
              onPress={() => Alert.alert('Options', 'Workout settings/options coming soon.')}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {/* Bottom Stats & Controls Card */}
        <View style={styles.overlayCard}>
          {/* Expanded 6-Stat Grid */}
          <View style={styles.gridContainer}>
            {/* Top Row: Avg Pace, Distance, Calories */}
            <View style={styles.gridRow}>
              <View style={styles.gridColumn}>
                <Text style={styles.statLabel}>Avg Pace</Text>
                <Text style={styles.statValue}>
                  {getPace()} <Text style={styles.statUnit}>/km</Text>
                </Text>
              </View>

              <View style={styles.gridColumn}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>
                  {distanceKm.toFixed(2)} <Text style={styles.statUnit}>km</Text>
                </Text>
              </View>

              <View style={styles.gridColumn}>
                <Text style={styles.statLabel}>Calories</Text>
                <Text style={styles.statValue}>
                  {getLiveCalories()} <Text style={styles.statUnit}>kcal</Text>
                </Text>
              </View>
            </View>

            {/* Bottom Row: Time, Elevation, BPM */}
            <View style={styles.gridRow}>
              <View style={styles.gridColumn}>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>{formatDuration(duration)}</Text>
              </View>

              <View style={styles.gridColumn}>
                <Text style={styles.statLabel}>Elevation</Text>
                <Text style={styles.statValue}>
                  {getMockElevation()} <Text style={styles.statUnit}>m</Text>
                </Text>
              </View>

              <View style={styles.gridColumn}>
                <Text style={styles.statLabel}>Heart Rate</Text>
                <Text style={styles.statValue}>
                  {isTracking ? getMockBpm() : '—'} <Text style={styles.statUnit}>bpm</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Controls Container */}
          <View style={styles.controlsContainer}>
            {!isTracking ? (
              // Idle State: Large play/start button
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <Ionicons name="play" size={32} color={theme.text} />
              </TouchableOpacity>
            ) : (
              // Tracking State: Pause/Resume and Stop
              <View style={styles.activeButtonsRow}>
                {isPaused ? (
                  <TouchableOpacity style={styles.resumeButton} onPress={resumeTracking}>
                    <Ionicons name="play" size={24} color={theme.text} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.pauseButton} onPress={pauseTracking}>
                    <Ionicons name="pause" size={24} color={theme.text} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                  <Ionicons name="square" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    topBarOverlay: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
      zIndex: 10,
    },
    circularButton: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlayCard: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 10,
    },
    gridContainer: {
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    gridRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    gridColumn: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textMuted,
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
    },
    statUnit: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '400',
    },
    controlsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    startButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
    activeButtonsRow: {
      flexDirection: 'row',
      gap: spacing.xl,
    },
    pauseButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resumeButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
  });
