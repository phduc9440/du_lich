import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  backgroundColorName?: 'background' | 'backgroundSecondary' | 'card';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  backgroundColorName = 'background',
  ...otherProps 
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, backgroundColorName);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
