import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  TouchableOpacityProps 
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, BorderRadius } from '@/constants/Spacing';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: primaryColor },
          text: { color: '#FFFFFF' },
        };
      case 'secondary':
        return {
          container: { backgroundColor: backgroundSecondary },
          text: { color: textColor },
        };
      case 'outline':
        return {
          container: { 
            backgroundColor: 'transparent', 
            borderWidth: 1, 
            borderColor: primaryColor 
          },
          text: { color: primaryColor },
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: primaryColor },
        };
      default:
        return {
          container: { backgroundColor: primaryColor },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.m },
          text: { fontSize: 14 },
        };
      case 'large':
        return {
          container: { paddingVertical: Spacing.l, paddingHorizontal: Spacing.xl },
          text: { fontSize: 18 },
        };
      default:
        return {
          container: { paddingVertical: Spacing.m, paddingHorizontal: Spacing.l },
          text: { fontSize: 16 },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? primaryColor : '#FFFFFF'} />
      ) : (
        <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
