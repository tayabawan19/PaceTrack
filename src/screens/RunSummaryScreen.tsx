import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenBackground } from '@/components/ui';
import { cancelStreakReminder } from '@/utils/notifications';

// Change this URL if your server IP changes. 
// Standardized to match your dev computer IP: 192.168.100.5
const RUNS_API_URL = 'http://192.168.100.2:5000/api/runs';

export type RunSummaryData = {
  distanceKm: number;
  durationSeconds: number;
  avgPaceMinPerKm: number;
  caloriesBurned: number;
  route: Array<{ latitude: number; longitude: number; timestamp: string }>;
};

export type RunSummaryScreenProps = {
  runData: RunSummaryData;
  isReadOnly?: boolean;
  onSaveSuccess: () => void;
  onDiscardPress: () => void;
};

export function RunSummaryScreen({
  runData,
  isReadOnly = false,
  onSaveSuccess,
  onDiscardPress,
}: RunSummaryScreenProps) {
  const { token } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [isSaving, setIsSaving] = useState(false);
  const viewShotRef = useRef<any>(null);

  const handleShare = async () => {
    try {
      if (!viewShotRef.current) {
        Alert.alert('Error', 'Unable to capture summary view.');
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Sharing is not supported on this platform/device.');
        return;
      }

      // Capture ViewShot as PNG image URI
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 0.9,
      });

      // Invoke system sharing sheet
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your run summary!',
        UTI: 'public.png',
      });
    } catch (error: any) {
      console.error('[SHARE] Capture or sharing error:', error);
      Alert.alert('Share Failed', error.message || 'Something went wrong while trying to share.');
    }
  };

  const { distanceKm, durationSeconds, avgPaceMinPerKm, caloriesBurned, route } = runData;

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

  // Format pace (e.g. 5.4 -> 5'24")
  const formatPace = (pace: number) => {
    if (!pace || pace === 0) return '--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}'${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(RUNS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          distanceKm,
          durationSeconds,
          avgPaceMinPerKm,
          caloriesBurned,
          route,
          startedAt: route[0]?.timestamp || new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save run.');
      }

      // Cancel streak reminder since user completed a run today
      await cancelStreakReminder();

      Alert.alert('Run Saved!', 'Your run has been registered successfully.', [
        { text: 'OK', onPress: onSaveSuccess },
      ]);
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Unable to save your run. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.statusBarStyle} />
      
      {/* Redesigned Header Component */}
      <ScreenHeader title="Run Summary" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <ViewShot ref={viewShotRef} style={styles.viewShotContainer}>
          {/* Static Map View card */}
          <View style={styles.mapCard}>
            <MapView
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              initialRegion={
                route.length > 0
                  ? {
                      latitude: route[Math.floor(route.length / 2)]?.latitude,
                      longitude: route[Math.floor(route.length / 2)]?.longitude,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
                    }
                  : {
                      latitude: 37.78825,
                      longitude: -122.4324,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
                    }
              }
            >
              {route.length > 1 && (
                <Polyline
                  coordinates={route}
                  strokeColor={theme.primary}
                  strokeWidth={4}
                />
              )}
            </MapView>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="speedometer" size={22} color={theme.primary} />
                <Text style={styles.statValue}>{distanceKm.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Distance (km)</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="time" size={22} color={theme.primary} />
                <Text style={styles.statValue}>{formatDuration(durationSeconds)}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={22} color={theme.primary} />
                <Text style={styles.statValue}>{formatPace(avgPaceMinPerKm)}</Text>
                <Text style={styles.statLabel}>Avg Pace</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="flame" size={22} color={theme.primary} />
                <Text style={styles.statValue}>{caloriesBurned}</Text>
                <Text style={styles.statLabel}>Calories (kcal)</Text>
              </View>
            </View>
          </View>
        </ViewShot>

        {/* Actions Container */}
        <View style={styles.actionsContainer}>
          {isReadOnly ? (
            <View style={styles.readOnlyActions}>
              <TouchableOpacity style={[styles.saveButton, { flex: 1 }]} onPress={onSaveSuccess}>
                <Text style={styles.saveButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareIconButton} onPress={handleShare}>
                <Ionicons name="share-social" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.saveButton, { flex: 1 }, isSaving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={theme.text} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Run</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareIconButton} onPress={handleShare}>
                  <Ionicons name="share-social" size={22} color={theme.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.discardButton}
                onPress={() => {
                  Alert.alert(
                    'Discard Run?',
                    'This completed run details will be permanently deleted.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Discard', style: 'destructive', onPress: onDiscardPress },
                    ]
                  );
                }}
                disabled={isSaving}
              >
                <Text style={styles.discardButtonText}>Discard Run</Text>
              </TouchableOpacity>
            </>
          )}
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: spacing.xs,
    },
    mapCard: {
      height: 220,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    map: {
      flex: 1,
    },
    statsGrid: {
      gap: spacing.sm,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
      marginTop: spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textMuted,
      fontWeight: '600',
    },
    actionsContainer: {
      gap: spacing.md,
      marginTop: spacing.sm,
      alignItems: 'center',
      width: '100%',
    },
    readOnlyActions: {
      flexDirection: 'row',
      width: '100%',
      gap: spacing.md,
      alignItems: 'center',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      width: '100%',
      gap: spacing.md,
      alignItems: 'center',
    },
    shareIconButton: {
      width: 50,
      height: 50,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    viewShotContainer: {
      backgroundColor: theme.background,
      gap: spacing.lg,
    },
    saveButton: {
      width: '100%',
      backgroundColor: theme.primary,
      borderRadius: radius.full,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF', // Keep button text contrast white
    },
    discardButton: {
      paddingVertical: spacing.xs,
    },
    discardButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#EF4444', // red warning link
      textDecorationLine: 'underline',
    },
  });
