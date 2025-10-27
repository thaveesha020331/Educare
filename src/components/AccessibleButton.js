import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { useAccessibility } from '../hooks/useAccessibility';

const AccessibleButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  hapticType = 'light',
  style,
  textStyle,
  ...props
}) => {
  const { getAccessibilityProps, triggerHaptic, getScaledFontSize } = useAccessibility();

  const handlePress = async () => {
    if (disabled || loading) return;
    
    await triggerHaptic(hapticType);
    onPress?.();
  };

  const getButtonStyles = () => {
    const baseStyles = [styles.button, styles[variant], styles[size]];
    
    if (disabled) {
      baseStyles.push(styles.disabled);
    }
    
    if (style) {
      baseStyles.push(style);
    }
    
    return baseStyles;
  };

  const getTextStyles = () => {
    const baseStyles = [styles.text, styles[`${variant}Text`], styles[`${size}Text`]];
    
    if (disabled) {
      baseStyles.push(styles.disabledText);
    }
    
    if (textStyle) {
      baseStyles.push(textStyle);
    }
    
    return baseStyles;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconSize = getIconSize();
    const iconStyle = [
      styles.icon,
      iconPosition === 'right' && styles.iconRight,
      disabled && styles.disabledIcon
    ];

    return (
      <Ionicons
        name={icon}
        size={iconSize}
        color={disabled ? colors.textSecondary : (variant === 'primary' ? 'white' : colors.primary)}
        style={iconStyle}
      />
    );
  };

  const accessibilityProps = getAccessibilityProps('button', {
    label: accessibilityLabel || title,
    hint: accessibilityHint,
    state: { disabled: disabled || loading }
  });

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...accessibilityProps}
      {...props}
    >
      <View style={styles.content}>
        {icon && iconPosition === 'left' && renderIcon()}
        {loading ? (
          <Text style={[getTextStyles(), { opacity: 0.7 }]}>Loading...</Text>
        ) : (
          <Text style={[getTextStyles(), { fontSize: getScaledFontSize(typography.body.fontSize) }]}>
            {title}
          </Text>
        )}
        {icon && iconPosition === 'right' && renderIcon()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  disabledIcon: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.accent,
  },
  
  // Sizes
  small: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  
  // Text variants
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: colors.primary,
  },
  outlineText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.primary,
  },
  dangerText: {
    color: 'white',
  },
  
  // Text sizes
  smallText: {
    fontSize: typography.caption.fontSize,
  },
  mediumText: {
    fontSize: typography.body.fontSize,
  },
  largeText: {
    fontSize: typography.h3.fontSize,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default AccessibleButton;
