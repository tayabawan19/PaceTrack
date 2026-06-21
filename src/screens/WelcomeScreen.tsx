import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useEffect } from 'react';
import { useEventListener } from 'expo';

import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';
import { radius, spacing } from '@theme/spacing';

export type WelcomeScreenProps = {
  onSignUpPress: () => void;
  onLogInPress: () => void;
};

export function WelcomeScreen({ onSignUpPress, onLogInPress }: WelcomeScreenProps) {
  const { theme, mode } = useTheme();
  const overlayBg = mode === 'dark' ? theme.background : '#0D0D0F';
  const styles = getStyles(theme, overlayBg);

  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(require('../assets/welcome-bg.mp4'), (playerInstance) => {
    playerInstance.loop = true;
    playerInstance.muted = true;
    playerInstance.play();
  });

  // Use event listener to properly react to native player status changes
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') {
      setHasError(true);
    }
  });

  // Pause video on screen blur, play on focus
  useFocusEffect(
    useCallback(() => {
      if (!hasError) {
        player.play();
      }
      return () => {
        player.pause();
      };
    }, [player, hasError])
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(300)}>
        {hasError ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayBg }]} />
        ) : (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        )}
        <LinearGradient
          colors={['transparent', `${overlayBg}60`, `${overlayBg}D9`]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={styles.headline}>
              Start Your{'\n'}
              Running Journey
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Text style={styles.subtitle}>
              Take the first step toward your fitness goals and track your progress in real-time.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={onSignUpPress}
              activeOpacity={0.85}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.arrowIcon} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(400)}>
            <TouchableOpacity
              style={styles.loginLink}
              onPress={onLogInPress}
              activeOpacity={0.7}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginTextBold}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (theme: Theme, overlayBg: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: overlayBg,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
    },
    headline: {
      fontSize: 36,
      fontWeight: '800',
      color: '#FFFFFF',
      lineHeight: 44,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: 24,
      marginBottom: spacing.xl,
    },
    getStartedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      borderRadius: radius.full,
      height: 52,
      marginBottom: spacing.md,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
      position: 'relative',
    },
    getStartedButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },
    arrowIcon: {
      position: 'absolute',
      right: spacing.lg,
    },
    loginLink: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    loginText: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 15,
    },
    loginTextBold: {
      color: theme.primary,
      fontWeight: '700',
    },
  });
