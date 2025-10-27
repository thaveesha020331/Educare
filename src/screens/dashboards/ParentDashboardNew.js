import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, commonStyles } from '../../styles/theme';
import { ParentService } from '../../services/parentService';
import { useLocale } from '../../hooks/useLocale';

const ParentDashboard = ({ navigation, route, userData }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progress, setProgress] = useState([]);
  const [events, setEvents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLocale();

  useEffect(() => {
    loadData();
  }, []);

  // Listen for navigation focus to refresh data when returning from AddStudent screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user data from AsyncStorage
      const { AuthService } = await import('../../services/auth');
      const storedUserData = await AuthService.getStoredUserData();
      const token = await AuthService.getStoredToken();
      
      console.log('🔍 Parent Dashboard - User Data:', storedUserData);
      console.log('🔍 Parent Dashboard - Token available:', !!token);
      
      if (storedUserData && token) {
        // Load all students for this parent
        try {
          console.log('🔍 Attempting to get students for parent...');
          const studentsRes = await ParentService.getAllStudents();
          console.log('🔍 Students Response:', studentsRes);
          
          if (studentsRes && studentsRes.students && studentsRes.students.length > 0) {
            // Parent has students - set them and select the first one by default
            console.log('🔍 Students found:', studentsRes.students.length);
            setStudents(studentsRes.students);
            
            // Select the first student by default
            const firstStudent = studentsRes.students && studentsRes.students.length > 0 ? studentsRes.students[0] : null;
            setSelectedStudent(firstStudent);
            console.log('🔍 Selected student:', firstStudent?.name, firstStudent?.email);
            
            // Load data for the selected student
            if (firstStudent) {
              await loadStudentData(firstStudent);
            }
          } else {
            // No students assigned yet
            console.log('🔍 No students assigned to parent. Response:', studentsRes);
            setStudents([]);
            setSelectedStudent(null);
            setLessons([]);
            setEvents([]);
          }
        } catch (studentError) {
          console.error('❌ Error loading students data:', studentError);
          console.error('❌ Error details:', studentError.message);
          // If there's an error, assume no students are assigned
          setStudents([]);
          setSelectedStudent(null);
          setLessons([]);
          setEvents([]);
        }
        
      } else {
        console.log('🔍 No user data or token available');
        setStudents([]);
        setSelectedStudent(null);
        setLessons([]);
        setEvents([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading parent data:', error);
      Alert.alert('Error', 'Failed to load student data');
      setStudents([]);
      setSelectedStudent(null);
      setLessons([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to load data for a specific student
  const loadStudentData = async (student) => {
    try {
      // Check if student is valid
      if (!student || !student._id) {
        console.log('🔍 No valid student provided to loadStudentData');
        setLessons([]);
        setEvents([]);
        return;
      }

      console.log('🔍 Loading data for student:', student?.name || 'Unknown');
      
      // Load data for the specific selected student
      const [lessonsRes, eventsRes] = await Promise.all([
        ParentService.getStudentLessons(),
        ParentService.getStudentEvents(student?._id),
      ]);
      
      console.log('🔍 Lessons Response:', lessonsRes);
      console.log('🔍 Events Response:', eventsRes);
      
      const loadedLessons = lessonsRes.lessons || [];
      const loadedEvents = eventsRes.events || [];
      
      setLessons(loadedLessons);
      setEvents(loadedEvents);
      
      console.log('🔍 Loaded Lessons:', loadedLessons.length);
      console.log('🔍 Loaded Events:', loadedEvents.length);
    } catch (error) {
      console.error('❌ Error loading student data:', error);
      setLessons([]);
      setEvents([]);
    }
  };

  // Function to remove a student
  const removeStudent = async (studentId, studentName) => {
    try {
      Alert.alert(
        'Remove Student',
        `Are you sure you want to remove ${studentName} from your account?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await ParentService.removeStudent(studentId);
                Alert.alert('Success', 'Student removed successfully');
                
                // Refresh the data
                await loadData();
              } catch (error) {
                console.error('❌ Error removing student:', error);
                Alert.alert('Error', 'Failed to remove student');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error in remove student:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getProgressPercentage = () => {
    if (!progress.length) return 0;
    const completed = progress.filter(p => p.status === 'completed').length;
    return Math.round((completed / progress.length) * 100);
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events.filter(event => new Date(event.date) >= today).slice(0, 3);
  };

  const getRecentLessons = () => {
    return lessons.slice(0, 3);
  };

  // Calculate completed items for points (same as student dashboard)
  const completedLessons = lessons.filter(lesson => lesson.progress?.isCompleted).length;
  const totalCompleted = completedLessons;

  const features = [
    { id: 1, title: 'Lessons', icon: '📚', color: '#3b82f6', count: lessons.length.toString() },
    { id: 2, title: 'Points', icon: '⭐', color: '#f59e0b', count: totalCompleted.toString() },
    { id: 3, title: 'Level', icon: '🏆', color: '#ef4444', count: 'Beginner' },
  ];

  // Today's schedule - use real events from API (same as student dashboard)
  const todaysSchedule = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }).map(event => ({
    id: event._id,
    subject: event.title,
    teacher: 'Teacher',
    room: event.location || 'Classroom',
    time: event.startTime || '10:00 AM',
    duration: '45 min',
    event: event,
  }));

  // Render functions (copied from student dashboard)
  const renderFeature = (feature) => {
    const handlePress = async () => {
      // Haptic feedback
      const { triggerHaptic } = await import('../../services/accessibility');
      await triggerHaptic('light');
      
      // Voice announcement
      const { speak } = await import('expo-speech');
      await speak(`Showing ${feature.title}: ${feature.count}`);
      
      if (feature.title === 'Lessons') {
        // Scroll to lessons section
        Alert.alert('Lessons', `Your student has ${feature.count} lessons assigned`);
      } else if (feature.title === 'Points') {
        // Show detailed breakdown
        Alert.alert(
          'Student Progress', 
          `Completed Activities: ${totalCompleted}\n\nCompleted Lessons: ${completedLessons}\n\nTotal Points: ${totalCompleted}`
        );
      } else if (feature.title === 'Level') {
        Alert.alert('Student Level', `Current Level: ${feature.count}\n\nKeep encouraging your student to complete more activities to level up!`);
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

  const renderLessonCard = (lesson) => {
    const handlePress = async () => {
      Alert.alert('Lesson Details', `Title: ${lesson.title}\nSubject: ${lesson.subject}\nDescription: ${lesson.description || 'No description'}\nStatus: ${lesson.progress?.isCompleted ? 'Completed' : 'Not Completed'}`);
    };

    return (
      <TouchableOpacity 
        key={lesson._id} 
        style={styles.lessonCard}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonTitle}>
            {lesson.title}
          </Text>
          <Text style={styles.lessonSubject}>
            {lesson.subject}
          </Text>
        </View>
        <Text style={styles.lessonDescription} numberOfLines={2}>
          {lesson.description || 'No description available'}
        </Text>
        <View style={styles.lessonFooter}>
          <View style={styles.lessonMeta}>
            <Text style={styles.lessonGrade}>{lesson.grade || 'All Grades'}</Text>
            <Text style={styles.lessonDuration}>{lesson.duration || '30'} min</Text>
          </View>
          {lesson.progress?.isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ Completed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading student data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderNoStudentDashboard = () => (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {/* Welcome Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👋 Welcome to Parent Dashboard</Text>
        <Text style={styles.welcomeText}>
          Monitor your child's learning progress, view their activities, and stay connected with their education journey.
        </Text>
      </View>

      {/* Add Student Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👨‍🎓 Add Your Student</Text>
        <Text style={styles.cardDescription}>
          To get started, you need to add your child's account to monitor their progress and activities.
        </Text>
        
          <TouchableOpacity
          style={styles.addStudentButton}
            onPress={() => navigation.navigate('AddStudent')}
          >
          <Text style={styles.addStudentButtonIcon}>👨‍🎓</Text>
          <Text style={styles.addStudentButtonText}>Add Student</Text>
          </TouchableOpacity>
      </View>

      {/* Features Preview Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 What You Can Monitor</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📚</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Lessons Progress</Text>
              <Text style={styles.featureDescription}>Track completed lessons and learning milestones</Text>
            </View>
          </View>
          
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📅</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Calendar Events</Text>
              <Text style={styles.featureDescription}>Stay updated with school events and deadlines</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💬</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Teacher Communication</Text>
              <Text style={styles.featureDescription}>Message teachers and stay connected</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Help Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>❓ Need Help?</Text>
        <View style={styles.helpItems}>
          <View style={styles.helpItem}>
            <Text style={styles.helpIcon}>🏫</Text>
            <Text style={styles.helpText}>Contact your school administrator to get your child's account details</Text>
          </View>
          <View style={styles.helpItem}>
            <Text style={styles.helpIcon}>📞</Text>
            <Text style={styles.helpText}>Call support for technical assistance</Text>
          </View>
          <View style={styles.helpItem}>
            <Text style={styles.helpIcon}>📧</Text>
            <Text style={styles.helpText}>Email us for account-related questions</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#2563eb']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}
      >
        {/* top row */}
        <View style={styles.headerRow}>
          {/* left: profile */}
          <TouchableOpacity style={styles.avatarBtn}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>P</Text>
          </View>
          </TouchableOpacity>

          {/* center/right: name */}
          <View style={styles.nameBlock}>
            <Text style={styles.userName}>Parent Dashboard</Text>
          </View>

            {/* right: student management + notifications + settings */}
            <View style={styles.topActions}>
          <TouchableOpacity
                onPress={() => navigation.navigate('AddStudent')}
                style={styles.iconBtn}
              >
                <Text style={styles.topIcon}>👨‍🎓</Text>
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
            placeholder="Search events, messages, activities…"
            placeholderTextColor="#cbd5e1"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
      </LinearGradient>

      {!selectedStudent ? renderNoStudentDashboard() : (

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Students Management Card */}
        <View style={styles.card}>
          <View style={styles.studentInfoHeader}>
            <Text style={styles.cardTitle}>👨‍🎓 Students ({students.length})</Text>
            <TouchableOpacity
              style={styles.manageStudentButton}
              onPress={() => navigation.navigate('AddStudent')}
            >
              <Text style={styles.manageStudentButtonText}>Add Student</Text>
            </TouchableOpacity>
          </View>
          
          {students.length > 0 ? (
            <View style={styles.studentsList}>
              {students.filter(student => student && student._id).map((student) => (
                <View key={student?._id} style={[
                  styles.studentItem,
                  selectedStudent?._id === student?._id && styles.selectedStudentItem
                ]}>
                  <TouchableOpacity
                    style={styles.studentInfo}
                    onPress={() => {
                      setSelectedStudent(student);
                      loadStudentData(student);
                    }}
                  >
            <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.studentAvatarText}>
                {student?.name ? student.name.charAt(0).toUpperCase() : 'S'}
              </Text>
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{student?.name || 'Unknown'}</Text>
              <Text style={styles.studentEmail}>{student?.email || 'No email'}</Text>
              <Text style={styles.studentRole}>
                {student?.studentType ? student.studentType.charAt(0).toUpperCase() + student.studentType.slice(1) : 'Student'}
              </Text>
            </View>
                  </TouchableOpacity>
                  
                  {students.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeStudentButton}
                      onPress={() => removeStudent(student?._id, student?.name)}
                    >
                      <Text style={styles.removeStudentButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
          </View>
              ))}
            </View>
          ) : (
            <View style={styles.noStudentsMessage}>
              <Text style={styles.noStudentsText}>No students assigned yet</Text>
              <TouchableOpacity
                style={styles.addFirstStudentButton}
                onPress={() => navigation.navigate('AddStudent')}
              >
                <Text style={styles.addFirstStudentButtonText}>Add Your First Student</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Student Progress Card */}
        {selectedStudent && (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 {selectedStudent.name}'s Progress</Text>
            <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <View style={styles.progressStatIcon}>
                <Text style={styles.progressStatEmoji}>📚</Text>
              </View>
              <View style={styles.progressStatContent}>
                <Text style={styles.progressStatNumber}>{lessons.filter(lesson => lesson.progress?.isCompleted).length}</Text>
                <Text style={styles.progressStatLabel}>Completed Lessons</Text>
              </View>
            </View>

            <View style={styles.progressStatItem}>
              <View style={styles.progressStatIcon}>
                <Text style={styles.progressStatEmoji}>⭐</Text>
              </View>
              <View style={styles.progressStatContent}>
                <Text style={styles.progressStatNumber}>
                  {lessons.filter(lesson => lesson.progress?.isCompleted).length}
                </Text>
                <Text style={styles.progressStatLabel}>Total Completed</Text>
              </View>
            </View>

            <View style={styles.progressStatItem}>
              <View style={styles.progressStatIcon}>
                <Text style={styles.progressStatEmoji}>🎯</Text>
              </View>
              <View style={styles.progressStatContent}>
                <Text style={styles.progressStatNumber}>
                  {lessons.length > 0 ? 
                    Math.round(lessons.reduce((sum, lesson) => sum + (lesson.progress?.score || 0), 0) / lessons.length) : 
                    0}%
                </Text>
                <Text style={styles.progressStatLabel}>Average Score</Text>
              </View>
          </View>
        </View>

          {/* Progress Summary */}
          <View style={styles.progressSummary}>
            <View style={styles.progressSummaryHeader}>
              <Text style={styles.progressSummaryTitle}>📈 Progress Summary</Text>
                </View>
            <View style={styles.progressSummaryContent}>
              <View style={styles.progressSummaryItem}>
                <Text style={styles.progressSummaryLabel}>Total Activities</Text>
                <Text style={styles.progressSummaryValue}>
                  {lessons.length}
                  </Text>
                </View>
              <View style={styles.progressSummaryItem}>
                <Text style={styles.progressSummaryLabel}>Completion Rate</Text>
                <Text style={styles.progressSummaryValue}>
                  {lessons.length > 0 ? 
                    Math.round((lessons.filter(lesson => lesson.progress?.isCompleted).length / 
                     lessons.length) * 100) : 
                    0}%
                </Text>
              </View>
            </View>
          </View>
          </View>
        )}

        {/* Student's Lessons */}
        {lessons.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📚 Student's Lessons</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {lessons.slice(0, 5).map((lesson) => (
                <View key={lesson._id} style={[
                  styles.lessonCard,
                  lesson.progress?.isCompleted && styles.completedCard
                ]}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonSubject}>{lesson.subject}</Text>
                  <Text style={styles.lessonGrade}>{lesson.grade}</Text>
                  <View style={[
                    styles.lessonStatus,
                    lesson.progress?.isCompleted ? styles.completedStatus : styles.pendingStatus
                  ]}>
                    <Text style={[
                      styles.lessonStatusText,
                      lesson.progress?.isCompleted ? styles.completedStatusText : styles.pendingStatusText
                    ]}>
                      {lesson.progress?.isCompleted ? '✅ Completed' : '⏳ Pending'}
                    </Text>
                </View>
                  {lesson.progress?.isCompleted && lesson.progress.completedAt && (
                    <Text style={styles.completionDate}>
                      Completed: {new Date(lesson.progress.completedAt).toLocaleDateString()}
                    </Text>
                  )}
              </View>
            ))}
            </ScrollView>
          </View>
        )}


        {/* Student's Calendar Events Preview */}
        {selectedStudent && events.length > 0 && (
          <View style={styles.card}>
            <View style={styles.eventsHeader}>
              <Text style={styles.cardTitle}>📅 {selectedStudent.name}'s Calendar Events</Text>
              <TouchableOpacity
                style={styles.viewAllEventsButton}
                onPress={() => navigation.navigate('Calendar')}
              >
                <Text style={styles.viewAllEventsButtonText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.eventsPreview}>
              {events.slice(0, 3).map((event) => {
                const eventDate = new Date(event.date);
                const today = new Date();
                const isUpcoming = eventDate >= today;
                const isToday = eventDate.toDateString() === today.toDateString();
                
                return (
                  <View key={event._id} style={[
                    styles.eventPreviewItem,
                    isToday && styles.todayEvent,
                    isUpcoming && !isToday && styles.upcomingEvent
                  ]}>
                    <View style={styles.eventPreviewIcon}>
                      <Text style={styles.eventPreviewIconText}>
                        {isToday ? '🎯' : isUpcoming ? '📅' : '✅'}
                      </Text>
                    </View>
                    <View style={styles.eventPreviewDetails}>
                      <Text style={styles.eventPreviewTitle}>{event.title}</Text>
                      <View style={styles.eventPreviewMeta}>
                        <Text style={[
                          styles.eventPreviewDate,
                          isToday && styles.todayEventText
                        ]}>
                          {isToday ? 'Today' : eventDate.toLocaleDateString()}
                        </Text>
                        <Text style={styles.eventPreviewTime}>
                          {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      {event.location && (
                        <Text style={styles.eventPreviewLocation}>📍 {event.location}</Text>
                      )}
                    </View>
                    <View style={[
                      styles.eventStatusIndicator,
                      isToday && styles.todayIndicator,
                      isUpcoming && !isToday && styles.upcomingIndicator,
                      !isUpcoming && styles.pastIndicator
                    ]} />
                  </View>
                );
              })}
            </View>
            
            {events.length > 3 && (
              <TouchableOpacity
                style={styles.moreEventsButton}
                onPress={() => navigation.navigate('Calendar')}
              >
                <Text style={styles.moreEventsButtonText}>
                  +{events.length - 3} more events
                </Text>
                <Text style={styles.moreEventsArrow}>→</Text>
              </TouchableOpacity>
            )}
            
            {events.length === 0 && selectedStudent && (
              <View style={styles.noEventsMessage}>
                <Text style={styles.noEventsIcon}>📅</Text>
                <Text style={styles.noEventsText}>No calendar events found</Text>
                <Text style={styles.noEventsSubtext}>
                  {selectedStudent.name} hasn't saved any calendar events yet
                </Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginHorizontal: -spacing.lg,
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
  nameBlock: { flex: 1, marginLeft: spacing.sm, marginTop: spacing.lg },
  userName: {
    fontSize: 22, fontWeight: '800', color: 'white',
    marginTop: spacing.sm + -25,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', columnGap: 10 },
  iconBtn: {
    paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)',
    marginLeft: 8,
  },
  topIcon: { color: 'white', fontSize: 18 },
  searchThin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  searchIcon: { color: '#cbd5e1', fontSize: 16, marginRight: spacing.sm },
  searchInputThin: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...commonStyles.shadow,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  studentAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.surface,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  studentRole: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  progressLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  progressStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  actionText: {
    fontSize: typography.caption.fontSize,
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  progressStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  progressStatItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  progressStatEmoji: {
    fontSize: 20,
  },
  progressStatContent: {
    flex: 1,
  },
  progressStatNumber: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  progressStatLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressSummary: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressSummaryHeader: {
    marginBottom: spacing.md,
  },
  progressSummaryTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  progressSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressSummaryLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  progressSummaryValue: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  progressPreviewText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  debugInfo: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  debugText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  eventDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  lessonDetails: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  lessonSubject: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quizIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  quizDetails: {
    flex: 1,
  },
  quizTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  quizSubject: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // No Student Dashboard Styles
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  welcomeText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  welcomeDescription: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  helpItems: {
    gap: spacing.md,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  helpText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    flex: 1,
  },
  placeholderContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  placeholderText: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  placeholderSubtext: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Student Dashboard Styles (copied from StudentDashboard.js)
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
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featureTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  classesContainer: {
    gap: spacing.md,
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...commonStyles.shadow,
  },
  classTime: {
    alignItems: 'center',
    marginRight: spacing.md,
    minWidth: 60,
  },
  classTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  classDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  classDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  classStatus: {
    marginLeft: spacing.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  lessonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lessonGrade: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  lessonDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  completedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  completedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  quizCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...commonStyles.shadow,
  },
  quizHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  quizHeader: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: spacing.xs,
  },
  quizSubject: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  quizContent: {
    marginBottom: spacing.md,
  },
  quizDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quizQuestions: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  quizDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  quizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quizFooterLeft: {
    flex: 1,
  },
  quizStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: spacing.xs,
  },
  quizCompletionDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quizGrade: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  upcomingEventsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    ...commonStyles.shadow,
  },
  noEventsContainer: {
    alignItems: 'center',
    padding: spacing.xl,
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
    paddingVertical: spacing.sm,
  },
  eventItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventItemEmoji: {
    fontSize: 18,
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
  eventItemRight: {
    alignItems: 'flex-end',
  },
  eventItemType: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },

  // New styles for no student dashboard
  welcomeText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  addStudentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  addStudentButtonIcon: {
    fontSize: 20,
  },
  addStudentButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  helpIcon: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  studentInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  manageStudentButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  manageStudentButtonText: {
    color: colors.surface,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  horizontalScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  lessonCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    width: 160,
    minHeight: 140,
    ...commonStyles.shadow,
  },
  quizCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    width: 160,
    minHeight: 140,
    ...commonStyles.shadow,
  },
  completedCard: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  lessonTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quizTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  lessonSubject: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  quizSubject: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  lessonGrade: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  lessonStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  quizStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  completedStatus: {
    backgroundColor: '#dcfce7',
  },
  pendingStatus: {
    backgroundColor: '#fef3c7',
  },
  lessonStatusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  quizStatusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  completedStatusText: {
    color: '#166534',
  },
  pendingStatusText: {
    color: '#92400e',
  },
  quizScore: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quizScoreText: {
    fontSize: typography.caption.fontSize,
    color: colors.text,
    fontWeight: '500',
  },
  quizAttemptsText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  completionDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  eventIconText: {
    fontSize: 20,
  },
  eventDescription: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  eventLocation: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  moreEventsText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  studentsList: {
    marginTop: spacing.md,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    ...commonStyles.shadow,
  },
  selectedStudentItem: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  removeStudentButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  removeStudentButtonText: {
    fontSize: 20,
  },
  noStudentsMessage: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noStudentsText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  addFirstStudentButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  addFirstStudentButtonText: {
    color: colors.surface,
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllEventsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  viewAllEventsButtonText: {
    color: colors.surface,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  eventsPreview: {
    marginBottom: spacing.md,
  },
  eventPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
    ...commonStyles.shadow,
  },
  todayEvent: {
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  upcomingEvent: {
    borderLeftColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  eventPreviewIcon: {
    marginRight: spacing.md,
  },
  eventPreviewIconText: {
    fontSize: 24,
  },
  eventPreviewDetails: {
    flex: 1,
  },
  eventPreviewTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventPreviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventPreviewDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  todayEventText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  eventPreviewTime: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '500',
  },
  eventPreviewLocation: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  eventStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  todayIndicator: {
    backgroundColor: '#f59e0b',
  },
  upcomingIndicator: {
    backgroundColor: '#10b981',
  },
  pastIndicator: {
    backgroundColor: '#6b7280',
  },
  moreEventsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moreEventsButtonText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  moreEventsArrow: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: 'bold',
  },
  noEventsMessage: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noEventsIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noEventsText: {
    fontSize: typography.h4.fontSize,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  noEventsSubtext: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ParentDashboard;
