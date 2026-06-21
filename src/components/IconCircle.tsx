import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Theme } from '@/theme/themes';

export type IconCircleProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconCircle({
  name,
  size = 20,
  filled = false,
  style,
}: IconCircleProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const circleSize = size * 1.8;

  return (
    <View
      style={[
        styles.container,
        filled ? styles.filled : styles.outline,
        {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
        },
        style,
      ]}
    >
      <Ionicons
        name={name}
        size={size}
        color={filled ? '#FFFFFF' : theme.primary}
      />
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    filled: {
      backgroundColor: theme.primary,
    },
    outline: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
  });
