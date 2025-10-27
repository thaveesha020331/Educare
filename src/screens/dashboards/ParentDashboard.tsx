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
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors, spacing, typography, dimensions, commonStyles} from '../../styles/theme';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { useLocale, SUPPORTED_LANGUAGES } from '../../hooks/useLocale';
// import { WeeklyProgressChart } from '../../components/progress/WeeklyProgressChart';
// import { AttendanceDonut } from '../../components/progress/AttendanceDonut.jsx';
import notificationService from '../../services/notifications';
import { ChildrenService } from '../../services/children';

// Stub AsyncStorage implementation
const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    console.log(`AsyncStorage.getItem: ${key}`);
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    console.log(`AsyncStorage.setItem: ${key} = ${value.substring(0, 100)}...`);
  },
};

interface UserData {
  name?: string;
  role?: string;
  studentType?: string;
}

interface ParentDashboardProps {
  navigation: any;
  userData?: UserData;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({navigation, userData}) => {
  const { t, currentLanguage, changeLanguage } = useLocale();
  const { getQueue } = useOfflineQueue();
  
  const [user] = useState({
    name: userData?.name || 'Mrs. Sarah Smith',
    role: 'Parent',
    children: ['Emma Smith', 'James Smith'],
    phone: '+1234567890',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState(0);
  const [reminders, setReminders] = useState<any[]>([]);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [lastTeacherNote, setLastTeacherNote] = useState('Emma is doing excellent work in mathematics this week!');
  const [currentChild, setCurrentChild] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const childData = {
    name: currentChild ? ChildrenService.getChildDisplayName(currentChild) : user.children[selectedChild],
    grade: currentChild ? ChildrenService.getChildGradeDisplay(currentChild) : 'Grade 5A',
    progress: 85,
    photo: '👧',
    teacher: currentChild ? ChildrenService.getChildTeacherDisplay(currentChild) : 'Ms. Johnson',
  };

  // Mock progress data
  const weeklyProgressData = {
    week: 'Week 12',
    scores: [78, 82, 85, 88, 92],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    average: 85,
  };

  // Mock attendance data
  const attendanceData = {
    present: 18,
    absent: 1,
    late: 1,
    total: 20,
    percentage: 90,
  };

  const features = [
    { id: 1, title: t('children'), icon: '👨‍👩‍👧‍👦', color: '#3b82f6', count: '2' },
    { id: 2, title: t('messages'), icon: '💬', color: '#10b981', count: '5' },
    { id: 3, title: t('events'), icon: '📅', color: '#f59e0b', count: '3' },
    { id: 4, title: t('reports'), icon: '📊', color: '#ef4444', count: '8' },
  ];

  const todaysSchedule = [
    { id: 1, subject: 'Mathematics', time: '09:00 AM', child: 'Emma Smith', duration: '45 mins', room: 'Room 301' },
    { id: 2, subject: 'Art Class', time: '11:30 AM', child: 'James Smith', duration: '60 mins', room: 'Art Studio' },
    { id: 3, subject: 'Science Lab', time: '02:00 PM', child: 'Emma Smith', duration: '90 mins', room: 'Lab 2' },
  ];

  const recentActivity = [
    { id: 1, title: 'Assignment graded', student: 'Emma - Math Homework: A+', time: 'Just now', type: 'grade' },
    { id: 2, title: 'Teacher message received', student: 'From Ms. Johnson about James', time: '30 mins ago', type: 'message' },
    { id: 3, title: 'Event reminder', student: 'Parent-Teacher Conference', time: '2 hours ago', type: 'event' },
  ];

  const quickActions = [
    { id: 1, title: t('messageTeacher'), icon: '💬', color: '#2563eb', action: () => navigation.navigate('ParentMessages') },
    { id: 2, title: t('progress'), icon: '📊', color: '#059669', action: () => {} },
    { id: 3, title: t('events'), icon: '📅', color: '#7c3aed', action: () => {} },
    { id: 4, title: t('reports'), icon: '📋', color: '#dc2626', action: () => {} },
  ];

  useEffect(() => {
    loadReminders();
    initializeNotifications();
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await ChildrenService.getChildren();
      setChildren(response.children || []);
      
      // Load selected child from storage
      const selectedChild = await ChildrenService.getSelectedChild();
      if (selectedChild) {
        setCurrentChild(selectedChild);
      } else if (response.children && response.children.length > 0) {
        // If no selected child, select the first one
        setCurrentChild(response.children[0]);
        await ChildrenService.setSelectedChild(response.children[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    setRefreshing(false);
  };

  const handleChildSelect = async (child: any) => {
    try {
      setCurrentChild(child);
      await ChildrenService.setSelectedChild(child);
    } catch (error) {
      console.error('Error selecting child:', error);
      Alert.alert('Error', 'Failed to select child');
    }
  };

  const loadReminders = async () => {
    try {
      const cachedReminders = await AsyncStorage.getItem('parent:reminders');
      if (cachedReminders) {
        setReminders(JSON.parse(cachedReminders));
      } else {
        // Mock reminders
        const mockReminders = [
          { id: 1, title: 'Parent-Teacher Conference', time: 'Tomorrow 3:00 PM', type: 'meeting' },
          { id: 2, title: 'Science Project Due', time: 'Friday', type: 'assignment' },
          { id: 3, title: 'Field Trip Permission', time: 'Next Week', type: 'permission' },
        ];
        setReminders(mockReminders);
        await AsyncStorage.setItem('parent:reminders', JSON.stringify(mockReminders));
      }
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const initializeNotifications = async () => {
    try {
      await notificationService.registerForPush();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const playVoiceNote = async () => {
    try {
      await notificationService.sendLocalTTS(lastTeacherNote, currentLanguage);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to play voice note');
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode as any);
      setShowLanguageMenu(false);
      Alert.alert(t('success'), 'Language changed successfully');
    } catch (error) {
      Alert.alert(t('error'), 'Failed to change language');
    }
  };

  const renderFeature = (feature: any) => (
    <TouchableOpacity 
      key={feature.id} 
      style={styles.featureCard}
      onPress={() => {
        if (feature.title === t('messages')) {
          navigation.navigate('ParentMessages');
        }
      }}
    >
      <LinearGradient
        colors={[feature.color + '20', feature.color + '10']}
        style={styles.featureIcon}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <Text style={styles.featureIconText}>{feature.icon}</Text>
      </LinearGradient>
      <Text style={styles.featureCount}>{feature.count}</Text>
      <Text style={styles.featureTitle}>{feature.title}</Text>
    </TouchableOpacity>
  );

  const renderScheduleItem = (scheduleItem: any) => (
    <TouchableOpacity key={scheduleItem.id} style={styles.classCard}>
      <View style={styles.classTime}>
        <Text style={styles.classTimeText}>{scheduleItem.time}</Text>
        <Text style={styles.classDuration}>{scheduleItem.duration}</Text>
      </View>
      <View style={styles.classInfo}>
        <Text style={styles.classSubject}>{scheduleItem.subject}</Text>
        <Text style={styles.classDetail}>{scheduleItem.child} • {scheduleItem.room}</Text>
      </View>
      <View style={styles.classStatus}>
        <View style={[styles.statusIndicator, 
          scheduleItem.subject.includes('Art') ? styles.statusArt :
          scheduleItem.subject.includes('Science') ? styles.statusScience :
          styles.statusMath
        ]} />
      </View>
    </TouchableOpacity>
  );

  const renderActivity = (activity: any) => (
    <View key={activity.id} style={styles.activityItem}>
      <View style={[
        styles.activityIcon,
        {backgroundColor: activity.type === 'grade' ? '#10b98120' :
                          activity.type === 'message' ? '#3b82f620' :
                                                        '#f59e0b20'}
      ]}>
        <Text style={styles.activityIconText}>
          {activity.type === 'grade' ? '📊' :
           activity.type === 'message' ? '💬' : '📅'}
        </Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityStudent}>{activity.student}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </View>
  );

  const renderQuickAction = (action: any) => (
    <TouchableOpacity key={action.id} style={styles.quickAction} onPress={action.action}>
      <LinearGradient
        colors={[action.color + '30', action.color + '10']}
        style={styles.quickActionIcon}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <Text style={styles.quickActionIconText}>{action.icon}</Text>
      </LinearGradient>
      <Text style={styles.quickActionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );

  const renderReminder = (reminder: any) => (
    <View key={reminder.id} style={styles.reminderItem}>
      <LinearGradient
        colors={['#f8fafc', '#ffffff']}
        style={styles.reminderIcon}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <Text style={styles.reminderIconText}>
          {reminder.type === 'meeting' ? '👥' : 
           reminder.type === 'assignment' ? '📝' : '📋'}
        </Text>
      </LinearGradient>
      <View style={styles.reminderContent}>
        <Text style={styles.reminderTitle}>{reminder.title}</Text>
        <Text style={styles.reminderTime}>{reminder.time}</Text>
      </View>
    </View>
  );

  const renderLanguageMenu = () => (
    showLanguageMenu && (
      <View style={styles.languageMenu}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageOption,
              currentLanguage === lang.code && styles.languageOptionActive
            ]}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <Text style={styles.languageName}>{lang.nativeName}</Text>
            {currentLanguage === lang.code && (
              <Text style={styles.languageCheck}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    )
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* Fixed Header */}
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#2563eb']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.avatarBtn}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.avatar}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
              >
                <Text style={styles.avatarText}>
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.nameBlock}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>

            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('ChildrenManagement')}
              >
                <Text style={styles.topIcon}>👥</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setShowLanguageMenu(!showLanguageMenu)}
              >
                <Text style={styles.topIcon}>🌐</Text>
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

          <View style={styles.searchThin}>
            <Text style={styles.searchIcon}>🔎</Text>
            <TextInput
              style={styles.searchInputThin}
              placeholder={t('search') || "Search children, messages, events…"}
              placeholderTextColor="#cbd5e1"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        alwaysBounceVertical={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Progress Snapshot */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View>
          <Text style={styles.progressTitle}>{t('progressSnapshot')}</Text>
              <Text style={styles.progressSubtitle}>Track your child's academic journey</Text>
            </View>
            <TouchableOpacity style={styles.voiceButtonContainer} onPress={playVoiceNote}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.voiceIconContainer}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
              >
                <Text style={styles.voiceIcon}>🔊</Text>
              </LinearGradient>
              <Text style={styles.voiceButtonText}>{t('playVoice')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.chartsContainer}>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>📊 Weekly Progress Chart</Text>
              <Text style={styles.chartPlaceholderSubtext}>Average: {weeklyProgressData.average}%</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>🎯 Attendance Chart</Text>
              <Text style={styles.chartPlaceholderSubtext}>{attendanceData.percentage}% Present</Text>
            </View>
          </View>
        </View>

        {/* Language Menu */}
        {renderLanguageMenu()}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{t('overview')}</Text>
          <View style={styles.featuresGrid}>
            {features.map(renderFeature)}
          </View>
        </View>

        {/* Children's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('childSchedule')}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.classesContainer}>
            {todaysSchedule.map(renderScheduleItem)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('upcomingEvents')}</Text>
            <TouchableOpacity onPress={loadReminders}>
            <Text style={styles.seeAllText}>{t('refresh')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.remindersContainer}>
            {reminders.length > 0 ? reminders.map(renderReminder) : (
              <Text style={styles.noReminders}>{t('noReminders')}</Text>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
            <TouchableOpacity>
            <Text style={styles.seeAllText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityContainer}>
            {recentActivity.map(renderActivity)}
          </View>
        </View>

        {/* Child Progress Card */}
        <View style={styles.section}>
          <View style={styles.upcomingCard}>
            <LinearGradient
              colors={['#2563eb', '#3b82f6', '#60a5fa']}
              style={styles.upcomingGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <View style={styles.upcomingContent}>
                <View>
                  <Text style={styles.upcomingTitle}>{childData.name}</Text>
                  <Text style={styles.upcomingTime}>{childData.grade} • {childData.teacher}</Text>
                  <Text style={styles.upcomingLocation}>Overall Progress: {childData.progress}%</Text>
                </View>
                <TouchableOpacity style={styles.reminderBadge}>
                  <Text style={styles.reminderText}>{t('viewDetails')}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },

  /* Fixed Header */
  header: {
    height: 180,
    paddingTop: spacing.xxl + 20, // Extra padding for status bar
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  avatarBtn: { 
    padding: 2 
  },
  avatar: {
    width: 44, 
    height: 44, 
    borderRadius: 22,
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 16 
  },
  nameBlock: { 
    flex: 1, 
    marginLeft: spacing.md 
  },
  greeting: { 
    fontSize: 14, 
    color: '#e2e8f0', 
    marginBottom: 2,
    fontWeight: '500'
  },
  userName: {
    fontSize: 20, 
    fontWeight: '800', 
    color: 'white',
  },
  topActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    columnGap: 8 
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  topIcon: { 
    color: 'white', 
    fontSize: 18, 
  },

  /* Search bar */
  searchThin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    height: 44,
    borderRadius: 16,
    paddingLeft: 44,
    paddingRight: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    fontSize: 18,
    color: '#e2e8f0',
    zIndex: 1,
  },
  searchInputThin: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  /* Content */
  content: { 
    flex: 1, 
    marginTop: 160, // Adjusted for extra header padding
  },
  scrollContent: { 
    paddingHorizontal: spacing.lg, 
    paddingTop: 20, // Reduced padding since header is fixed
    paddingBottom: spacing.xl + 100 // Extra padding to prevent content going under tab bar
  },

  /* Progress Section */
  progressSection: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...commonStyles.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  progressTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: spacing.xs,
  },
  progressSubtitle: {
    fontSize: 15,
    color: '#64748b',
    opacity: 0.9,
  },
  voiceButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceIcon: {
    fontSize: 22,
    color: 'white',
  },
  voiceButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
    textAlign: 'center',
  },
  chartsContainer: {
    gap: spacing.lg,
  },
  chartPlaceholder: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: spacing.xs,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },

  /* Language Menu */
  languageMenu: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: spacing.lg,
    ...commonStyles.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  languageOptionActive: {
    backgroundColor: '#3b82f610',
  },
  languageFlag: { 
    fontSize: 20, 
    marginRight: spacing.md 
  },
  languageName: { 
    flex: 1, 
    fontSize: 16, 
    color: '#0f172a',
    fontWeight: '500'
  },
  languageCheck: { 
    fontSize: 16, 
    color: '#3b82f6', 
    fontWeight: 'bold' 
  },

  /* Sections */
  statsSection: { 
    marginBottom: spacing.xl 
  },
  section: { 
    marginBottom: spacing.xl 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.md 
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#0f172a', 
    marginBottom: spacing.md 
  },
  seeAllText: { 
    color: '#2563eb', 
    fontWeight: '700', 
    fontSize: 14 
  },

  /* Features Grid */
  featuresGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  featureCard: {
    width: (dimensions.width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...commonStyles.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: spacing.md 
  },
  featureIconText: { 
    fontSize: 26 
  },
  featureCount: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#0f172a', 
    marginBottom: 4 
  },
  featureTitle: { 
    fontSize: 14, 
    color: '#64748b', 
    fontWeight: '600' 
  },

  /* Schedule */
  classesContainer: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: spacing.lg, 
    ...commonStyles.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  classCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  classTime: { 
    width: 80, 
    alignItems: 'center', 
    marginRight: spacing.md 
  },
  classTimeText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: 4 
  },
  classDuration: { 
    fontSize: 12, 
    color: '#64748b',
    fontWeight: '500'
  },
  classInfo: { 
    flex: 1 
  },
  classSubject: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: 4 
  },
  classDetail: { 
    fontSize: 14, 
    color: '#64748b' 
  },
  classStatus: { 
    paddingLeft: spacing.md 
  },
  statusIndicator: { 
    width: 12, 
    height: 12, 
    borderRadius: 6 
  },
  statusMath: {
    backgroundColor: '#ef4444'
  },
  statusArt: {
    backgroundColor: '#8b5cf6'
  },
  statusScience: {
    backgroundColor: '#10b981'
  },

  /* Quick Actions */
  quickActionsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  quickAction: { 
    alignItems: 'center', 
    flex: 1 
  },
  quickActionIcon: { 
    width: 60, 
    height: 60, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: spacing.sm 
  },
  quickActionIconText: { 
    fontSize: 22 
  },
  quickActionTitle: { 
    fontSize: 12, 
    color: '#64748b', 
    fontWeight: '600', 
    textAlign: 'center' 
  },

  /* Reminders */
  remindersContainer: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: spacing.lg, 
    ...commonStyles.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  reminderItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  reminderIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  reminderIconText: { 
    fontSize: 20 
  },
  reminderContent: { 
    flex: 1 
  },
  reminderTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: 4 
  },
  reminderTime: { 
    fontSize: 14, 
    color: '#64748b' 
  },
  noReminders: { 
    fontSize: 16, 
    color: '#64748b', 
    textAlign: 'center', 
    padding: spacing.lg,
    fontStyle: 'italic'
  },

  /* Activity */
  activityContainer: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: spacing.lg, 
    ...commonStyles.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  activityItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  activityIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: spacing.md 
  },
  activityIconText: { 
    fontSize: 20 
  },
  activityContent: { 
    flex: 1 
  },
  activityTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: 4 
  },
  activityStudent: { 
    fontSize: 14, 
    color: '#64748b', 
    marginBottom: 4 
  },
  activityTime: { 
    fontSize: 12, 
    color: '#94a3b8',
    fontWeight: '500'
  },

  /* Child Progress Card */
  upcomingCard: { 
    borderRadius: 24, 
    overflow: 'hidden', 
    ...commonStyles.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  upcomingGradient: { 
    padding: spacing.xl 
  },
  upcomingContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  upcomingTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: 'white', 
    marginBottom: 6 
  },
  upcomingTime: { 
    fontSize: 15, 
    color: 'rgba(255,255,255,0.9)', 
    marginBottom: 4,
    fontWeight: '500'
  },
  upcomingLocation: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500'
  },
  reminderBadge: { 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    paddingHorizontal: spacing.lg, 
    paddingVertical: 8, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  reminderText: { 
    color: 'white', 
    fontSize: 13, 
    fontWeight: '700' 
  },
});

export default ParentDashboard;