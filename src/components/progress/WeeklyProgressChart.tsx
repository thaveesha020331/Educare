import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../styles/theme';
import { useLocale } from '../../hooks/useLocale';

// Stub for react-native-chart-kit - would be installed as dependency
// import { LineChart } from 'react-native-chart-kit';

interface WeeklyProgressData {
  week: string;
  scores: number[];
  labels: string[];
  average: number;
}

interface WeeklyProgressChartProps {
  data: WeeklyProgressData;
  height?: number;
  showAverage?: boolean;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  data,
  height = 200,
  showAverage = true,
}) => {
  const { t, formatNumber } = useLocale();
  const screenWidth = Dimensions.get('window').width;

  // Stub chart data
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.scores,
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Blue
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return colors.success;
    if (score >= 70) return colors.warning;
    return colors.error;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 85) return t('excellent');
    if (score >= 70) return t('good');
    return t('needsImprovement');
  };

  // Stub chart implementation - would use actual LineChart component
  const renderStubChart = () => (
    <View style={[styles.chartContainer, { height }]}>
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        style={styles.chartBackground}
      >
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartIcon}>📈</Text>
          <Text style={styles.chartTitle}>{t('weeklyProgress')}</Text>
          <View style={styles.dataPoints}>
            {data.scores.map((score, index) => (
              <View key={index} style={styles.dataPoint}>
                <Text style={styles.dataLabel}>{data.labels[index]}</Text>
                <Text style={[styles.dataValue, { color: getScoreColor(score) }]}>
                  {formatNumber(score)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📊</Text>
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.title}>{t('weeklyProgress')}</Text>
            <Text style={styles.subtitle}>Academic performance trend</Text>
          </View>
        </View>
        {showAverage && (
          <View style={styles.averageContainer}>
            <Text style={styles.averageLabel}>{t('average')}</Text>
            <Text style={[styles.averageValue, { color: getScoreColor(data.average) }]}>
              {formatNumber(data.average)}%
            </Text>
          </View>
        )}
      </View>

      {/* Enhanced chart visualization */}
      {renderStubChart()}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>{t('excellent')} (85%+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>{t('good')} (70-84%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>{t('needsImprovement')} (&lt;70%)</Text>
        </View>
      </View>

      {/* Current week summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{t('thisWeek')}</Text>
        <Text style={styles.summaryText}>
          {getScoreLabel(data.scores[data.scores.length - 1])} - {formatNumber(data.scores[data.scores.length - 1])}%
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
  averageContainer: {
    alignItems: 'flex-end',
  },
  averageLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  averageValue: {
    fontSize: typography.h4.fontSize,
    fontWeight: 'bold',
  },
  chartContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  chartBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholder: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  chartIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  dataPoints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  dataPoint: {
    alignItems: 'center',
    minWidth: 60,
  },
  dataLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dataValue: {
    fontSize: typography.body.fontSize,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  summary: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  summaryText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default WeeklyProgressChart;
