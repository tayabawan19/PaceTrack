export interface Theme {
  background: string;
  backgroundEnd: string;
  surface: string;
  surfaceLight: string;
  primary: string;
  secondary: string;
  text: string;
  textMuted: string;
  border: string;
  statusBarStyle: 'light' | 'dark' | 'auto' | 'inverted';
}

export const darkTheme: Theme = {
  background: '#0D0D0F',
  backgroundEnd: '#000000',
  surface: '#1C1C1F',
  surfaceLight: '#26262A',
  primary: '#FF6B35',
  secondary: '#34D399',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  border: '#2C2C2E',
  statusBarStyle: 'light',
};

export const lightTheme: Theme = {
  background: '#F7F7F8',
  backgroundEnd: '#EDEDF0',
  surface: '#FFFFFF',
  surfaceLight: '#F0F0F2',
  primary: '#FF6B35',
  secondary: '#10B981',
  text: '#0D0D0F',
  textMuted: '#6B6B70',
  border: '#E5E5E7',
  statusBarStyle: 'dark',
};
