import React, {useEffect, useState, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {colors, spacing, typography, dimensions, commonStyles} from '../../styles/theme';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import QuizCard from '../../components/QuizCard';
import notificationService from '../../services/notifications';
import { useLocale } from '../../hooks/useLocale';
import { useAccessibility } from '../../hooks/useAccessibility';
import AccessibleButton from '../../components/AccessibleButton';
import GeminiChatbotInterface from '../../components/chatbot/GeminiChatbotInterface';

const StudentDashboard = ({navigation, route, userData}) => {
  const [user] = useState({
    name: userData?.name || 'Emma Smith',
    role: 'Student',
    grade: 'Grade 5A',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const { getQueue } = useOfflineQueue();
  const [quizzes, setQuizzes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [studentQuizzes, setStudentQuizzes] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [guidedStepIdx, setGuidedStepIdx] = useState(0);
  const [happyCount, setHappyCount] = useState(0);
  const [sadCount, setSadCount] = useState(0);
  const [showChatbot, setShowChatbot] = useState(false);
  
  // Voice control states
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);
  const lessonsSectionRef = useRef(null);
  const quizzesSectionRef = useRef(null);
  const { t } = useLocale();
  const { 
    settings: accessibilitySettings, 
    triggerHaptic, 
    speak, 
    announce, 
    getAccessibilityProps,
    getScaledFontSize 
  } = useAccessibility();

  const guidedLessonSteps = useMemo(() => ([
    { icon: '👂', title: 'Listen', text: 'Listen carefully to the instruction.' },
    { icon: '👆', title: 'Tap', text: 'Tap the correct picture.' },
    { icon: '🔁', title: 'Repeat', text: 'Repeat after the teacher.' },
  ]), []);

  useEffect(() => {
    loadQuizzes();
    loadStudentData();
  }, []);

  // Refresh data when screen comes into focus (e.g., returning from lesson detail)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStudentData();
      loadQuizzes();
    });

    return unsubscribe;
  }, [navigation]);

  // Listen for route params to refresh data
  useEffect(() => {
    if (route?.params?.refreshQuizzes) {
      loadStudentData();
      loadQuizzes();
      // Clear the refresh parameter
      if (navigation.setParams) {
        navigation.setParams({ refreshQuizzes: undefined });
      }
    }
  }, [route?.params?.refreshQuizzes, navigation]);

  // Voice control animations
  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  // Simple voice command processing
  const processSimpleVoiceCommand = (transcript) => {
    const command = transcript.toLowerCase().trim();
    
    // Navigation commands
    if (command.includes('go to') || command.includes('navigate to')) {
      const destination = extractDestination(command);
      return {
        type: 'navigation',
        action: 'navigate',
        destination: destination
      };
    }

    // Help commands
    if (command.includes('help') || command.includes('assistance')) {
      return {
        type: 'help',
        action: 'show_help'
      };
    }

    // Quiz commands
    if (command.includes('quiz') || command.includes('take quiz')) {
      return {
        type: 'quiz_answer',
        action: 'start_quiz'
      };
    }

    // Repeat commands
    if (command.includes('repeat') || command.includes('again')) {
      return {
        type: 'repeat',
        action: 'repeat_content'
      };
    }

    // Default to text input
    return {
      type: 'text_input',
      action: 'input_text',
      text: transcript
    };
  };

  // Extract destination from navigation command
  const extractDestination = (command) => {
    const destinations = {
      'home': 'home',
      'dashboard': 'home',
      'calendar': 'calendar',
      'people': 'people',
      'messages': 'messages',
      'settings': 'settings',
      'lessons': 'lessons',
      'progress': 'progress'
    };

    for (const [key, value] of Object.entries(destinations)) {
      if (command.includes(key)) {
        return value;
      }
    }

    return 'home'; // Default destination
  };

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const { AuthService } = await import('../../services/auth');
      const token = await AuthService.getStoredToken();
      
      if (token) {
        const { getStudentLessons, getStudentQuizzes } = await import('../../api/lessons');
        const CalendarService = await import('../../services/calendar');
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Load events from last week
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // Load events for next month
        
        // Load lessons, quizzes, and events in parallel
        const [lessonsResult, quizzesResult, eventsResult] = await Promise.all([
          getStudentLessons(token),
          getStudentQuizzes(token),
          CalendarService.default.getEventsByRange(startDate, endDate)
        ]);
        
        if (lessonsResult.success) {
          setLessons(lessonsResult.data || []);
        }
        
        if (quizzesResult.success) {
          setStudentQuizzes(quizzesResult.data || []);
        }

        if (eventsResult.events) {
          setEvents(eventsResult.events || []);
        }
      }
    } catch (error) {
      console.error('Failed to load student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async () => {
    try {
      const q = await getQueue('quizzes');
      setQuizzes(q.slice(-5));
    } catch (e) {
      // noop
    }
  };

  // Unified overview cards for all students with gamification
  const [gamificationData, setGamificationData] = useState(null);
  
  useEffect(() => {
    loadGamificationData();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up voice control');
    };
  }, []);

  const loadGamificationData = async () => {
    try {
      const GamificationService = await import('../../services/gamificationService');
      const result = await GamificationService.default.getUserProgress(user?.id || 'default-user');
      if (result.success) {
        setGamificationData(result.data);
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    }
  };

  // Voice control functions
  const startVoiceControl = async () => {
    try {
      // Check if already listening
      if (isListening) {
        await speak('Voice control is already active');
        return;
      }

      setIsListening(true);
      setIsProcessing(false);
      setLastCommand('');

      // Initialize voice recognition (simplified)
      console.log('Voice recognition initialized');

      // Show voice recording modal
      setShowVoiceCommands(true);

      // Provide audio feedback
      await speak('Voice control activated. Speak your command now.');

    } catch (error) {
      console.error('Start voice control error:', error);
      Alert.alert('Error', 'Failed to start voice control');
      setIsListening(false);
    }
  };

  // Simulate voice input for demo
  const simulateVoiceInput = () => {
    const commands = [
      'Go to calendar',
      'Go to people',
      'Go to messages',
      'Go to settings',
      'Take quiz',
      'Help me'
    ];
    
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    setLastCommand(randomCommand);
    
    // Process the simulated voice command
    setTimeout(() => {
      processVoiceCommand(randomCommand);
    }, 1000);
  };

  const stopVoiceControl = async () => {
    try {
      setIsListening(false);
      setIsProcessing(false);
      setLastCommand('');
      setShowVoiceCommands(false);
      
      // Provide feedback
      await speak('Voice control stopped');
      
    } catch (error) {
      console.error('Stop voice control error:', error);
      setIsListening(false);
      setIsProcessing(false);
      setLastCommand('');
      setShowVoiceCommands(false);
    }
  };

  const simulateVoiceCommand = async () => {
    // Simulate different voice commands for demo
    const commands = [
      'Go to lessons',
      'Show my progress',
      'Take quiz',
      'Go to calendar',
      'Show my badges',
      'Help me'
    ];
    
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    setLastCommand(randomCommand);
    
    // Process after a short delay
    setTimeout(() => {
      processVoiceCommand(randomCommand);
    }, 1000);
  };

  const processVoiceCommand = async (voiceInput = null) => {
    try {
      setIsProcessing(true);
      const input = voiceInput || lastCommand || '';
      
      if (!input.trim()) {
        setIsProcessing(false);
        setIsListening(false);
        setShowVoiceCommands(false);
        return;
      }
      
      // Process the voice command using simple logic
      const command = processSimpleVoiceCommand(input);
      
      // Execute the command
      await executeVoiceCommand(command, input);
      
      // Provide audio feedback
      await speak('Command executed successfully!');
      
      setIsProcessing(false);
      setIsListening(false);
      setShowVoiceCommands(false);
    } catch (error) {
      console.error('Process voice command error:', error);
      setIsProcessing(false);
      setIsListening(false);
      setShowVoiceCommands(false);
      
      // Provide error feedback
      await speak('Sorry, I had trouble processing that command');
    }
  };

  const executeVoiceCommand = async (command, originalInput) => {
    try {
      await triggerHaptic('medium');
      
      switch (command.type) {
        case 'navigation':
          await handleNavigationCommand(command, originalInput);
          break;
        case 'quiz_answer':
          await handleQuizCommand(command, originalInput);
          break;
        case 'help':
          await handleHelpCommand(command, originalInput);
          break;
        case 'repeat':
          await handleRepeatCommand(command, originalInput);
          break;
        case 'confirmation':
          await handleConfirmationCommand(command, originalInput);
          break;
        case 'text_input':
          await handleTextInputCommand(command, originalInput);
          break;
        default:
          await speak(`I didn't understand that command. Try saying "help" for available commands.`);
      }
    } catch (error) {
      console.error('Execute voice command error:', error);
      await speak('Sorry, I had trouble processing that command. Please try again.');
    }
  };

  const handleNavigationCommand = async (command, originalInput) => {
    await speak(`Navigating to ${command.destination}`);
    
    switch (command.destination) {
      case 'lessons':
        navigation.navigate('Lessons');
        break;
      case 'progress':
        navigation.navigate('Progress');
        break;
      case 'calendar':
        navigation.navigate('Calendar');
        break;
      case 'home':
        // Already on home/dashboard
        await speak('You are already on the home screen');
        break;
      default:
        await speak(`I can navigate to lessons, progress, or calendar. Which would you like?`);
    }
  };

  const handleQuizCommand = async (command, originalInput) => {
    if (studentQuizzes.length > 0) {
      await speak(`Taking quiz: ${studentQuizzes[0].title}`);
      // Navigate to quiz screen
      // navigation.navigate('QuizScreen', { quiz: studentQuizzes[0] });
    } else {
      await speak('No quizzes available at the moment');
    }
  };

  const handleHelpCommand = async (command, originalInput) => {
    setShowVoiceCommands(true);
    await speak('Here are the voice commands you can use: Go to lessons, Show my progress, Take quiz, Go to calendar, Show my badges, Help me');
  };

  const handleRepeatCommand = async (command, originalInput) => {
    await speak('Repeating the last instruction');
    // Repeat last lesson step or instruction
  };

  const handleConfirmationCommand = async (command, originalInput) => {
    if (command.action === 'yes') {
      await speak('Yes, I understand');
    } else {
      await speak('No, I understand');
    }
  };

  const handleTextInputCommand = async (command, originalInput) => {
    await speak(`You said: ${command.text}`);
    // Handle text input if needed
  };

  // Calculate completed items for points
  const completedLessons = lessons.filter(lesson => lesson.progress?.isCompleted).length;
  const completedQuizzes = studentQuizzes.filter(quiz => quiz.progress?.isCompleted).length;
  const totalCompleted = completedLessons + completedQuizzes;

  const features = [
    { id: 1, title: 'Lessons', icon: '📚', color: '#3b82f6', count: lessons.length.toString() },
    { id: 2, title: 'Quizzes', icon: '🧠', color: '#10b981', count: studentQuizzes.length.toString() },
    { id: 3, title: 'Points', icon: '⭐', color: '#f59e0b', count: totalCompleted.toString() },
    { id: 4, title: 'Level', icon: '🏆', color: '#ef4444', count: gamificationData?.level?.name || 'Beginner' },
  ];

  // Today's schedule - use real events from API
  const todaysSchedule = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }).map(event => ({
    id: event._id,
    subject: event.title,
    time: event.startTime || 'All day',
    teacher: event.type === 'lesson' ? 'Teacher' : 'Event',
    duration: event.endTime ? `${event.startTime} - ${event.endTime}` : 'All day',
    room: event.location || 'Classroom',
    event: event // Keep reference to original event
  }));

  // Unified recent activity for all students
  const recentActivity = [
    { id: 1, title: 'Lesson Completed', student: 'Math Lesson - Earned 2 stars', time: 'Just now', type: 'lesson' },
    { id: 2, title: 'Quiz Finished', student: 'Science Quiz - 95% score', time: '30 mins ago', type: 'quiz' },
    { id: 3, title: 'Art Activity', student: 'Drew a beautiful picture', time: '1 hour ago', type: 'activity' },
    { id: 4, title: 'Reading Practice', student: 'Read 5 words correctly', time: '2 hours ago', type: 'reading' },
  ];

  // Unified quick actions for all students
  const quickActions = [
    { id: 1, title: 'My Lessons', icon: '📚', color: '#2563eb' },
    { id: 2, title: 'Audio Guide', icon: '🔊', color: '#059669' },
    { id: 3, title: 'Art Time', icon: '🎨', color: '#7c3aed' },
  ];


  const renderFeature = (feature) => {
    const handlePress = async () => {
      await triggerHaptic('light');
      
      switch (feature.title) {
        case 'Lessons':
          await speak(`Showing ${lessons.length} lessons`);
          // Scroll to lessons section
          setTimeout(() => {
            lessonsSectionRef.current?.measure((x, y, width, height, pageX, pageY) => {
              scrollViewRef.current?.scrollTo({
                y: pageY - 100,
                animated: true
              });
            });
          }, 100);
          break;
        case 'Quizzes':
          await speak(`Showing ${studentQuizzes.length} quizzes`);
          // Scroll to quizzes section
          setTimeout(() => {
            quizzesSectionRef.current?.measure((x, y, width, height, pageX, pageY) => {
              scrollViewRef.current?.scrollTo({
                y: pageY - 100,
                animated: true
              });
            });
          }, 100);
          break;
        case 'Points':
          const completedLessons = lessons.filter(lesson => lesson.progress?.isCompleted).length;
          const completedQuizzes = studentQuizzes.filter(quiz => quiz.progress?.isCompleted).length;
          const totalCompleted = completedLessons + completedQuizzes;
          await speak(`You have completed ${completedLessons} lessons and ${completedQuizzes} quizzes. Total points: ${totalCompleted}`);
          Alert.alert(
            'Your Progress',
            `📚 Completed Lessons: ${completedLessons}\n🧠 Completed Quizzes: ${completedQuizzes}\n⭐ Total Points: ${totalCompleted}`,
            [{ text: 'OK' }]
          );
          break;
        case 'Level':
          await speak(`Current level: ${feature.count}`);
          Alert.alert(
            'Your Level',
            `🏆 Current Level: ${feature.count}\n⭐ Points: ${gamificationData?.points || 0}\n🎯 Progress to next level`,
            [{ text: 'OK' }]
          );
          break;
      }
    };

    return (
      <TouchableOpacity 
        key={feature.id} 
        style={styles.featureCard}
        onPress={handlePress}
        activeOpacity={0.7}
      >
      <View style={[styles.featureIcon, {backgroundColor: feature.color + '20'}]}>
        <Text style={styles.featureIconText}>{feature.icon}</Text>
      </View>
      <Text style={styles.featureCount}>{feature.count}</Text>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      </TouchableOpacity>
    );
  };

  const renderScheduleItem = (scheduleItem) => {
    const handlePress = async () => {
      if (scheduleItem.event) {
        await triggerHaptic('light');
        await speak(`Event: ${scheduleItem.event.title}`);
        // TODO: Navigate to event detail screen when implemented
        Alert.alert('Event Details', `Title: ${scheduleItem.event.title}\nDescription: ${scheduleItem.event.description || 'No description'}\nLocation: ${scheduleItem.event.location || 'No location specified'}`);
      }
    };

    return (
      <TouchableOpacity key={scheduleItem.id} style={styles.classCard} onPress={handlePress}>
      <View style={styles.classTime}>
        <Text style={styles.classTimeText}>{scheduleItem.time}</Text>
        <Text style={styles.classDuration}>{scheduleItem.duration}</Text>
      </View>
      <View style={styles.classInfo}>
        <Text style={styles.classSubject}>{scheduleItem.subject}</Text>
        <Text style={styles.classDetail}>{scheduleItem.teacher} • {scheduleItem.room}</Text>
      </View>
      <View style={styles.classStatus}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: scheduleItem.event?.type === 'lesson' ? '#10b981' : '#3b82f6' }
          ]} />
      </View>
    </TouchableOpacity>
  );
  };

  const renderActivity = (activity) => (
    <View key={activity.id} style={styles.activityItem}>
      <View style={[
        styles.activityIcon,
        {backgroundColor: activity.type === 'assignment' || activity.type === 'lesson' ? '#10b98120' :
                          activity.type === 'quiz' || activity.type === 'activity' ? '#3b82f620' :
                                                        '#f59e0b20'}
      ]}>
        <Text style={styles.activityIconText}>
          {activity.type === 'assignment' || activity.type === 'lesson' ? '📝' :
           activity.type === 'quiz' || activity.type === 'activity' ? '🎯' : '🏆'}
        </Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityStudent}>{activity.student}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </View>
  );

  const renderQuickAction = (action) => (
    <TouchableOpacity key={action.id} style={styles.quickAction}>
      <View style={[styles.quickActionIcon, {backgroundColor: action.color + '20'}]}>
        <Text style={styles.quickActionIconText}>{action.icon}</Text>
      </View>
      <Text style={styles.quickActionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );

  const renderLessonCard = (lesson) => {
    const handlePress = async () => {
      await triggerHaptic('medium');
      await speak(`Opening lesson: ${lesson.title}`);
      navigation.navigate('LessonDetail', { lesson });
    };

    const accessibilityProps = getAccessibilityProps('button', {
      label: `Lesson: ${lesson.title}. Subject: ${lesson.subject}. ${lesson.progress?.isCompleted ? 'Completed' : 'Not completed'}`,
      hint: 'Double tap to open lesson details',
      state: { disabled: false }
    });

    return (
      <TouchableOpacity 
        key={lesson._id} 
        style={styles.lessonCard}
        onPress={handlePress}
        activeOpacity={0.7}
        {...accessibilityProps}
      >
        <View style={styles.lessonHeader}>
          <Text style={[styles.lessonTitle, { fontSize: getScaledFontSize(16) }]}>
            {lesson.title}
          </Text>
          <Text style={[styles.lessonSubject, { fontSize: getScaledFontSize(14) }]}>
            {lesson.subject}
          </Text>
        </View>
        <Text style={[styles.lessonDescription, { fontSize: getScaledFontSize(14) }]} numberOfLines={2}>
          {lesson.description || 'No description available'}
        </Text>
        <View style={styles.lessonFooter}>
          <Text style={[styles.lessonDate, { fontSize: getScaledFontSize(12) }]}>
            {new Date(lesson.createdAt).toLocaleDateString()}
          </Text>
          <View style={[
            styles.progressIndicator,
            { backgroundColor: lesson.progress?.isCompleted ? '#10b981' : '#e2e8f0' }
          ]}>
            <Text style={[styles.progressText, { fontSize: getScaledFontSize(12) }]}>
              {lesson.progress?.isCompleted ? '✓' : '○'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStudentQuizCard = (quiz) => {
    const handlePress = async () => {
      await triggerHaptic('medium');
      await speak(`Opening quiz: ${quiz.title}`);
      navigation.navigate('QuizTaking', { quiz });
    };

    const accessibilityProps = getAccessibilityProps('button', {
      label: `Quiz: ${quiz.title}. ${quiz.questions?.length || 0} questions. ${quiz.progress?.isCompleted ? 'Completed' : 'Available'}`,
      hint: 'Double tap to open quiz',
      state: { disabled: false }
    });

    return (
      <TouchableOpacity 
        key={quiz._id} 
        style={styles.quizCard}
        onPress={handlePress}
        activeOpacity={0.7}
        {...accessibilityProps}
      >
        <View style={styles.quizHeader}>
          <Text style={[styles.quizTitle, { fontSize: getScaledFontSize(16) }]}>
            {quiz.title}
          </Text>
          <View style={styles.quizHeaderRow}>
          <Text style={[styles.quizSubject, { fontSize: getScaledFontSize(14) }]}>
            {quiz.lessonId ? 'Quiz' : 'Standalone Quiz'}
          </Text>
            {quiz.progress?.isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>✓</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.quizDescription, { fontSize: getScaledFontSize(14) }]} numberOfLines={2}>
          {quiz.description || 'Test your knowledge'}
        </Text>
        <View style={styles.quizFooter}>
          <View style={styles.quizFooterLeft}>
          <Text style={[styles.quizQuestions, { fontSize: getScaledFontSize(12) }]}>
            {quiz.questions?.length || 0} questions
          </Text>
            {quiz.progress?.lastAttemptAt && (
              <Text style={[styles.quizCompletionDate, { fontSize: getScaledFontSize(10) }]}>
                {quiz.progress.isCompleted ? 'Completed' : 'Last attempt'}: {new Date(quiz.progress.lastAttemptAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          <View style={[
            styles.quizStatus,
            { 
              backgroundColor: quiz.progress?.isCompleted ? '#10b981' : 
                              quiz.progress?.attempts > 0 ? '#f59e0b' : '#3b82f6' 
            }
          ]}>
            <Text style={[styles.quizStatusText, { fontSize: getScaledFontSize(12) }]}>
              {quiz.progress?.isCompleted ? 
                `Completed (${quiz.progress?.bestScore || 0}%)` : 
                quiz.progress?.attempts > 0 ? 
                `Attempted (${quiz.progress?.lastScore || 0}%)` : 
                'Available'
              }
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventCard = (event) => {
    const eventDate = new Date(event.date);
    const isToday = eventDate.toDateString() === new Date().toDateString();
    const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
    
    let timeText = '';
    if (isToday) {
      timeText = 'Today';
    } else if (isTomorrow) {
      timeText = 'Tomorrow';
    } else {
      timeText = eventDate.toLocaleDateString();
    }

    if (event.startTime) {
      timeText += ` at ${event.startTime}`;
    }

    const handlePress = async () => {
      await triggerHaptic('light');
      await speak(`Event: ${event.title}. ${timeText}`);
    };

    const accessibilityProps = getAccessibilityProps('button', {
      label: `Event: ${event.title}. ${timeText}. ${event.description || ''}. ${event.location ? `Location: ${event.location}` : ''}`,
      hint: 'Double tap to view event details',
      state: { disabled: false }
    });

    return (
      <TouchableOpacity 
        key={event._id} 
        style={styles.eventCard}
        onPress={handlePress}
        activeOpacity={0.7}
        {...accessibilityProps}
      >
        <View style={styles.eventHeader}>
          <View style={[styles.eventIcon, { backgroundColor: getEventColor(event.type) }]}>
            <Text style={styles.eventEmoji}>{getEventEmoji(event.type)}</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={[styles.eventTitle, { fontSize: getScaledFontSize(16) }]}>
              {event.title}
            </Text>
            <Text style={[styles.eventTime, { fontSize: getScaledFontSize(14) }]}>
              {timeText}
            </Text>
          </View>
          <View style={[
            styles.eventPriority,
            { backgroundColor: getPriorityColor(event.priority) }
          ]}>
            <Text style={[styles.eventPriorityText, { fontSize: getScaledFontSize(12) }]}>
              {event.priority?.charAt(0).toUpperCase() || 'M'}
            </Text>
          </View>
        </View>
        {event.description && (
          <Text style={[styles.eventDescription, { fontSize: getScaledFontSize(14) }]} numberOfLines={2}>
            {event.description}
          </Text>
        )}
        {event.location && (
          <Text style={[styles.eventLocation, { fontSize: getScaledFontSize(12) }]}>
            📍 {event.location}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'lesson': return '#3b82f6';
      case 'assignment': return '#10b981';
      case 'deadline': return '#ef4444';
      case 'exam': return '#f59e0b';
      case 'meeting': return '#8b5cf6';
      case 'event': return '#06b6d4';
      case 'reminder': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getEventEmoji = (type) => {
    switch (type) {
      case 'lesson': return '📚';
      case 'assignment': return '📝';
      case 'deadline': return '⏰';
      case 'exam': return '📝';
      case 'meeting': return '👥';
      case 'event': return '🎉';
      case 'reminder': return '🔔';
      default: return '📅';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ===== Header now scrolls with content (gradient) ===== */}
        <LinearGradient
          colors={highContrast ? ['#000000', '#000000', '#000000'] : ['#0f172a', '#1e3a8a', '#2563eb']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.header}
        >
          {/* top row */}
          <View style={styles.headerRow}>
            {/* left: profile */}
            <TouchableOpacity style={styles.avatarBtn}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</Text>
              </View>
            </TouchableOpacity>

            {/* center/right: name */}
            <View style={styles.nameBlock}>
              <Text style={styles.userName}>{user.name}</Text>
            </View>

            {/* right: voice control + chatbot + notifications + settings */}
            <View style={styles.topActions}>
              {/* Chatbot Button */}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setShowChatbot(true)}
                accessibilityLabel="Open AI Learning Buddy"
                accessibilityHint="Double tap to chat with your AI learning assistant"
              >
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.surface} />
              </TouchableOpacity>

              {/* Voice Control Button */}
              <TouchableOpacity
                style={[styles.iconBtn, styles.voiceControlBtn]}
                onPress={isListening ? stopVoiceControl : startVoiceControl}
                accessibilityLabel={isListening ? "Stop voice control" : "Start voice control"}
                accessibilityHint="Double tap to start or stop voice commands"
              >
                <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
                  <Ionicons 
                    name={isListening ? "stop-circle" : "mic"} 
                    size={20} 
                    color={isListening ? "#ef4444" : "white"} 
                  />
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={styles.iconBtn}
              >
                <Text style={styles.topIcon}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                style={styles.iconBtn}
              >
                <Text style={styles.topIcon}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* thin stylish search bar */}
          <View style={styles.searchThin}>
            <Text style={styles.searchIcon}>🔎</Text>
            <TextInput
              style={styles.searchInputThin}
              placeholder="Search lessons, activities, assignments…"
              placeholderTextColor="#cbd5e1"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </LinearGradient>
        
        {/* Voice Control Overlay */}
        {(isListening || isProcessing) && (
          <View style={styles.voiceOverlay}>
            <View style={styles.voiceContainer}>
              <Animated.View 
                style={[
                  styles.voiceIndicator,
                  {
                    transform: [{ scale: pulseAnimation }],
                    backgroundColor: isListening ? '#ef4444' : '#3b82f6'
                  }
                ]}
              >
                <Ionicons 
                  name={isListening ? "mic" : "settings"} 
                  size={32} 
                  color="white" 
                />
              </Animated.View>
              
              <Text style={styles.voiceStatus}>
                {isListening ? 'Listening...' : 'Processing...'}
              </Text>
              
              {lastCommand && (
                <Text style={styles.voiceCommand}>
                  "{lastCommand}"
                </Text>
              )}
              
              <TouchableOpacity 
                style={styles.stopVoiceBtn}
                onPress={stopVoiceControl}
              >
                <Text style={styles.stopVoiceText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Voice Commands Help Modal */}
        {showVoiceCommands && (
          <View style={styles.voiceCommandsModal}>
            <View style={styles.voiceCommandsContainer}>
              <View style={styles.voiceCommandsHeader}>
                <Text style={styles.voiceCommandsTitle}>🎤 Voice Commands</Text>
                <TouchableOpacity 
                  style={styles.closeBtn}
                  onPress={() => {
                    setShowVoiceCommands(false);
                    setIsListening(false);
                  }}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {/* Voice Recording Interface */}
              <View style={styles.voiceInputSection}>
                <Text style={styles.voiceInputLabel}>
                  {isListening ? '🎤 Listening...' : 'Voice Command'}
                </Text>
                
                {isListening ? (
                  <View style={styles.listeningContainer}>
                    <Animated.View 
                      style={[
                        styles.listeningIndicator,
                        {
                          transform: [{ scale: pulseAnimation }],
                        }
                      ]}
                    >
                      <Text style={styles.listeningIcon}>🎤</Text>
                    </Animated.View>
                    <Text style={styles.listeningText}>
                      Microphone is active! Speak your command clearly and tap "Stop Voice Control" when done.
                    </Text>
                    <TouchableOpacity 
                      style={styles.stopListeningBtn}
                      onPress={stopVoiceControl}
                    >
                      <Text style={styles.stopListeningBtnText}>Stop Voice Control</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.manualCommandBtn}
                      onPress={() => {
                        simulateVoiceInput();
                      }}
                    >
                      <Text style={styles.manualCommandBtnText}>Test Voice Command</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.manualCommandBtn}
                      onPress={() => {
                        // Show input dialog for manual voice command
                        Alert.prompt(
                          'Voice Command',
                          'Enter your voice command:',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Send', onPress: (command) => {
                              if (command && command.trim()) {
                                setLastCommand(command.trim());
                                processVoiceCommand(command.trim());
                              }
                            }}
                          ],
                          'plain-text',
                          '',
                          'default'
                        );
                      }}
                    >
                      <Text style={styles.manualCommandBtnText}>Manual Voice Input</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.notListeningContainer}>
                    <Text style={styles.notListeningText}>
                      Voice control is ready. Click the microphone button to activate.
                    </Text>
                  </View>
                )}
                
                {lastCommand && (
                  <View style={styles.commandDisplay}>
                    <Text style={styles.commandLabel}>Last Command:</Text>
                    <Text style={styles.commandText}>"{lastCommand}"</Text>
                  </View>
                )}
              </View>
              
              {/* Available Commands */}
              <Text style={styles.availableCommandsTitle}>Available Commands:</Text>
              <ScrollView style={styles.voiceCommandsList}>
                <TouchableOpacity 
                  style={styles.voiceCommandItem}
                  onPress={async () => {
                    setLastCommand('Go to calendar');
                    await processVoiceCommand('Go to calendar');
                  }}
                >
                  <Text style={styles.voiceCommandIcon}>📅</Text>
                  <Text style={styles.voiceCommandText}>"Go to calendar"</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.voiceCommandItem}
                  onPress={async () => {
                    setLastCommand('Go to people');
                    await processVoiceCommand('Go to people');
                  }}
                >
                  <Text style={styles.voiceCommandIcon}>👥</Text>
                  <Text style={styles.voiceCommandText}>"Go to people"</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.voiceCommandItem}
                  onPress={async () => {
                    setLastCommand('Go to messages');
                    await processVoiceCommand('Go to messages');
                  }}
                >
                  <Text style={styles.voiceCommandIcon}>💬</Text>
                  <Text style={styles.voiceCommandText}>"Go to messages"</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.voiceCommandItem}
                  onPress={async () => {
                    setLastCommand('Go to settings');
                    await processVoiceCommand('Go to settings');
                  }}
                >
                  <Text style={styles.voiceCommandIcon}>⚙️</Text>
                  <Text style={styles.voiceCommandText}>"Go to settings"</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.voiceCommandItem}
                  onPress={async () => {
                    setLastCommand('Take quiz');
                    await processVoiceCommand('Take quiz');
                  }}
                >
                  <Text style={styles.voiceCommandIcon}>🧠</Text>
                  <Text style={styles.voiceCommandText}>"Take quiz"</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.voiceCommandItem}
                  onPress={async () => {
                    setLastCommand('Help me');
                    await processVoiceCommand('Help me');
                  }}
                >
                  <Text style={styles.voiceCommandIcon}>❓</Text>
                  <Text style={styles.voiceCommandText}>"Help me"</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
        
        {/* Feature Cards Grid */}
          <View style={styles.featuresGrid}>
            {features.map(renderFeature)}
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Events</Text>
            <TouchableOpacity onPress={loadStudentData}>
              <Text style={styles.seeAllText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.classesContainer}>
            {loading ? (
              <Text style={{ color: '#64748b', textAlign: 'center', padding: spacing.lg }}>
                Loading today's events...
              </Text>
            ) : todaysSchedule.length === 0 ? (
              <View style={{ alignItems: 'center', padding: spacing.lg }}>
                <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📅</Text>
                <Text style={{ color: '#64748b', textAlign: 'center', fontSize: 16, fontWeight: '600', marginBottom: spacing.sm }}>
                  No events today
                </Text>
                <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 14 }}>
                  Check back later for new events
                </Text>
          </View>
            ) : (
              todaysSchedule.map(renderScheduleItem)
            )}
          </View>
        </View>


        {/* Guided Lessons (Available for All Students) */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('guidedLesson')}</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={[styles.voiceBtn, { marginRight: spacing.sm }]}
                  onPress={() => notificationService.sendLocalTTS(guidedLessonSteps[guidedStepIdx].text, 'en')}
                >
              <Text style={styles.voiceBtnText}>🔊 {t('playVoice')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.voiceBtn}
                  onPress={() => notificationService.sendLocalTTS(guidedLessonSteps[guidedStepIdx].text, 'en')}
                >
              <Text style={styles.voiceBtnText}>🔁 {t('next')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.guidedCard, highContrast && styles.guidedCardHC]}>
              <Text style={[styles.guidedIcon, highContrast && styles.guidedIconHC]}>
                {guidedLessonSteps[guidedStepIdx].icon}
              </Text>
              <Text style={[styles.guidedTitle, highContrast && styles.guidedTitleHC]}>
                {guidedLessonSteps[guidedStepIdx].title}
              </Text>
              <Text style={[styles.guidedText, highContrast && styles.guidedTextHC]}>
                {guidedLessonSteps[guidedStepIdx].text}
              </Text>

              <View style={styles.guidedControls}>
                <TouchableOpacity
                  style={[styles.navBtn, guidedStepIdx === 0 && styles.navBtnDisabled]}
                  disabled={guidedStepIdx === 0}
                  onPress={() => setGuidedStepIdx(Math.max(0, guidedStepIdx - 1))}
                >
                  <Text style={styles.navBtnText}>← {t('back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navBtn, guidedStepIdx === guidedLessonSteps.length - 1 && styles.navBtnDisabled]}
                  disabled={guidedStepIdx === guidedLessonSteps.length - 1}
                  onPress={() => setGuidedStepIdx(Math.min(guidedLessonSteps.length - 1, guidedStepIdx + 1))}
                >
                  <Text style={styles.navBtnText}>{t('next')} →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.emotionRow}>
                <TouchableOpacity style={styles.emotionBtn} onPress={() => setHappyCount(happyCount + 1)}>
                  <Text style={styles.emotionIcon}>😊</Text>
                  <Text style={styles.emotionText}>{happyCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.emotionBtn} onPress={() => setSadCount(sadCount + 1)}>
                  <Text style={styles.emotionIcon}>😐</Text>
                  <Text style={styles.emotionText}>{sadCount}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        {/* Lessons Section */}
        <View ref={lessonsSectionRef} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Lessons</Text>
            <TouchableOpacity onPress={loadStudentData}>
              <Text style={styles.seeAllText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.classesContainer}>
            {loading ? (
              <Text style={{ color: '#64748b', textAlign: 'center', padding: spacing.lg }}>
                Loading lessons...
              </Text>
            ) : lessons.length === 0 ? (
              <Text style={{ color: '#64748b', textAlign: 'center', padding: spacing.lg }}>
                No lessons available yet
              </Text>
            ) : (
              lessons.map(renderLessonCard)
            )}
          </View>
        </View>

        {/* Quizzes Section */}
        <View ref={quizzesSectionRef} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Quizzes</Text>
            <TouchableOpacity onPress={loadStudentData}>
              <Text style={styles.seeAllText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.classesContainer}>
            {loading ? (
              <Text style={{ color: '#64748b', textAlign: 'center', padding: spacing.lg }}>
                Loading quizzes...
              </Text>
            ) : studentQuizzes.length === 0 ? (
              <Text style={{ color: '#64748b', textAlign: 'center', padding: spacing.lg }}>
                No quizzes available yet
              </Text>
            ) : (
              studentQuizzes.map(renderStudentQuizCard)
            )}
          </View>
        </View>

        {/* Upcoming Events Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={loadStudentData}>
              <Text style={styles.seeAllText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.upcomingEventsCard}>
            {loading ? (
              <Text style={{ color: '#64748b', textAlign: 'center', padding: spacing.lg }}>
                Loading events...
              </Text>
            ) : events.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsIcon}>📅</Text>
                <Text style={styles.noEventsTitle}>No upcoming events</Text>
                <Text style={styles.noEventsText}>Check back later for new events and reminders</Text>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {events.slice(0, 3).map((event, index) => (
                  <View key={event._id} style={styles.eventItem}>
                    <View style={styles.eventItemLeft}>
                      <View style={[styles.eventItemIcon, { backgroundColor: getEventColor(event.type) }]}>
                        <Text style={styles.eventItemEmoji}>{getEventEmoji(event.type)}</Text>
                      </View>
                      <View style={styles.eventItemInfo}>
                        <Text style={[styles.eventItemTitle, { fontSize: getScaledFontSize(14) }]}>
                          {event.title}
                        </Text>
                        <Text style={[styles.eventItemTime, { fontSize: getScaledFontSize(12) }]}>
                          {(() => {
                            const eventDate = new Date(event.date);
                            const isToday = eventDate.toDateString() === new Date().toDateString();
                            const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                            
                            let timeText = '';
                            if (isToday) {
                              timeText = 'Today';
                            } else if (isTomorrow) {
                              timeText = 'Tomorrow';
                            } else {
                              timeText = eventDate.toLocaleDateString();
                            }

                            if (event.startTime) {
                              timeText += ` at ${event.startTime}`;
                            }
                            return timeText;
                          })()}
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      styles.eventItemPriority,
                      { backgroundColor: getPriorityColor(event.priority) }
                    ]}>
                      <Text style={styles.eventItemPriorityText}>
                        {event.priority?.charAt(0).toUpperCase() || 'M'}
                      </Text>
                    </View>
                  </View>
                ))}
                {events.length > 3 && (
                  <TouchableOpacity style={styles.viewAllEvents}>
                    <Text style={styles.viewAllEventsText}>
                      View all {events.length} events
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>


        {/* Student Progress Card */}
        <View style={styles.section}>
          <View style={styles.upcomingCard}>
            <LinearGradient
              colors={['#2563eb', '#3b82f6']}
              style={styles.upcomingGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <View style={styles.upcomingContent}>
                <View>
                  <Text style={styles.upcomingTitle}>
                    Keep Learning!
                  </Text>
                  <Text style={styles.upcomingTime}>
                    Next lesson: Art Time
                  </Text>
                  <Text style={styles.upcomingLocation}>
                    Tomorrow • 10:00 AM
                  </Text>
                </View>
                <View style={styles.reminderBadge}>
                  <Text style={styles.reminderText}>
                    Ready!
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      {/* Chatbot Interface */}
      {showChatbot && (
        <GeminiChatbotInterface 
          userData={userData}
          onClose={() => setShowChatbot(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* screen */
  container: { flex: 1, backgroundColor: '#f8fafc' },

  /* header (scrolls with content) */
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginHorizontal: -spacing.lg, // full-bleed edge-to-edge inside padded scroll
    marginVertical: -spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  avatarBtn: { padding: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    
  },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 16 },
  nameBlock: { flex: 1, marginLeft: spacing.sm,marginTop: spacing.lg },
  greeting: { fontSize: 13, color: '#e2e8f0', marginBottom: 2 },
  userName: {
    fontSize: 22, fontWeight: '800', color: 'white',
    marginTop:spacing.sm + -25, // a little space from the top / notch
  },
  topActions: { flexDirection: 'row', alignItems: 'center', columnGap: 10 },
  iconBtn: {
    paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)',
    marginLeft: 8,
  },
  topIcon: { color: 'white', fontSize: 18, },
  voiceControlBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  /* Voice Control Styles */
  voiceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  voiceContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '90%',
  },
  voiceIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },
  voiceCommand: {
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  stopVoiceBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stopVoiceText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  /* Voice Commands Modal */
  voiceCommandsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 1001,
    paddingTop: 50,
  },
  voiceCommandsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxWidth: '95%',
    maxHeight: '90%',
    minWidth: 320,
    marginTop: 20,
  },
  voiceCommandsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  voiceCommandsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  },
  voiceCommandsList: {
    maxHeight: 400,
  },
  voiceCommandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginBottom: 8,
  },
  voiceCommandIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  voiceCommandText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },

  /* Voice Input Section */
  voiceInputSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  voiceInputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  /* Listening Container */
  listeningContainer: {
    alignItems: 'center',
    padding: 20,
  },
  listeningIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  listeningIcon: {
    fontSize: 32,
  },
  listeningText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 15,
    textAlign: 'center',
  },
  stopListeningBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stopListeningBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  manualCommandBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  manualCommandBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  
  /* Not Listening Container */
  notListeningContainer: {
    alignItems: 'center',
    padding: 20,
  },
  notListeningText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  
  /* Command Display */
  commandDisplay: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  commandLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 5,
  },
  commandText: {
    fontSize: 16,
    color: '#3b82f6',
    fontStyle: 'italic',
  },
  availableCommandsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },

  /* thin search bar */
  searchThin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    height: 40,
    borderRadius: 14,
    paddingLeft: 42,
    paddingRight: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    fontSize: 18,
    color: '#e2e8f0',
    zIndex: 1,
  },
  searchInputThin: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },

  /* rest unchanged */
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },

  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#1e293b', 
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  seeAllText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },

  featuresGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'flex-start'
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    alignItems: 'center',
    minHeight: 120,
    ...commonStyles.shadow,
  },
  featureIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  featureIconText: { fontSize: 24 },
  featureCount: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  featureTitle: { fontSize: 14, color: '#64748b', fontWeight: '500' },

  classesContainer: { backgroundColor: 'white', borderRadius: 20, padding: spacing.lg, ...commonStyles.shadow },
  classCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  classTime: { width: 80, alignItems: 'center', marginRight: spacing.md },
  classTimeText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  classDuration: { fontSize: 12, color: '#64748b' },
  classInfo: { flex: 1 },
  classSubject: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  classDetail: { fontSize: 14, color: '#64748b' },
  classStatus: { paddingLeft: spacing.md },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981' },

  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  quickActionIconText: { fontSize: 20 },
  quickActionTitle: { fontSize: 12, color: '#64748b', fontWeight: '500', textAlign: 'center' },

  activityContainer: { backgroundColor: 'white', borderRadius: 20, padding: spacing.lg, ...commonStyles.shadow },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  activityIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  activityIconText: { fontSize: 18 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  activityStudent: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  activityTime: { fontSize: 12, color: '#94a3b8' },

  upcomingCard: { borderRadius: 20, overflow: 'hidden', ...commonStyles.shadow },
  upcomingGradient: { padding: spacing.lg },
  upcomingContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upcomingTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  upcomingTime: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 2 },
  upcomingLocation: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  reminderBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 12 },
  reminderText: { color: 'white', fontSize: 12, fontWeight: '600' },

  /* Special Needs - Guided Lesson */
  guidedCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: spacing.xl,
    ...commonStyles.shadow,
  },
  guidedCardHC: {
    backgroundColor: '#000000',
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  guidedIcon: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  guidedIconHC: {
    color: '#ffffff',
  },
  guidedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  guidedTitleHC: {
    color: '#ffffff',
  },
  guidedText: {
    fontSize: 18,
    color: '#334155',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  guidedTextHC: {
    color: '#e2e8f0',
  },
  guidedControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navBtn: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  navBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  navBtnText: {
    color: 'white',
    fontWeight: '700',
  },
  voiceBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  voiceBtnText: {
    color: 'white',
    fontWeight: '700',
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  emotionBtn: {
    alignItems: 'center',
  },
  emotionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  emotionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
  },

  // Lesson Card Styles
  lessonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    ...commonStyles.shadow,
  },
  lessonHeader: {
    marginBottom: spacing.sm,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  lessonSubject: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  lessonDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Quiz Card Styles
  quizCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    ...commonStyles.shadow,
  },
  quizHeader: {
    marginBottom: spacing.sm,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quizSubject: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  quizHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: colors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quizDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  quizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizFooterLeft: {
    flex: 1,
  },
  quizCompletionDate: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  quizQuestions: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quizStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  quizStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Event Card Styles
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    ...commonStyles.shadow,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  eventEmoji: {
    fontSize: 18,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  eventPriority: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventPriorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  eventLocation: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Upcoming Events Card Styles
  upcomingEventsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: spacing.lg,
    ...commonStyles.shadow,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noEventsIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noEventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noEventsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  eventsList: {
    gap: spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  eventItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  eventItemEmoji: {
    fontSize: 16,
  },
  eventItemInfo: {
    flex: 1,
  },
  eventItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventItemTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  eventItemPriority: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventItemPriorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewAllEvents: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: spacing.sm,
  },
  viewAllEventsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default StudentDashboard;
