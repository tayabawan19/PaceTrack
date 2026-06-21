import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_REMINDER_ID = 'streak-reminder';
const INACTIVITY_REMINDER_ID = 'inactivity-reminder';

// 1. Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice && Platform.OS === 'ios') {
    console.log('[Notifications] Running on simulator/emulator');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  const granted = finalStatus === 'granted';
  // Persist preference as true if first time granted and not set yet
  if (granted) {
    const currentPreference = await AsyncStorage.getItem('@notification_reminder_enabled');
    if (currentPreference === null) {
      await AsyncStorage.setItem('@notification_reminder_enabled', 'true');
    }
  }

  return granted;
}

// 2. Schedule daily repeating reminder at 7:00 PM
export async function scheduleStreakReminder() {
  try {
    // Check if notifications are enabled by user
    const enabledVal = await AsyncStorage.getItem('@notification_reminder_enabled');
    if (enabledVal === 'false') {
      console.log('[Notifications] Streak reminder is disabled by user settings');
      return;
    }

    // Cancel existing first to prevent duplicates
    await cancelStreakReminder();

    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_REMINDER_ID,
      content: {
        title: "Don't break your streak! 🔥",
        body: "You haven't run today yet — even a quick one counts.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });
    console.log('[Notifications] Streak reminder scheduled for 7:00 PM daily');
  } catch (error) {
    console.error('[Notifications] Error scheduling streak reminder:', error);
  }
}

// 3. Cancel daily streak reminder
export async function cancelStreakReminder() {
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID);
    console.log('[Notifications] Streak reminder cancelled');
  } catch (error) {
    console.error('[Notifications] Error cancelling streak reminder:', error);
  }
}

// 4. Schedule inactivity reminder if user hasn't run in 3+ days
export async function scheduleInactivityReminder(token: string) {
  try {
    const enabledVal = await AsyncStorage.getItem('@notification_reminder_enabled');
    if (enabledVal === 'false') {
      return;
    }

    // Fetch the user's latest run from server
    const response = await fetch('https://pacetrack-backend.onrender.com/api/runs?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch runs history');
    }

    const runs = await response.json();
    let lastRunDate: Date | null = null;

    if (runs && runs.length > 0) {
      const latestRun = runs[0];
      lastRunDate = new Date(latestRun.startedAt || latestRun.createdAt);
    }

    const today = new Date();
    let daysSinceLastRun = 999; // Default if no runs

    if (lastRunDate) {
      const timeDiff = today.getTime() - lastRunDate.getTime();
      daysSinceLastRun = timeDiff / (1000 * 3600 * 24);
    }

    // If no runs or 3+ days since last run, schedule one-time inactivity reminder
    if (daysSinceLastRun >= 3) {
      // Cancel any existing inactivity reminder first
      await Notifications.cancelScheduledNotificationAsync(INACTIVITY_REMINDER_ID);

      await Notifications.scheduleNotificationAsync({
        identifier: INACTIVITY_REMINDER_ID,
        content: {
          title: "We miss you! 🏃",
          body: "It's been a few days — lace up and get back out there.",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 7200, // Schedule in 2 hours
        },
      });
      console.log('[Notifications] Inactivity reminder scheduled for 2 hours from now');
    } else {
      // Cancel the inactivity reminder if they've run recently
      await Notifications.cancelScheduledNotificationAsync(INACTIVITY_REMINDER_ID);
      console.log('[Notifications] User ran recently. Inactivity reminder cancelled');
    }
  } catch (error) {
    console.error('[Notifications] Error scheduling inactivity reminder:', error);
  }
}
