import {StyleSheet, Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

export const colors = {
  // Primary Blue Palette - Clean, Modern
  primary: '#2563eb',        // Blue 600
  primaryLight: '#3b82f6',   // Blue 500
  primaryDark: '#1e3a8a',    // Blue 800
  
  // Secondary Blues
  secondary: '#1d4ed8',      // Blue 700
  secondaryLight: '#60a5fa', // Blue 400
  accent: '#93c5fd',         // Blue 300 for highlights
  
  // Semantic
  success: '#22c55e',        // Green 500
  warning: '#f59e0b',        // Amber 500
  error: '#ef4444',          // Red 500
  info: '#3b82f6',           // Blue 500
  
  // Neutral
  background: '#f8fafc',     // Slate 50
  surface: '#FFFFFF',        // White
  surfaceLight: '#F9FAFB',   // Light Gray
  
  // Text Colors
  text: '#1F2937',           // Dark Gray
  textSecondary: '#6B7280',  // Medium Gray
  textLight: '#9CA3AF',      // Light Gray
  
  // Border and Divider
  border: '#D1FAE5',         // Light Green Border
  divider: '#E5E7EB',        // Light Gray Divider
  
  // Role Colors - Harmonized to blue theme
  teacher: '#1e3a8a',        // Deep Blue for Teachers
  parent: '#2563eb',         // Blue for Parents
  student: '#3b82f6',        // Lighter Blue for Students
  specialNeeds: '#60a5fa',   // Soft Blue for Special Needs
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.text,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
    color: colors.textLight,
  },
  small: {
    fontSize: 10,
    fontWeight: 'normal',
    lineHeight: 14,
    color: colors.textLight,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
};

export const dimensions = {
  width,
  height,
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...StyleSheet.flatten([
      {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }
    ]),
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body.fontSize,
    color: colors.text,
    backgroundColor: colors.surface,
  },
});

// Educational specific styles
export const educationStyles = StyleSheet.create({
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.surface,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  roleCard: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
});