import { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';

export type ScreenBackgroundProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function ScreenBackground({ children, style }: ScreenBackgroundProps) {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={[theme.background, theme.backgroundEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
