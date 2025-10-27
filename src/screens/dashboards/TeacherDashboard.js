import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors, spacing, typography, dimensions, commonStyles} from '../../styles/theme';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { useLocale } from '../../hooks/useLocale';
import { useAccessibility } from '../../hooks/useAccessibility';
import { ClassroomService } from '../../services/classroom';

const TeacherDashboard = ({navigation, route}) => {
  const [user] = useState({
    name: 'Ms. perera',
    subject: 'Mathematics Teacher',
    school: 'Greenwood International'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [lessonDrafts, setLessonDrafts] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const { getQueue } = useOfflineQueue();

  useEffect(() => {
    loadLessonDrafts();
    loadData();
    loadLessons();
    loadQuizzes();
    loadRegisteredStudents();
  }, []);

  // Filter students when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = registeredStudents.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(registeredStudents);
    }
  }, [searchQuery, registeredStudents]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsResponse, classroomsResponse] = await Promise.all([
        ClassroomService.getStudents(),
        ClassroomService.getClassrooms()
      ]);
      setStudents(studentsResponse.students || []);
      setClassrooms(classroomsResponse.classrooms || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLessonDrafts(), loadData(), loadLessons(), loadQuizzes()]);
    setRefreshing(false);
  };

  const loadLessonDrafts = async () => {
    try {
      const drafts = await getQueue('lessons');
      setLessonDrafts(drafts.slice(-3)); // Show last 3 drafts
    } catch (error) {
      console.error('Failed to load lesson drafts:', error);
    }
  };

  const loadLessons = async () => {
    try {
      // Get auth token from AuthService
      const { AuthService } = await import('../../services/auth');
      const token = await AuthService.getStoredToken();
      
      if (token) {
        const { getLessons } = await import('../../api/lessons');
        const result = await getLessons(token);
        
        if (result.success) {
          setLessons(result.data || []);
        } else {
          console.error('Failed to load lessons:', result.error);
        }
      }
    } catch (error) {
      console.error('Failed to load lessons:', error);
    }
  };

  const loadQuizzes = async () => {
    try {
      // Get auth token from AuthService
      const { AuthService } = await import('../../services/auth');
      const token = await AuthService.getStoredToken();
      
      if (token) {
        const { getQuizzes } = await import('../../api/lessons');
        const result = await getQuizzes(token);
        
        if (result.success) {
          setQuizzes(result.data || []);
        } else {
          console.error('Failed to load quizzes:', result.error);
        }
      }
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    }
  };

  const loadRegisteredStudents = async () => {
    try {
      const { ClassroomService } = await import('../../services/classroom');
      const result = await ClassroomService.getRegisteredStudents();
      
      if (result.students) {
        setRegisteredStudents(result.students);
        setFilteredStudents(result.students);
      } else {
        console.error('Failed to load registered students:', result);
      }
    } catch (error) {
      console.error('Failed to load registered students:', error);
    }
  };

  const { t } = useLocale();
  const { 
    settings: accessibilitySettings, 
    triggerHaptic, 
    speak, 
    announce, 
    getAccessibilityProps,
    getScaledFontSize 
  } = useAccessibility();

  const features = [
    { id: 1, title: 'Lessons', icon: '📚', color: '#3b82f6', count: lessons.length.toString() },
    { id: 2, title: t('children'),     icon: '👨‍🎓', color: '#10b981', count: registeredStudents.length.toString() },
    { id: 3, title: 'Quizzes',  icon: '🧠', color: '#f59e0b', count: quizzes.length.toString()  },
  ];

  const todaysClasses = [
    { id: 1, subject: 'Mathematics',   time: '09:00 AM', class: 'Grade 7A', duration: '45 mins', room: 'Room 301' },
    { id: 2, subject: 'Advanced Math', time: '11:30 AM', class: 'Grade 8B', duration: '60 mins', room: 'Lab 2'    },
    { id: 3, subject: 'Mathematics',   time: '02:00 PM', class: 'Grade 7C', duration: '45 mins', room: 'Room 301' },
  ];

  const recentActivity = [
    { id: 1, title: 'New assignment submitted', student: 'Alex Johnson - Math Homework', time: 'Just now',       type: 'assignment' },
    { id: 2, title: 'Parent meeting scheduled', student: 'Meeting with Mrs. Wilson',    time: '30 mins ago',    type: 'meeting'    },
    { id: 3, title: 'Lesson plan updated',      student: 'Algebra Basics - Grade 7',    time: '2 hours ago',    type: 'lesson'     },
  ];

  const quickActions = [
    { id: 1, title: 'Create Lesson',  icon: '➕', color: '#2563eb', action: () => navigation.navigate('CreateLessonWizard') },
    { id: 2, title: 'Create Quiz',    icon: '🧠', color: '#22c55e', action: () => navigation.navigate('CreateQuizWizard') },
    { id: 3, title: 'Send Message',   icon: '💬', color: '#7c3aed', action: () => {} },
    { id: 4, title: 'View Calendar',  icon: '📅', color: '#dc2626', action: () => {} },
  ];

  const renderFeature = (feature) => {
    const handlePress = async () => {
      await triggerHaptic('medium');
      await speak(`Opening ${feature.title} section`);
      
      if (feature.title === 'Lessons') {
        setShowLessonsModal(true);
      } else if (feature.title === t('children')) {
        setShowStudentsModal(true);
      }
    };

    const accessibilityProps = getAccessibilityProps('button', {
      label: `${feature.title} section with ${feature.count} items`,
      hint: `Double tap to view ${feature.title}`,
      state: { disabled: false }
    });

    return (
      <TouchableOpacity 
        key={feature.id} 
        style={styles.featureCard}
        onPress={handlePress}
        activeOpacity={0.7}
        {...accessibilityProps}
      >
        <View style={[styles.featureIcon, {backgroundColor: feature.color + '20'}]}>
          <Text style={styles.featureIconText}>{feature.icon}</Text>
        </View>
        <Text style={[styles.featureCount, { fontSize: getScaledFontSize(24) }]}>{feature.count}</Text>
        <Text style={[styles.featureTitle, { fontSize: getScaledFontSize(14) }]}>{feature.title}</Text>
      </TouchableOpacity>
    );
  };

  const renderClass = (classItem) => (
    <TouchableOpacity key={classItem.id} style={styles.classCard}>
      <View style={styles.classTime}>
        <Text style={styles.classTimeText}>{classItem.time}</Text>
        <Text style={styles.classDuration}>{classItem.duration}</Text>
      </View>
      <View style={styles.classInfo}>
        <Text style={styles.classSubject}>{classItem.subject}</Text>
        <Text style={styles.classDetail}>{classItem.class} • {classItem.room}</Text>
      </View>
      <View style={styles.classStatus}>
        <View style={styles.statusIndicator} />
      </View>
    </TouchableOpacity>
  );

  const renderActivity = (activity) => (
    <View key={activity.id} style={styles.activityItem}>
      <View style={[
        styles.activityIcon,
        {backgroundColor: activity.type === 'assignment' ? '#10b98120' :
                          activity.type === 'meeting'    ? '#3b82f620' :
                                                           '#f59e0b20'}
      ]}>
        <Text style={styles.activityIconText}>
          {activity.type === 'assignment' ? '📝' :
           activity.type === 'meeting'    ? '👥'  : '📚'}
        </Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityStudent}>{activity.student}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </View>
  );

  const renderQuickAction = (action) => {
    const handlePress = async () => {
      await triggerHaptic('medium');
      await speak(`Opening ${action.title}`);
      action.action();
    };

    const accessibilityProps = getAccessibilityProps('button', {
      label: action.title,
      hint: `Double tap to ${action.title.toLowerCase()}`,
      state: { disabled: false }
    });

    return (
      <TouchableOpacity 
        key={action.id} 
        style={styles.quickAction} 
        onPress={handlePress}
        activeOpacity={0.7}
        {...accessibilityProps}
      >
        <View style={[styles.quickActionIcon, {backgroundColor: action.color + '20'}]}>
          <Text style={styles.quickActionIconText}>{action.icon}</Text>
        </View>
        <Text style={[styles.quickActionTitle, { fontSize: getScaledFontSize(12) }]}>{action.title}</Text>
      </TouchableOpacity>
    );
  };

  const renderLessonDraft = (draft) => (
    <View key={draft.id} style={styles.draftItem}>
      <Text style={styles.draftTitle}>{draft.data.title || 'Untitled Lesson'}</Text>
      <Text style={styles.draftMeta}>{draft.data.subject} • {draft.data.mode}</Text>
      <Text style={styles.draftTime}>{new Date(draft.timestamp).toLocaleDateString()}</Text>
    </View>
  );

  const renderLessonCard = (lesson) => (
    <TouchableOpacity key={lesson._id} style={styles.lessonCard}>
      <View style={styles.lessonHeader}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonSubject}>{lesson.subject}</Text>
      </View>
      <Text style={styles.lessonDescription} numberOfLines={2}>
        {lesson.description || 'No description available'}
      </Text>
      <View style={styles.lessonFooter}>
        <Text style={styles.lessonDate}>
          {new Date(lesson.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.lessonDuration}>
          {lesson.duration || 45} mins
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderStudentCard = (student) => (
    <TouchableOpacity key={student._id} style={styles.studentCard}>
      <View style={styles.studentCardHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {student.name ? student.name[0].toUpperCase() : 'S'}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
        </View>
        <View style={styles.studentStatus}>
          <Text style={styles.studentStatusText}>
            {student.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.studentCardFooter}>
        <Text style={styles.studentJoinDate}>
          Joined: {new Date(student.createdAt).toLocaleDateString()}
        </Text>
        <View style={[
          styles.studentStatusIndicator,
          { backgroundColor: student.isActive ? '#10b981' : '#ef4444' }
        ]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ===== Header now scrolls with content (gradient) ===== */}
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
                <Text style={styles.avatarText}>SJ</Text>
              </View>
            </TouchableOpacity>

            {/* center/right: name */}
            <View style={styles.nameBlock}>
              <Text style={styles.userName}>{user.name}</Text>
            </View>

            {/* right: notifications + settings */}
            <View style={styles.topActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ClassroomManagement')}
                style={styles.iconBtn}
              >
                <Text style={styles.topIcon}>🏫</Text>
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
              placeholder="Search students, lessons, assignments…"
              placeholderTextColor="#cbd5e1"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </LinearGradient>
        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.featuresGrid}>
            {features.map(renderFeature)}
          </View>
        </View>

        {/* Students Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Students ({registeredStudents.length})</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setShowStudentsModal(true)}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading students...</Text>
            </View>
          ) : (
            <View style={styles.studentsContainer}>
              {filteredStudents.slice(0, 5).map((student, index) => (
                <View key={student._id || index} style={styles.studentItem}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {student.name ? student.name[0].toUpperCase() : 'S'}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentDetails}>{student.email}</Text>
                  </View>
                  <View style={[
                    styles.studentStatus,
                    { backgroundColor: student.isActive ? colors.success : colors.warning }
                  ]} />
                </View>
              ))}
              {filteredStudents.length > 5 && (
                <TouchableOpacity 
                  style={styles.moreStudents}
                  onPress={() => setShowStudentsModal(true)}
                >
                  <Text style={styles.moreStudentsText}>
                    +{filteredStudents.length - 5} more students
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('events')}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t('overview')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.classesContainer}>
            {todaysClasses.map(renderClass)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('progress')}</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t('overview')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityContainer}>
            {recentActivity.map(renderActivity)}
          </View>
        </View>

        {/* Lesson Drafts */}
        {lessonDrafts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Drafts</Text>
              <TouchableOpacity onPress={loadLessonDrafts}>
                <Text style={styles.seeAllText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.draftsContainer}>
              {lessonDrafts.map(renderLessonDraft)}
            </View>
          </View>
        )}

        {/* Upcoming Events */}
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
                  <Text style={styles.upcomingTitle}>Staff Meeting</Text>
                  <Text style={styles.upcomingTime}>Tomorrow • 3:00 PM</Text>
                  <Text style={styles.upcomingLocation}>Conference Room A</Text>
                </View>
                <View style={styles.reminderBadge}>
                  <Text style={styles.reminderText}>Reminder</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      {/* Lessons Modal */}
      {showLessonsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Created Lessons</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowLessonsModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {lessons.length > 0 ? (
                lessons.map(renderLessonCard)
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No lessons created yet</Text>
                  <TouchableOpacity 
                    style={styles.createLessonButton}
                    onPress={() => {
                      setShowLessonsModal(false);
                      navigation.navigate('CreateLessonWizard');
                    }}
                  >
                    <Text style={styles.createLessonButtonText}>Create Your First Lesson</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Students Modal */}
      {showStudentsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Students ({filteredStudents.length})</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowStudentsModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search students by name or email..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
            </View>
            <ScrollView style={styles.modalBody}>
              {filteredStudents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No students found</Text>
                </View>
              ) : (
                filteredStudents.map(renderStudentCard)
              )}
            </ScrollView>
          </View>
        </View>
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

  statsSection: { marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: spacing.md },
  seeAllText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: {
    width: (dimensions.width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.md,
    alignItems: 'center',
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

  draftsContainer: { backgroundColor: 'white', borderRadius: 20, padding: spacing.lg, ...commonStyles.shadow },
  draftItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  draftTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  draftMeta: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  draftTime: { fontSize: 12, color: '#94a3b8' },

  // Student styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  studentsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: spacing.lg,
    ...commonStyles.shadow,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  studentAvatarText: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.white,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  studentDetails: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  studentStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreStudents: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  moreStudentsText: {
    fontSize: typography.body.fontSize,
    color: colors.primary,
    fontWeight: typography.body.fontWeight,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addStudentButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginRight: spacing.md,
  },
  addStudentButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.white,
  },

  // Lesson Card Styles
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
  lessonDuration: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    ...commonStyles.shadow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: spacing.lg,
    maxHeight: 400,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  createLessonButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  createLessonButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Student Card Styles
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    ...commonStyles.shadow,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  studentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentJoinDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  studentStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  studentStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  studentStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },

  // Search Container
  searchContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
});

export default TeacherDashboard;
