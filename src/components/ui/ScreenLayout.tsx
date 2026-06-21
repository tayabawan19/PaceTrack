import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@theme/spacing';
import { ScreenBackground } from './ScreenBackground';
import { useTheme } from '@/theme/ThemeContext';

type ScreenLayoutProps = {
  children: ReactNode;
  contentStyle?: ViewStyle;
  padded?: boolean;
};

export function ScreenLayout({
  children,
  contentStyle,
  padded = true,
}: ScreenLayoutProps) {
  const { theme } = useTheme();

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.statusBarStyle} />
        <View style={[styles.content, padded && styles.padded, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
