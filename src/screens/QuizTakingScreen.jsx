import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, commonStyles } from '../styles/theme';
import { useAccessibility } from '../hooks/useAccessibility';

const QuizTakingScreen = ({ navigation, route }) => {
  const { quiz } = route.params;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60 || 1200); // Convert minutes to seconds
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const {
    settings: accessibilitySettings,
    triggerHaptic,
    speak,
    announce,
    getAccessibilityProps,
    getScaledFontSize
  } = useAccessibility();

  // Timer effect
  useEffect(() => {
    if (!quizStarted || quizCompleted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, timeLeft]);

  // Progress animation
  useEffect(() => {
    const progress = (currentQuestionIndex + 1) / quiz.questions.length;
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = async () => {
    setQuizStarted(true);
    await triggerHaptic('medium');
    await speak('Quiz started. Good luck!');
  };

  const handleAnswerSelect = async (questionIndex, answerIndex) => {
    const newAnswers = {
      ...selectedAnswers,
      [questionIndex]: answerIndex
    };
    setSelectedAnswers(newAnswers);
    await triggerHaptic('light');
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      await triggerHaptic('light');
    }
  };

  const handlePreviousQuestion = async () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      await triggerHaptic('light');
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      await triggerHaptic('medium');

      // Calculate score
      let correctAnswers = 0;
      const results = quiz.questions.map((question, index) => {
        const userAnswer = selectedAnswers[index];
        const isCorrect = userAnswer === question.correctIndex;
        if (isCorrect) correctAnswers++;
        
        return {
          question: question.question,
          userAnswer: userAnswer !== undefined ? question.options[userAnswer] : 'Not answered',
          correctAnswer: question.options[question.correctIndex],
          isCorrect,
          options: question.options
        };
      });

      const score = Math.round((correctAnswers / quiz.questions.length) * 100);
      const result = {
        score,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        results,
        timeSpent: (quiz.timeLimit * 60) - timeLeft,
        completedAt: new Date()
      };

      setQuizResult(result);
      setQuizCompleted(true);

      // Submit to backend
      await submitQuizToBackend(result);
      
      await speak(`Quiz completed! Your score is ${score}%.`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz results');
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuizToBackend = async (result) => {
    try {
      const { submitQuiz } = await import('../api/lessons');
      const { AuthService } = await import('../services/auth');
      
      const token = await AuthService.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const answers = quiz.questions.map((question, index) => ({
        questionIndex: index,
        selectedAnswer: selectedAnswers[index] || -1,
        correctAnswer: question.correctIndex
      }));

      const response = await submitQuiz(quiz._id, answers, result.timeSpent, token);
      
      if (!response.success) {
        console.error('Failed to submit quiz:', response.error);
      }
    } catch (error) {
      console.error('Error submitting quiz to backend:', error);
      // Don't show error to user, quiz is already completed locally
    }
  };

  const renderStartScreen = () => (
    <View style={styles.startContainer}>
      <View style={styles.startCard}>
        <Text style={styles.quizIcon}>🧠</Text>
        <Text style={styles.quizTitle}>{quiz.title}</Text>
        <Text style={styles.quizDescription}>{quiz.description || 'Test your knowledge'}</Text>
        
        <View style={styles.quizInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{quiz.questions.length} Questions</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{quiz.timeLimit || 20} Minutes</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="school-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{quiz.subject || 'General'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartQuiz}
          {...getAccessibilityProps('Start Quiz')}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            style={styles.startButtonGradient}
          >
            <Text style={styles.startButtonText}>Start Quiz</Text>
            <Ionicons name="play" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQuestion = () => {
    const question = quiz.questions[currentQuestionIndex];
    const userAnswer = selectedAnswers[currentQuestionIndex];

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]}
            />
          </View>
        </View>

        <Text style={styles.questionText}>{question.question}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                userAnswer === index && styles.optionSelected
              ]}
              onPress={() => handleAnswerSelect(currentQuestionIndex, index)}
              {...getAccessibilityProps(`Option ${index + 1}: ${option}`)}
            >
              <View style={[
                styles.radioButton,
                userAnswer === index && styles.radioSelected
              ]}>
                {userAnswer === index && <Text style={styles.radioDot}>●</Text>}
              </View>
              <Text style={[
                styles.optionText,
                userAnswer === index && styles.optionTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              currentQuestionIndex === 0 && styles.navButtonDisabled
            ]}
            onPress={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.submitButton]}
              onPress={handleSubmitQuiz}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Text>
              <Ionicons name="checkmark" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNextQuestion}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderResults = () => {
    if (!quizResult) return null;

    return (
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsIcon}>🎉</Text>
          <Text style={styles.resultsTitle}>Quiz Completed!</Text>
          <Text style={styles.resultsScore}>{quizResult.score}%</Text>
          <Text style={styles.resultsSubtitle}>
            {quizResult.correctAnswers} out of {quizResult.totalQuestions} correct
          </Text>
        </View>

        <View style={styles.resultsSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Score</Text>
            <Text style={styles.summaryValue}>{quizResult.score}%</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Time Taken</Text>
            <Text style={styles.summaryValue}>{formatTime(quizResult.timeSpent)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Correct Answers</Text>
            <Text style={styles.summaryValue}>{quizResult.correctAnswers}/{quizResult.totalQuestions}</Text>
          </View>
        </View>

        <View style={styles.resultsDetails}>
          <Text style={styles.detailsTitle}>Question Review</Text>
          {quizResult.results.map((result, index) => (
            <View key={index} style={styles.questionReview}>
              <Text style={styles.reviewQuestion}>Q{index + 1}: {result.question}</Text>
              <View style={styles.reviewAnswers}>
                <View style={[styles.answerRow, result.isCorrect ? styles.correctAnswer : styles.incorrectAnswer]}>
                  <Text style={styles.answerLabel}>Your Answer:</Text>
                  <Text style={styles.answerText}>{result.userAnswer}</Text>
                  <Ionicons 
                    name={result.isCorrect ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={result.isCorrect ? colors.success : colors.error} 
                  />
                </View>
                {!result.isCorrect && (
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                    <Text style={[styles.answerText, styles.correctAnswerText]}>{result.correctAnswer}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => {
            // Navigate back and trigger refresh
            if (navigation.navigate) {
              navigation.navigate('Home', { refreshQuizzes: true });
            } else {
              navigation.goBack();
            }
          }}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.finishButtonGradient}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
            <Ionicons name="home" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{quiz.title}</Text>
            {quizStarted && !quizCompleted && (
              <Text style={styles.headerTimer}>{formatTime(timeLeft)}</Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {!quizStarted && renderStartScreen()}
        {quizStarted && !quizCompleted && renderQuestion()}
        {quizCompleted && renderResults()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerTimer: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  
  // Start Screen Styles
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    ...commonStyles.shadow,
  },
  quizIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  quizDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  quizInfo: {
    width: '100%',
    marginBottom: 30,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 10,
  },
  startButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    gap: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },

  // Question Screen Styles
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 30,
    lineHeight: 28,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    color: colors.primary,
    fontSize: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  prevButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.success,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Results Screen Styles
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    marginBottom: 20,
    ...commonStyles.shadow,
  },
  resultsIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultsSummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...commonStyles.shadow,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultsDetails: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...commonStyles.shadow,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  questionReview: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  reviewQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  reviewAnswers: {
    gap: 8,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  correctAnswer: {
    backgroundColor: colors.success + '20',
  },
  incorrectAnswer: {
    backgroundColor: colors.error + '20',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 100,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  correctAnswerText: {
    color: colors.success,
    fontWeight: '600',
  },
  finishButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  finishButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default QuizTakingScreen;
