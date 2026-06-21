import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';
import type { RootStackParamList } from '@/navigation/types';
import { ScreenBackground } from '@/components/ui';

export type PlanRouteScreenProps = {
  onBackPress: () => void;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

export function PlanRouteScreen({ onBackPress }: PlanRouteScreenProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();

  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [origin, setOrigin] = useState<Coordinate | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [mapRegion, setMapRegion] = useState<any>(null);

  // Retrieve current location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to center the map on your location.'
          );
          setLoadingLocation(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        
        setOrigin(coords);
        setMapRegion({
          ...coords,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
      } catch (err) {
        console.error('[PlanRoute] Error getting position:', err);
        // Fallback default coordinates if failed
        const fallback = { latitude: 37.78825, longitude: -122.4324 };
        setMapRegion({
          ...fallback,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // Fetch route between origin and destination using OSRM foot routing
  const fetchRoute = async (start: Coordinate, end: Coordinate) => {
    setLoadingRoute(true);
    setRouteError(null);
    try {
      // OSRM expects: longitude,latitude;longitude,latitude order
      const url = `https://router.project-osrm.org/route/v1/foot/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Routing service is currently unavailable.');
      }

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found between these locations.');
      }

      const routeData = data.routes[0];
      const geoCoords = routeData.geometry.coordinates;

      // Coordinates in GeoJSON are [longitude, latitude] -> convert to { latitude, longitude }
      const parsedCoords = geoCoords.map((c: [number, number]) => ({
        latitude: c[1],
        longitude: c[0],
      }));

      setRouteCoordinates(parsedCoords);
      setDistanceKm(routeData.distance / 1000);
      setDurationSeconds(routeData.duration);
    } catch (err: any) {
      console.error('[PlanRoute] OSRM Route fetch failed:', err);
      setRouteError(err.message || 'Could not fetch planned route details.');
      setRouteCoordinates([]);
      setDistanceKm(0);
      setDurationSeconds(0);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleMapPress = async (e: any) => {
    const tappedCoords = e.nativeEvent.coordinate;
    setDestination(tappedCoords);

    let startPoint = origin;
    if (!startPoint) {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        startPoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setOrigin(startPoint);
      } catch (err) {
        Alert.alert('Location Error', 'Unable to retrieve your current location.');
        return;
      }
    }

    if (startPoint) {
      fetchRoute(startPoint, tappedCoords);
    }
  };

  const handleClear = () => {
    setDestination(null);
    setRouteCoordinates([]);
    setDistanceKm(0);
    setDurationSeconds(0);
    setRouteError(null);
  };

  const handleStartRun = () => {
    if (routeCoordinates.length === 0) return;
    navigation.navigate('TrackRun', {
      plannedRoute: routeCoordinates,
      plannedDistanceKm: parseFloat(distanceKm.toFixed(1)),
    });
  };

  const formatDuration = (secs: number) => {
    const mins = Math.round(secs / 60);
    if (mins < 60) {
      return `${mins} min`;
    }
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const routeExists = routeCoordinates.length > 0;

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <StatusBar style={theme.statusBarStyle} />

        {/* Floating Back Button Overlay */}
        <View 
          style={[styles.backButtonOverlay, { top: Math.max(insets.top, spacing.md) }]} 
          pointerEvents="box-none"
        >
          <TouchableOpacity style={styles.circularButton} onPress={onBackPress} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

      <View style={{ flex: 1 }}>
        {loadingLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Locating you...</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            showsMyLocationButton={false}
            initialRegion={mapRegion}
            onPress={handleMapPress}
          >
            {/* Origin Marker (Blue Dot) */}
            {origin && (
              <Marker coordinate={origin} title="Current Location">
                <View style={styles.blueDotContainer}>
                  <View style={styles.blueDotHalo} />
                  <View style={styles.blueDot} />
                </View>
              </Marker>
            )}

            {/* Destination Marker (Orange Pin) */}
            {destination && (
              <Marker coordinate={destination} title="Destination">
                <View style={styles.destPinContainer}>
                  <Ionicons name="pin" size={32} color={theme.primary} />
                </View>
              </Marker>
            )}

            {/* Route Line */}
            {routeExists && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={theme.primary}
                strokeWidth={4}
              />
            )}
          </MapView>
        )}

        {/* Routing Loading Overlay */}
        {loadingRoute && (
          <View style={[styles.routeLoaderContainer, { top: Math.max(insets.top, spacing.md) + 60 }]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={styles.routeLoaderText}>Calculating walking route...</Text>
          </View>
        )}

        {/* Bottom Info & Action Card */}
        <View style={styles.overlayCard}>
        {routeError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{routeError}</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statColumn}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>
                {routeExists ? distanceKm.toFixed(1) : '—'}{' '}
                {routeExists && <Text style={styles.statUnit}>km</Text>}
              </Text>
            </View>

            <View style={styles.statColumn}>
              <Text style={styles.statLabel}>Est. Time</Text>
              <Text style={styles.statValue}>
                {routeExists ? formatDuration(durationSeconds) : '—'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              !routeExists && styles.startButtonDisabled,
            ]}
            onPress={handleStartRun}
            disabled={!routeExists}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.startButtonText,
                !routeExists && styles.startButtonTextDisabled,
              ]}
            >
              Start Run
            </Text>
          </TouchableOpacity>

          {routeExists && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear} activeOpacity={0.7}>
              <Text style={styles.clearButtonText}>Clear destination</Text>
            </TouchableOpacity>
          )}
        </View>
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
    backButtonOverlay: {
      position: 'absolute',
      left: spacing.lg,
      zIndex: 10,
    },
    circularButton: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.md,
    },
    loadingText: {
      color: theme.textMuted,
      fontSize: 16,
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    blueDotContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
    },
    blueDotHalo: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(33, 150, 243, 0.25)',
    },
    blueDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#2196F3',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    destPinContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    routeLoaderContainer: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      zIndex: 10,
    },
    routeLoaderText: {
      color: theme.text,
      fontSize: 14,
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
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 10,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    statColumn: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      fontSize: 13,
      color: theme.textMuted,
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    statValue: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.text,
    },
    statUnit: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '400',
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      gap: spacing.sm,
    },
    errorText: {
      color: '#EF4444',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      flex: 1,
    },
    actionsContainer: {
      gap: spacing.md,
    },
    startButton: {
      backgroundColor: theme.primary,
      borderRadius: radius.full,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startButtonDisabled: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      opacity: 0.5,
    },
    startButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF', // Contrast white text for start button
    },
    startButtonTextDisabled: {
      color: theme.textMuted,
    },
    clearButton: {
      alignSelf: 'center',
      paddingVertical: spacing.xs,
    },
    clearButtonText: {
      color: theme.primary,
      fontWeight: '600',
      textDecorationLine: 'underline',
      fontSize: 14,
    },
  });
