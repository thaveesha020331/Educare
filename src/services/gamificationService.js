import AsyncStorage from '@react-native-async-storage/async-storage';

class GamificationService {
  // Storage keys
  static STORAGE_KEYS = {
    POINTS: 'gamification_points',
    BADGES: 'gamification_badges',
    LEVEL: 'gamification_level',
    STREAK: 'gamification_streak',
    ACHIEVEMENTS: 'gamification_achievements',
    LEADERBOARD: 'gamification_leaderboard'
  };

  // Badge definitions
  static BADGES = {
    FIRST_QUIZ: {
      id: 'first_quiz',
      name: 'First Quiz',
      description: 'Complete your first quiz',
      icon: '🎯',
      points: 50,
      requirement: { type: 'quiz_completed', count: 1 }
    },
    QUIZ_MASTER: {
      id: 'quiz_master',
      name: 'Quiz Master',
      description: 'Complete 10 quizzes',
      icon: '🧠',
      points: 200,
      requirement: { type: 'quiz_completed', count: 10 }
    },
    PERFECT_SCORE: {
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Get 100% on a quiz',
      icon: '⭐',
      points: 100,
      requirement: { type: 'quiz_perfect', count: 1 }
    },
    LESSON_COMPLETER: {
      id: 'lesson_completer',
      name: 'Lesson Completer',
      description: 'Complete 5 lessons',
      icon: '📚',
      points: 150,
      requirement: { type: 'lesson_completed', count: 5 }
    },
    STREAK_MASTER: {
      id: 'streak_master',
      name: 'Streak Master',
      description: 'Maintain a 7-day learning streak',
      icon: '🔥',
      points: 300,
      requirement: { type: 'daily_streak', count: 7 }
    },
    EARLY_BIRD: {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Complete lessons before 9 AM',
      icon: '🐦',
      points: 75,
      requirement: { type: 'early_completion', count: 5 }
    },
    HELPER: {
      id: 'helper',
      name: 'Helper',
      description: 'Help other students',
      icon: '🤝',
      points: 125,
      requirement: { type: 'help_given', count: 3 }
    },
    EXPLORER: {
      id: 'explorer',
      name: 'Explorer',
      description: 'Explore all subject areas',
      icon: '🗺️',
      points: 250,
      requirement: { type: 'subjects_explored', count: 5 }
    }
  };

  // Level definitions
  static LEVELS = [
    { level: 1, name: 'Beginner', pointsRequired: 0, color: '#6B7280', icon: '🌱' },
    { level: 2, name: 'Learner', pointsRequired: 100, color: '#3B82F6', icon: '📖' },
    { level: 3, name: 'Student', pointsRequired: 300, color: '#10B981', icon: '🎓' },
    { level: 4, name: 'Scholar', pointsRequired: 600, color: '#F59E0B', icon: '🏆' },
    { level: 5, name: 'Expert', pointsRequired: 1000, color: '#EF4444', icon: '👑' },
    { level: 6, name: 'Master', pointsRequired: 1500, color: '#8B5CF6', icon: '⭐' },
    { level: 7, name: 'Grandmaster', pointsRequired: 2500, color: '#EC4899', icon: '🌟' }
  ];

