import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, commonStyles } from '../styles/theme';
import { MessageService } from '../services/messageService';
import { UserService } from '../services/user';
import { useLocale } from '../hooks/useLocale';

const ChatScreen = ({ navigation, userData }) => {
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'community'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const { t } = useLocale();

  useEffect(() => {
    loadUserData();
    loadConversations();
    loadAllUsers();
  }, []);

  const loadUserData = async () => {
    try {
      const { AuthService } = await import('../services/auth');
      const userData = await AuthService.getStoredUserData();
      if (userData && userData._id) {
        setCurrentUserId(userData._id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await MessageService.getConversations();
      if (response && response.conversations) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await UserService.getAllUsers();
      if (response && response.users) {
        // Filter out current user and invalid users
        const validUsers = response.users.filter(user => 
          user._id !== currentUserId && 
          (user.role === 'teacher' || user.role === 'parent' || user.role === 'student')
        );
        setAllUsers(validUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'conversations') {
      await loadConversations();
    } else {
      await loadAllUsers();
    }
    setRefreshing(false);
  };

  const filteredUsers = UserService.searchUsers(allUsers, searchQuery);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'teacher': return '👩‍🏫';
      case 'parent': return '👩';
      case 'student': return '👦';
      default: return '👤';
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => navigation.navigate('ChatConversation', {
        userId: item.otherUser._id,
        userName: item.otherUser.name,
        userRole: item.otherUser.role
      })}
    >
      <Text style={styles.avatar}>{getRoleIcon(item.otherUser.role)}</Text>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.otherUser.name}</Text>
          <Text style={styles.conversationTime}>{formatTime(item.lastMessage?.createdAt || item.updatedAt)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage?.content || 'No messages yet'}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCommunityUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.communityItem}
      onPress={() => navigation.navigate('ChatConversation', {
        userId: item._id,
        userName: item.name,
        userRole: item.role
      })}
    >
      <Text style={styles.avatar}>{getRoleIcon(item.role)}</Text>
      <View style={styles.communityContent}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.communityRole}>{item.role.charAt(0).toUpperCase() + item.role.slice(1)}</Text>
        <Text style={styles.communityEmail}>📧 {item.email}</Text>
      </View>
      <TouchableOpacity style={styles.messageIconButton}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name={activeTab === 'conversations' ? "chatbubbles-outline" : "people-outline"} size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>
        {activeTab === 'conversations' ? 'No conversations yet' : 'No users found'}
      </Text>
      <Text style={styles.emptyStateText}>
        {activeTab === 'conversations' 
          ? 'Start a conversation with someone from the Community tab' 
          : 'Try adjusting your search or refresh the page'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>{t('messages')}</Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === 'conversations' 
                ? `${conversations.length} ${conversations.length === 1 ? 'conversation' : 'conversations'}`
                : `${allUsers.length} ${allUsers.length === 1 ? 'user' : 'users'} in community`
              }
            </Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'conversations' && styles.activeTab]}
            onPress={() => setActiveTab('conversations')}
          >
            <Ionicons 
              name="chatbubbles" 
              size={20} 
              color={activeTab === 'conversations' ? colors.surface : colors.surface + '80'} 
            />
            <Text style={[styles.tabText, activeTab === 'conversations' && styles.activeTabText]}>
              Conversations
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'community' && styles.activeTab]}
            onPress={() => setActiveTab('community')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={activeTab === 'community' ? colors.surface : colors.surface + '80'} 
            />
            <Text style={[styles.tabText, activeTab === 'community' && styles.activeTabText]}>
              Community
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar for Community Tab */}
        {activeTab === 'community' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Loading {activeTab === 'conversations' ? 'conversations' : 'community'}...
            </Text>
          </View>
        ) : (
          <FlatList
            data={activeTab === 'conversations' ? conversations : filteredUsers}
            renderItem={activeTab === 'conversations' ? renderConversation : renderCommunityUser}
            keyExtractor={item => activeTab === 'conversations' ? item.otherUser._id : item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
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
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.surface,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface + '20',
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.surface + '40',
  },
  tabText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.surface + '80',
  },
  activeTabText: {
    color: colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface + '20',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.surface,
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    ...commonStyles.shadow,
  },
  avatar: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  conversationTime: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  lastMessage: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  unreadText: {
    fontSize: typography.caption.fontSize,
    color: colors.surface,
    fontWeight: '700',
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    ...commonStyles.shadow,
  },
  communityContent: {
    flex: 1,
  },
  communityName: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  communityRole: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  communityEmail: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  messageIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
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
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
});

export default ChatScreen;
