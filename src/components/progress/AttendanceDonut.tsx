import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../styles/theme';
import { useLocale } from '../../hooks/useLocale';

// Stub for chart library - would use react-native-chart-kit or Victory Native
// import { PieChart } from 'react-native-chart-kit';

interface AttendanceData {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

interface AttendanceDonutProps {
  data: AttendanceData;
  size?: number;
}

export const AttendanceDonut: React.FC<AttendanceDonutProps> = ({
  data,
  size = 160,
}) => {
  const { t, formatNumber } = useLocale();

  const chartData = [
    {
      name: t('present'),
      population: data.present,
      color: colors.success,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: t('absent'),
      population: data.absent,
      color: colors.error,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: t('late'),
      population: data.late,
      color: colors.warning,
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
  ];

  const getAttendanceStatus = (percentage: number): { label: string; color: string } => {
    if (percentage >= 95) {
      return { label: t('excellent'), color: colors.success };
    } else if (percentage >= 85) {
      return { label: t('good'), color: colors.warning };
    } else {
      return { label: t('needsImprovement'), color: colors.error };
    }
  };

  const status = getAttendanceStatus(data.percentage);

  // Stub donut chart implementation
  const renderStubDonut = () => {
    const radius = size / 2 - 20;
    const innerRadius = radius * 0.6;
    
    return (
      <View style={[styles.donutContainer, { width: size, height: size }]}>
        {/* Outer circle */}
        <View style={[
          styles.donutOuter,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            backgroundColor: colors.background,
          }
        ]}>
          {/* Inner circle with percentage */}
          <View style={[
            styles.donutInner,
            {
              width: innerRadius * 2,
              height: innerRadius * 2,
              borderRadius: innerRadius,
              backgroundColor: colors.surface,
            }
          ]}>
            <Text style={[styles.percentageText, { color: status.color }]}>
              {formatNumber(data.percentage)}%
            </Text>
            <Text style={styles.percentageLabel}>{t('attendanceRate')}</Text>
          </View>
        </View>
        
        {/* Color segments representation */}
        <View style={styles.segmentIndicators}>
          <View style={[styles.segment, { backgroundColor: colors.success, flex: data.present }]} />
          <View style={[styles.segment, { backgroundColor: colors.error, flex: data.absent }]} />
          <View style={[styles.segment, { backgroundColor: colors.warning, flex: data.late }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📅</Text>
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.title}>{t('attendance')}</Text>
            <Text style={styles.subtitle}>Monthly overview</Text>
          </View>
        </View>
        <Text style={[styles.status, { color: status.color }]}>
          {status.label}
        </Text>
      </View>

      {/* Stub donut chart */}
      {renderStubDonut()}

      {/* Statistics */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.success }]} />
          <Text style={styles.statLabel}>{t('present')}</Text>
          <Text style={styles.statValue}>{formatNumber(data.present)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.error }]} />
          <Text style={styles.statLabel}>{t('absent')}</Text>
          <Text style={styles.statValue}>{formatNumber(data.absent)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.statLabel}>Late</Text>
          <Text style={styles.statValue}>{formatNumber(data.late)}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {formatNumber(data.present)} out of {formatNumber(data.total)} days
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    marginBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 18,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.8,
  },
  status: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  donutOuter: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: colors.border,
  },
  donutInner: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  percentageLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  segmentIndicators: {
    position: 'absolute',
    bottom: -10,
    left: 20,
    right: 20,
    height: 4,
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  stats: {
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  statLabel: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  statValue: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  summary: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default AttendanceDonut;
