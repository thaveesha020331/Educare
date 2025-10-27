import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { useAccessibility } from '../hooks/useAccessibility';
import AccessibleButton from '../components/AccessibleButton';

const LessonDetailScreen = ({ navigation, route }) => {
  const { lesson } = route.params;
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(lesson.progress?.isCompleted || false);
  const { 
    settings: accessibilitySettings, 
    triggerHaptic, 
    speak, 
    announce, 
    getAccessibilityProps,
    getScaledFontSize 
  } = useAccessibility();

  const handleCompleteLesson = async () => {
    try {
      setLoading(true);
      
      // Import the API function
      const { completeLesson } = await import('../api/lessons');
      const { AuthService } = await import('../services/auth');
      
      const token = await AuthService.getStoredToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      // Check if token is still valid
      const isTokenValid = await AuthService.isTokenValid();
      if (!isTokenValid) {
        Alert.alert(
          'Session Expired', 
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await AuthService.logout();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Auth' }],
                });
              }
            }
          ]
        );
        return;
      }

      const result = await completeLesson(lesson._id, 30, token);
      
      if (result.success) {
        setIsCompleted(true);
        await triggerHaptic('success');
        await speak('Lesson completed successfully!');
        
        // Update the lesson object with completion status
        const updatedLesson = {
          ...lesson,
          progress: {
            ...lesson.progress,
            isCompleted: true,
            completedAt: new Date(),
            timeSpent: 30
          }
        };
        
        // Pass the updated lesson back to the previous screen
        navigation.setParams({ lesson: updatedLesson });
        
        Alert.alert('Success', 'Lesson marked as completed!', [
          {
            text: 'OK',
            onPress: () => {
              // Go back and refresh the dashboard
              navigation.goBack();
            }
          }
        ]);
      } else {
        await triggerHaptic('error');
        
        // Check if it's a token error
        if (result.error && result.error.includes('token')) {
          Alert.alert(
            'Session Expired', 
            'Your session has expired. Please login again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Clear stored auth data
                  AuthService.logout();
                  // Navigate to login screen
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Auth' }],
                  });
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', result.error || 'Failed to complete lesson');
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      
      // Check if it's a token error
      if (error.message && error.message.includes('token')) {
        Alert.alert(
          'Session Expired', 
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                // Clear stored auth data
                const { AuthService } = await import('../services/auth');
                await AuthService.logout();
                // Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Auth' }],
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to complete lesson. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (lesson.quizzes && lesson.quizzes.length > 0) {
      // Navigate to quiz screen
      navigation.navigate('QuizScreen', { quiz: lesson.quizzes[0] });
    } else {
      Alert.alert('No Quiz', 'This lesson does not have an associated quiz.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#2563eb']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lesson Details</Text>
          <View style={styles.headerActions}>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Lesson Info Card */}
        <View style={styles.lessonInfoCard}>
          <View style={styles.lessonIcon}>
            <Text style={styles.lessonIconText}>📚</Text>
          </View>
          <View style={styles.lessonDetails}>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.lessonSubject}>{lesson.subject}</Text>
            <Text style={styles.lessonDuration}>
              Duration: {lesson.duration || 45} minutes
            </Text>
            <Text style={styles.lessonDate}>
              Created: {new Date(lesson.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Lesson Content */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Lesson Content</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              {lesson.content || lesson.description || 'No content available for this lesson.'}
            </Text>
          </View>
        </View>

        {/* Learning Objectives */}
        {lesson.objectives && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Learning Objectives</Text>
            <View style={styles.objectivesCard}>
              {lesson.objectives.map((objective, index) => (
                <View key={index} style={styles.objectiveItem}>
                  <Text style={styles.objectiveBullet}>•</Text>
                  <Text style={styles.objectiveText}>{objective}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resources */}
        {lesson.attachments && lesson.attachments.length > 0 && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Resources</Text>
            <View style={styles.resourcesCard}>
              {lesson.attachments.map((resource, index) => (
                <TouchableOpacity key={index} style={styles.resourceItem}>
                  <Ionicons name="document-text" size={20} color={colors.primary} />
                  <Text style={styles.resourceName}>{resource.name}</Text>
                  <Ionicons name="download" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Progress Section */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Status</Text>
              <View style={[
                styles.progressStatus,
                { backgroundColor: isCompleted ? '#10b981' : '#e2e8f0' }
              ]}>
                <Text style={[
                  styles.progressStatusText,
                  { color: isCompleted ? 'white' : colors.textSecondary }
                ]}>
                  {isCompleted ? 'Completed' : 'Not Started'}
                </Text>
              </View>
            </View>
            {lesson.progress && (
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Time Spent</Text>
                <Text style={styles.progressValue}>
                  {lesson.progress.timeSpent || 0} minutes
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!isCompleted ? (
            <AccessibleButton
              title={loading ? "Completing..." : "Mark as Complete"}
              onPress={handleCompleteLesson}
              disabled={loading}
              loading={loading}
              variant="primary"
              size="large"
              icon="checkmark-circle"
              hapticType="success"
              accessibilityLabel="Mark lesson as complete"
              accessibilityHint="Double tap to mark this lesson as completed"
              style={styles.completeButton}
            />
          ) : (
            <View style={styles.completedSection}>
              <View style={styles.completedMessage}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={[styles.completedMessageText, { fontSize: getScaledFontSize(typography.body.fontSize) }]}>
                  Great job! You've completed this lesson.
                </Text>
              </View>
            </View>
          )}

          {lesson.quizzes && lesson.quizzes.length > 0 && (
            <AccessibleButton
              title="Take Quiz"
              onPress={handleStartQuiz}
              variant="secondary"
              size="large"
              icon="help-circle"
              hapticType="medium"
              accessibilityLabel="Take quiz for this lesson"
              accessibilityHint="Double tap to start the quiz"
              style={styles.quizButton}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: spacing.xxl + 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  completedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  lessonInfoCard: {
    backgroundColor: 'white',
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  lessonIconText: {
    fontSize: 28,
  },
  lessonDetails: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  lessonSubject: {
    fontSize: typography.body.fontSize,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  lessonDuration: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  lessonDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  contentSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
  },
  contentCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    lineHeight: 24,
  },
  objectivesCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  objectiveBullet: {
    fontSize: 16,
    color: colors.primary,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  objectiveText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
    lineHeight: 22,
  },
  resourcesCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resourceName: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  progressCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  progressStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  progressStatusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    fontWeight: '600',
  },
  actionSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.md,
    marginBottom: spacing.md,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  quizButton: {
    backgroundColor: colors.secondary,
  },
  actionButtonText: {
    color: 'white',
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  completedSection: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  completedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedMessageText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
});

export default LessonDetailScreen;
