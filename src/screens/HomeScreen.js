import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors, spacing, typography, dimensions, commonStyles} from '../styles/theme';

const HomeScreen = ({navigation}) => {
  const [user] = useState({
    name: 'John Doe',
    email: 'john@example.com',
  });

  const [activeStat, setActiveStat] = useState(0);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => navigation.replace('Auth'),
        },
      ]
    );
  };

  const quickActions = [
    {
      id: 1,
      title: 'Courses',
      icon: '📚',
      color: colors.primary,
      subtitle: 'Continue learning'
    },
    {
      id: 2,
      title: 'Assignments',
      icon: '📝',
      color: colors.secondary,
      subtitle: '3 pending'
    },
    {
      id: 3,
      title: 'Progress',
      icon: '📊',
      color: colors.accent,
      subtitle: 'View stats'
    },
    {
      id: 4,
      title: 'Resources',
      icon: '📖',
      color: colors.success,
      subtitle: 'Study materials'
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'Mathematics Quiz Completed',
      time: '2 minutes ago',
      icon: '✅',
      course: 'Advanced Calculus',
      score: '92%'
    },
    {
      id: 2,
      title: 'New Lecture Available',
      time: '1 hour ago',
      icon: '🎥',
      course: 'Physics 101',
      score: null
    },
    {
      id: 3,
      title: 'Assignment Submitted',
      time: '3 hours ago',
      icon: '📤',
      course: 'Computer Science',
      score: null
    },
  ];

  const learningStats = [
    {
      id: 1,
      value: '24',
      label: 'Learning Hours',
      change: '+12%',
      icon: '⏱️'
    },
    {
      id: 2,
      value: '8',
      label: 'Courses',
      change: '+2',
      icon: '📚'
    },
    {
      id: 3,
      value: '92%',
      label: 'Avg. Score',
      change: '+5%',
      icon: '📊'
    },
  ];

  const renderQuickAction = (action, index) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.quickActionCard]}
      onPress={() => Alert.alert('Action', `${action.title} pressed`)}>
      <LinearGradient
        colors={[action.color + '20', action.color + '10']}
        style={[styles.quickActionGradient, {borderLeftColor: action.color}]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={styles.quickActionHeader}>
          <Text style={styles.quickActionIcon}>{action.icon}</Text>
          <View style={[styles.quickActionBadge, {backgroundColor: action.color}]}>
            <Text style={styles.quickActionBadgeText}>New</Text>
          </View>
        </View>
        <Text style={styles.quickActionTitle}>{action.title}</Text>
        <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderActivity = (activity) => (
    <TouchableOpacity key={activity.id} style={styles.activityItem}>
      <View style={[styles.activityIconContainer, {backgroundColor: colors.primary + '15'}]}>
        <Text style={styles.activityIcon}>{activity.icon}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityCourse}>{activity.course}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
      {activity.score && (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{activity.score}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStatCard = (stat, index) => (
    <TouchableOpacity
      key={stat.id}
      style={[
        styles.statCard,
        activeStat === index && styles.statCardActive
      ]}
      onPress={() => setActiveStat(index)}>
      <Text style={styles.statIcon}>{stat.icon}</Text>
      <Text style={styles.statNumber}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
      <View style={styles.statChange}>
        <Text style={styles.statChangeText}>{stat.change}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark || '#2D5BFF']}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <LinearGradient
            colors={[colors.accent, colors.primary]}
            style={styles.welcomeGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <View style={styles.welcomeContent}>
              <View>
                <Text style={styles.welcomeTitle}>Continue Learning</Text>
                <Text style={styles.welcomeSubtitle}>
                  Advanced Mathematics • 65% completed
                </Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, {width: '65%'}]} />
                </View>
                <Text style={styles.progressText}>65%</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Learning Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Statistics</Text>
          <View style={styles.statsContainer}>
            {learningStats.map(renderStatCard)}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityContainer}>
            {recentActivities.map(renderActivity)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.h3.fontSize,
    fontWeight: 'bold',
    color: colors.surface,
  },
  greeting: {
    fontSize: typography.caption.fontSize,
    color: colors.surface,
    opacity: 0.9,
  },
  userName: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.surface,
    marginTop: spacing.xs,
  },
  logoutButton: {
    padding: spacing.sm,
    backgroundColor: colors.surface + '20',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  welcomeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...commonStyles.shadow,
  },
  welcomeGradient: {
    padding: spacing.xl,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.surface,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    opacity: 0.9,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: colors.surface + '40',
    borderRadius: 3,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.surface,
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.small.fontSize,
    color: colors.surface,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
  },
  seeAllText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (dimensions.width - spacing.xl * 2 - spacing.md) / 2,
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    ...commonStyles.shadow,
  },
  quickActionGradient: {
    padding: spacing.lg,
    borderLeftWidth: 4,
  },
  quickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  quickActionBadgeText: {
    fontSize: 10,
    color: colors.surface,
    fontWeight: 'bold',
  },
  quickActionTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    ...commonStyles.shadow,
  },
  statCardActive: {
    borderColor: colors.primary,
    transform: [{scale: 1.02}],
  },
  statIcon: {
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  statChange: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statChangeText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: 'bold',
  },
  activityContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...commonStyles.shadow,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityIcon: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  activityCourse: {
    fontSize: typography.small.fontSize,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
  },
  scoreBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: typography.small.fontSize,
    color: colors.success,
    fontWeight: 'bold',
  },
});

export default HomeScreen;