import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, commonStyles } from '../styles/theme';

type QuizSummary = {
  _id?: string;
  title: string;
  subject: string;
  grade?: string;
  durationMinutes?: number;
  questionsCount: number;
  updatedAt?: string;
  questions?: any[];
  timeLimit?: number;
  description?: string;
};

type Props = {
  quiz: QuizSummary;
  onPress?: () => void;
};

export const QuizCard: React.FC<Props> = ({ quiz, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#2563eb', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.icon}>🧠</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{quiz.title}</Text>
          <Text style={styles.meta}>{quiz.subject}{quiz.grade ? ` • ${quiz.grade}` : ''}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{quiz.durationMinutes || 20}m</Text>
        </View>
      </LinearGradient>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{quiz.questionsCount} questions</Text>
        {!!quiz.updatedAt && (
          <Text style={styles.footerTime}>{new Date(quiz.updatedAt).toLocaleDateString()}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    ...commonStyles.shadow,
    marginBottom: spacing.md,
  },
  header: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: 'white',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#f8fafc',
  },
  footerText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  footerTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default QuizCard;