  // Initialize gamification data
  static async initialize(userId) {
    try {
      const userKey = `user_${userId}`;
      const points = await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.POINTS}`);
      const badges = await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.BADGES}`);
      const level = await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.LEVEL}`);
      const streak = await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.STREAK}`);

      if (!points) await AsyncStorage.setItem(`${userKey}_${this.STORAGE_KEYS.POINTS}`, '0');
      if (!badges) await AsyncStorage.setItem(`${userKey}_${this.STORAGE_KEYS.BADGES}`, JSON.stringify([]));
      if (!level) await AsyncStorage.setItem(`${userKey}_${this.STORAGE_KEYS.LEVEL}`, '1');
      if (!streak) await AsyncStorage.setItem(`${userKey}_${this.STORAGE_KEYS.STREAK}`, JSON.stringify({
        current: 0,
        longest: 0,
        lastActivity: null
      }));

      return { success: true };
    } catch (error) {
      console.error('Gamification initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Add points to user
  static async addPoints(userId, points, reason = '') {
    try {
      const userKey = `user_${userId}`;
      const currentPoints = parseInt(await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.POINTS}`) || '0');
      const newPoints = currentPoints + points;
      
      await AsyncStorage.setItem(`${userKey}_${this.STORAGE_KEYS.POINTS}`, newPoints.toString());
      
      // Check for level up
      const levelUp = await this.checkLevelUp(userId, newPoints);
      
      // Check for badge achievements
      const newBadges = await this.checkBadgeAchievements(userId, reason);
      
      return {
        success: true,
        points: newPoints,
        pointsAdded: points,
        levelUp: levelUp,
        newBadges: newBadges
      };
    } catch (error) {
      console.error('Add points error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check for level up
  static async checkLevelUp(userId, totalPoints) {
    try {
      const userKey = `user_${userId}`;
      const currentLevel = parseInt(await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.LEVEL}`) || '1');
      
      for (const level of this.LEVELS) {
        if (totalPoints >= level.pointsRequired && level.level > currentLevel) {
          await AsyncStorage.setItem(`${userKey}_${this.STORAGE_KEYS.LEVEL}`, level.level.toString());
          
          return {
            leveledUp: true,
            newLevel: level,
            previousLevel: this.LEVELS[currentLevel - 1] || this.LEVELS[0]
          };
        }
      }
      
      return { leveledUp: false };
    } catch (error) {
      console.error('Level up check error:', error);
      return { leveledUp: false };
    }
  }

  // Check for badge achievements
  static async checkBadgeAchievements(userId, reason = '') {
    try {
      const userKey = `user_${userId}`;
      const currentBadges = JSON.parse(await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.BADGES}`) || '[]');
      const newBadges = [];

      for (const badgeId in this.BADGES) {
        const badge = this.BADGES[badgeId];
        
        // Skip if already earned
        if (currentBadges.includes(badgeId)) continue;
        
        // Check if requirement is met
        if (await this.checkBadgeRequirement(userId, badge.requirement, reason)) {
          currentBadges.push(badgeId);
          newBadges.push(badge);
          
          // Award points for badge
          await this.addPoints(userId, badge.points, `badge_${badgeId}`);
        }
      }

      if (newBadges.length > 0) {
        await AsyncStorage.setItem(`${userKey}_${this.STORAGE_KEYS.BADGES}`, JSON.stringify(currentBadges));
      }

      return newBadges;
    } catch (error) {
      console.error('Badge achievement check error:', error);
      return [];
    }
  }

  // Check if badge requirement is met
  static async checkBadgeRequirement(userId, requirement, reason = '') {
    try {
      const userKey = `user_${userId}`;
      
      switch (requirement.type) {
        case 'quiz_completed':
          const quizCount = await AsyncStorage.getItem(`${userKey}_quiz_count`);
          return parseInt(quizCount || '0') >= requirement.count;
          
        case 'quiz_perfect':
          const perfectCount = await AsyncStorage.getItem(`${userKey}_perfect_count`);
          return parseInt(perfectCount || '0') >= requirement.count;
          
        case 'lesson_completed':
          const lessonCount = await AsyncStorage.getItem(`${userKey}_lesson_count`);
          return parseInt(lessonCount || '0') >= requirement.count;
          
        case 'daily_streak':
          const streakData = JSON.parse(await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.STREAK}`) || '{}');
          return streakData.current >= requirement.count;
          
        case 'early_completion':
          const earlyCount = await AsyncStorage.getItem(`${userKey}_early_count`);
          return parseInt(earlyCount || '0') >= requirement.count;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Badge requirement check error:', error);
      return false;
    }
  }

  // Update learning streak
  static async updateStreak(userId) {
    try {
      const userKey = `user_${userId}`;
      const streakData = JSON.parse(await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.STREAK}`) || '{}');
      const today = new Date().toDateString();
      
      if (streakData.lastActivity === today) {
        return streakData; // Already updated today
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      if (streakData.lastActivity === yesterdayString) {
        // Continue streak
        streakData.current += 1;
      } else {
        // Reset streak
        streakData.current = 1;
      }
      
      streakData.lastActivity = today;
      streakData.longest = Math.max(streakData.longest, streakData.current);
      
      await AsyncStorage.setItem(`${userKey}_${this.STORAGE_KEYS.STREAK}`, JSON.stringify(streakData));
      
      return streakData;
    } catch (error) {
      console.error('Update streak error:', error);
      return { current: 0, longest: 0, lastActivity: null };
    }
  }

  // Get user progress
  static async getUserProgress(userId) {
    try {
      const userKey = `user_${userId}`;
      const points = parseInt(await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.POINTS}`) || '0');
      const level = parseInt(await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.LEVEL}`) || '1');
      const badges = JSON.parse(await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.BADGES}`) || '[]');
      const streak = JSON.parse(await AsyncStorage.getItem(`${userKey}_${this.STORAGE_KEYS.STREAK}`) || '{}');
      
      const currentLevel = this.LEVELS[level - 1] || this.LEVELS[0];
      const nextLevel = this.LEVELS[level] || null;
      
      return {
        success: true,
        data: {
          points,
          level: currentLevel,
          nextLevel,
          badges: badges.map(id => this.BADGES[id]).filter(Boolean),
          streak,
          progressToNextLevel: nextLevel ? (points - currentLevel.pointsRequired) / (nextLevel.pointsRequired - currentLevel.pointsRequired) : 1
        }
      };
    } catch (error) {
      console.error('Get user progress error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get leaderboard
  static async getLeaderboard(userId, limit = 10) {
    try {
      // In a real app, this would fetch from server
      // For now, return mock data
      const leaderboard = [
        { rank: 1, name: 'Alex Johnson', points: 2450, level: 7, badge: 'Grandmaster' },
        { rank: 2, name: 'Sarah Wilson', points: 2100, level: 6, badge: 'Master' },
        { rank: 3, name: 'Mike Chen', points: 1850, level: 6, badge: 'Master' },
        { rank: 4, name: 'Emma Davis', points: 1600, level: 5, badge: 'Expert' },
        { rank: 5, name: 'Current User', points: 1450, level: 5, badge: 'Expert' },
        { rank: 6, name: 'Lisa Brown', points: 1200, level: 4, badge: 'Scholar' },
        { rank: 7, name: 'Tom Anderson', points: 950, level: 4, badge: 'Scholar' },
        { rank: 8, name: 'Anna Taylor', points: 750, level: 3, badge: 'Student' },
        { rank: 9, name: 'John Smith', points: 500, level: 3, badge: 'Student' },
        { rank: 10, name: 'Kate Miller', points: 350, level: 2, badge: 'Learner' }
      ];
      
      return {
        success: true,
        data: leaderboard.slice(0, limit)
      };
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return { success: false, error: error.message };
    }
  }

  // Record activity for gamification
  static async recordActivity(userId, activityType, data = {}) {
    try {
      const userKey = `user_${userId}`;
      
      switch (activityType) {
        case 'quiz_completed':
          const quizCount = parseInt(await AsyncStorage.getItem(`${userKey}_quiz_count`) || '0');
          await AsyncStorage.setItem(`${userKey}_quiz_count`, (quizCount + 1).toString());
          
          if (data.score === 100) {
            const perfectCount = parseInt(await AsyncStorage.getItem(`${userKey}_perfect_count`) || '0');
            await AsyncStorage.setItem(`${userKey}_perfect_count`, (perfectCount + 1).toString());
          }
          
          // Award points based on score
          const quizPoints = Math.round(data.score / 10) * 10; // 10 points per 10% score
          await this.addPoints(userId, quizPoints, 'quiz_completed');
          break;
          
        case 'lesson_completed':
          const lessonCount = parseInt(await AsyncStorage.getItem(`${userKey}_lesson_count`) || '0');
          await AsyncStorage.setItem(`${userKey}_lesson_count`, (lessonCount + 1).toString());
          
          await this.addPoints(userId, 25, 'lesson_completed');
          break;
          
        case 'daily_activity':
          await this.updateStreak(userId);
          await this.addPoints(userId, 5, 'daily_activity');
          break;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Record activity error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default GamificationService;
