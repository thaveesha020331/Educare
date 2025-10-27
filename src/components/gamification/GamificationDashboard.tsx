import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../styles/theme';
import GamificationService from '../../services/gamificationService';

interface GamificationDashboardProps {
  userId: string;
  onBadgeEarned?: (badge: any) => void;
  onLevelUp?: (level: any) => void;
}

interface UserProgress {
  points: number;
  level: any;
  nextLevel: any;
  badges: any[];
  streak: any;
  progressToNextLevel: number;
}

const { width } = Dimensions.get('window');

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userId,
  onBadgeEarned,
  onLevelUp
}) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, [userId]);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      
      // Initialize gamification for user
      await GamificationService.initialize(userId);
      
      // Load user progress
      const progressResult = await GamificationService.getUserProgress(userId);
      if (progressResult.success) {
        setProgress(progressResult.data);
      }
      
      // Load leaderboard
      const leaderboardResult = await GamificationService.getLeaderboard(userId);
      if (leaderboardResult.success) {
        setLeaderboard(leaderboardResult.data);
      }
    } catch (error) {
      console.error('Load gamification data error:', error);
      Alert.alert('Error', 'Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  };

  const renderLevelProgress = () => {
    if (!progress) return null;

    return (
      <View style={styles.levelCard}>
        <LinearGradient
          colors={[progress.level.color, progress.level.color + '80']}
          style={styles.levelGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.levelHeader}>
            <Text style={styles.levelIcon}>{progress.level.icon}</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelName}>{progress.level.name}</Text>
              <Text style={styles.levelNumber}>Level {progress.level.level}</Text>
            </View>
            <Text style={styles.pointsText}>{progress.points} pts</Text>
          </View>
          
          {progress.nextLevel && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${progress.progressToNextLevel * 100}%`,
                      backgroundColor: progress.nextLevel.color
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {progress.nextLevel.pointsRequired - progress.points} pts to {progress.nextLevel.name}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderStreak = () => {
    if (!progress?.streak) return null;

    return (
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakTitle}>Learning Streak</Text>
        </View>
        <Text style={styles.streakCurrent}>{progress.streak.current} days</Text>
        <Text style={styles.streakLongest}>Best: {progress.streak.longest} days</Text>
      </View>
    );
  };

  const renderBadges = () => {
    if (!progress?.badges) return null;

    return (
      <View style={styles.badgesCard}>
        <Text style={styles.sectionTitle}>🏆 Badges Earned</Text>
        <View style={styles.badgesGrid}>
          {progress.badges.map((badge, index) => (
            <View key={index} style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
            </View>
          ))}
        </View>
        {progress.badges.length === 0 && (
          <Text style={styles.noBadgesText}>Complete activities to earn badges!</Text>
        )}
      </View>
    );
  };

  const renderLeaderboard = () => {
    return (
      <View style={styles.leaderboardCard}>
        <Text style={styles.sectionTitle}>🏅 Leaderboard</Text>
        <ScrollView style={styles.leaderboardList} showsVerticalScrollIndicator={false}>
          {leaderboard.map((player, index) => (
            <View key={index} style={[
              styles.leaderboardItem,
              player.name === 'Current User' && styles.currentUserItem
            ]}>
              <View style={styles.rankContainer}>
                <Text style={[
                  styles.rankText,
                  index < 3 && styles.topRankText
                ]}>
                  #{player.rank}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[
                  styles.playerName,
                  player.name === 'Current User' && styles.currentUserName
                ]}>
                  {player.name}
                </Text>
                <Text style={styles.playerLevel}>{player.badge}</Text>
              </View>
              <Text style={styles.playerPoints}>{player.points} pts</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading gamification data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderLevelProgress()}
      
      <View style={styles.statsRow}>
        {renderStreak()}
      </View>
      
      {renderBadges()}
      {renderLeaderboard()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  
  // Level Progress
  levelCard: {
    margin: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelGradient: {
    padding: spacing.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.surface,
  },
  levelNumber: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.surface,
    opacity: 0.8,
  },
  pointsText: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.surface,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface + '40',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.surface,
    marginTop: spacing.xs,
    opacity: 0.8,
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  
  // Streak
  streakCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginRight: spacing.sm,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  streakIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  streakTitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  streakCurrent: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
  },
  streakLongest: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  
  // Badges
  badgesCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: (width - spacing.lg * 2 - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  badgeName: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  badgeDescription: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noBadgesText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Leaderboard
  leaderboardCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leaderboardList: {
    maxHeight: 300,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currentUserItem: {
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  topRankText: {
    color: colors.primary,
  },
  playerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  playerName: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.text,
  },
  currentUserName: {
    color: colors.primary,
    fontWeight: '600',
  },
  playerLevel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  playerPoints: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
});

export default GamificationDashboard;
