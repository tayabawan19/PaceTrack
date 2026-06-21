import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GPSPoint = {
  latitude: number;
  longitude: number;
  timestamp: string; // ISO String format
};

// Haversine formula to calculate distance in km between two geo-coordinates
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
};

export function useRunTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [route, setRoute] = useState<GPSPoint[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);

  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const routeRef = useRef<GPSPoint[]>([]);

  const distanceRef = useRef(0);
  const announcedMilestones = useRef<Set<number>>(new Set());

  const startTimeRef = useRef<number | null>(null);
  const pausedTimeAccumulatorRef = useRef<number>(0);
  const pausedStartRef = useRef<number | null>(null);

  // Keep distanceRef updated
  useEffect(() => {
    distanceRef.current = distanceKm;
  }, [distanceKm]);

  // Helper to compute exact elapsed running seconds without state variables
  const getElapsedTimeSeconds = useCallback(() => {
    if (!startTimeRef.current) return 0;
    const elapsedMs = Date.now() - startTimeRef.current - pausedTimeAccumulatorRef.current;
    return Math.max(0, elapsedMs / 1000);
  }, []);

  // Keep routeRef updated with route state to avoid stale closure in the watch callback
  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  const startLocationWatcher = useCallback(async () => {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 3, // update every 3 meters for accuracy
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const timestamp = new Date(location.timestamp).toISOString();
        const newPoint: GPSPoint = { latitude, longitude, timestamp };

        setRoute((prevRoute) => {
          const updated = [...prevRoute, newPoint];
          
          if (prevRoute.length > 0) {
            const last = prevRoute[prevRoute.length - 1];
            const incrementalDist = getDistance(
              last.latitude,
              last.longitude,
              latitude,
              longitude
            );
            
            // Filter out unrealistic GPS jumps (e.g. speed > 100 km/h)
            const timeDiffSeconds =
              (new Date(timestamp).getTime() - new Date(last.timestamp).getTime()) / 1000;
            const speedKmh = timeDiffSeconds > 0 ? (incrementalDist / (timeDiffSeconds / 3600)) : 0;
            
            if (speedKmh < 100) {
              const nextDistance = distanceRef.current + incrementalDist;
              setDistanceKm(nextDistance);

              // Check for kilometer milestones
              const currentMilestone = Math.floor(nextDistance);
              if (currentMilestone > 0 && !announcedMilestones.current.has(currentMilestone)) {
                announcedMilestones.current.add(currentMilestone);

                AsyncStorage.getItem('@voice_coaching_enabled').then((val) => {
                  if (val === 'false') return;

                  const elapsedMins = getElapsedTimeSeconds() / 60;
                  const paceVal = nextDistance > 0 ? (elapsedMins / nextDistance) : 0;
                  const paceMins = Math.floor(paceVal);
                  const paceSecs = Math.round((paceVal - paceMins) * 60);

                  const kmWord = currentMilestone === 1 ? 'kilometer' : 'kilometers';
                  const msg = `${currentMilestone} ${kmWord}, average pace ${paceMins} minute${paceMins !== 1 ? 's' : ''} and ${paceSecs} second${paceSecs !== 1 ? 's' : ''} per kilometer`;

                  Speech.speak(msg, {
                    rate: 1.0,
                    pitch: 1.0,
                    language: 'en-US',
                  });
                }).catch((err) => console.error('[Speech] Error checking preference:', err));
              }
            }
          }
          return updated;
        });
      }
    );

    watcherRef.current = subscription;
  }, []);

  const startTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied. Location access is required to track runs.');
      return;
    }

    // Reset stats
    setRoute([]);
    setDistanceKm(0);
    routeRef.current = [];
    distanceRef.current = 0;
    announcedMilestones.current.clear();

    startTimeRef.current = Date.now();
    pausedTimeAccumulatorRef.current = 0;
    pausedStartRef.current = null;

    setIsTracking(true);
    setIsPaused(false);

    await startLocationWatcher();
  }, [startLocationWatcher]);

  const pauseTracking = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
    pausedStartRef.current = Date.now();
    setIsPaused(true);
  }, []);

  const resumeTracking = useCallback(async () => {
    if (pausedStartRef.current) {
      pausedTimeAccumulatorRef.current += (Date.now() - pausedStartRef.current);
      pausedStartRef.current = null;
    }
    setIsPaused(false);
    await startLocationWatcher();
  }, [startLocationWatcher]);

  const stopTracking = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
    startTimeRef.current = null;
    pausedTimeAccumulatorRef.current = 0;
    pausedStartRef.current = null;
    announcedMilestones.current.clear();

    setIsTracking(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watcherRef.current) {
        watcherRef.current.remove();
      }
    };
  }, []);

  return {
    isTracking,
    isPaused,
    route,
    distanceKm,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  };
}
export type { OnboardingData } from '@/context/OnboardingContext';
