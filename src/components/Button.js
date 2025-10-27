import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, spacing, typography} from '../styles/theme';

const Button = ({title, onPress, variant = 'primary', style, ...props}) => {
  const buttonStyle = [
    styles.button,
    variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
    style,
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'primary' ? styles.primaryText : styles.secondaryText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      {...props}>
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.primary,
  },
});

export default Button;
