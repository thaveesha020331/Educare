import React, { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, dimensions, commonStyles } from '../../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { useLocale } from '../../hooks/useLocale';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import notificationService from '../../services/notifications';

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

interface Message {
  id: string;
  threadId: string;
  sender: 'parent' | 'teacher';
  senderName: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'failed';
  isRead: boolean;
}

interface MessageThread {
  id: string;
  teacherName: string;
  teacherSubject: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

const ParentMessages = () => {
  const navigation = useNavigation();
  const { t } = useLocale();
  const { queue, isOnline } = useOfflineQueue();
  
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(true);

  // Mock data for demonstration
  const mockThreads: MessageThread[] = [
    {
      id: '1',
      teacherName: 'Ms. Sarah Johnson',
      teacherSubject: 'Mathematics',
      lastMessage: 'Emma is doing great in algebra!',
      lastMessageTime: '2 hours ago',
      unreadCount: 1,
      messages: [
        {
          id: '1',
          threadId: '1',
          sender: 'teacher',
          senderName: 'Ms. Sarah Johnson',
          content: 'Hello! I wanted to update you on Emma\'s progress in mathematics.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'sent',
          isRead: true,
        },
        {
          id: '2',
          threadId: '1',
          sender: 'parent',
          senderName: 'You',
          content: 'Thank you for the update! How is she doing with fractions?',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          status: 'sent',
          isRead: true,
        },
        {
          id: '3',
          threadId: '1',
          sender: 'teacher',
          senderName: 'Ms. Sarah Johnson',
          content: 'Emma is doing great in algebra! She\'s really grasped the concepts well.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'sent',
          isRead: false,
        },
      ],
    },
    {
      id: '2',
      teacherName: 'Mr. David Wilson',
      teacherSubject: 'Science',
      lastMessage: 'Science project due next week',
      lastMessageTime: '1 day ago',
      unreadCount: 0,
      messages: [
        {
          id: '4',
          threadId: '2',
          sender: 'teacher',
          senderName: 'Mr. David Wilson',
          content: 'Reminder: The science project on solar system is due next week.',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: 'sent',
          isRead: true,
        },
      ],
    },
  ];

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      // In real app, would load from API and cache
      setThreads(mockThreads);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    const message: Message = {
      id: Date.now().toString(),
      threadId: selectedThread.id,
      sender: 'parent',
      senderName: 'You',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      status: isOnline() ? 'sent' : 'pending',
      isRead: true,
    };

    try {
      if (isOnline()) {
        // Send to API
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            threadId: selectedThread.id,
            content: message.content,
            recipientType: 'teacher',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        // Send notification if enabled
        if (notifyEnabled) {
          await sendNotification(message);
        }
      } else {
        // Queue for offline
        await queue('messages', message);
        message.status = 'pending';
      }

      // Update local state
      const updatedThreads = threads.map(thread => {
        if (thread.id === selectedThread.id) {
          return {
            ...thread,
            messages: [...thread.messages, message],
            lastMessage: message.content,
            lastMessageTime: 'Just now',
          };
        }
        return thread;
      });

      setThreads(updatedThreads);
      setSelectedThread({
        ...selectedThread,
        messages: [...selectedThread.messages, message],
      });
      setNewMessage('');

      Alert.alert(
        t('success'),
        message.status === 'sent' ? t('messageSent') : t('messagePending')
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(t('error'), 'Failed to send message');
    }
  };

  const sendNotification = async (message: Message) => {
    try {
      const result = await notificationService.sendNotificationWithFallback(
        {
          title: t('newMessage'),
          body: message.content,
          data: { threadId: message.threadId },
        },
        '+1234567890' // Would get from user profile
      );

      if (result.success) {
        console.log(`Notification sent via ${result.method}`);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const renderThread = ({ item }: { item: MessageThread }) => (
    <TouchableOpacity
      style={styles.threadItem}
      onPress={() => setSelectedThread(item)}
    >
      <View style={styles.threadAvatar}>
        <Text style={styles.threadAvatarText}>
          {item.teacherName.split(' ').map(n => n[0]).join('')}
        </Text>
      </View>
      
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <Text style={styles.threadName}>{item.teacherName}</Text>
          <Text style={styles.threadTime}>{item.lastMessageTime}</Text>
        </View>
        <Text style={styles.threadSubject}>{item.teacherSubject}</Text>
        <Text style={styles.threadLastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageItem,
      item.sender === 'parent' ? styles.messageFromParent : styles.messageFromTeacher
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'parent' ? styles.parentBubble : styles.teacherBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'parent' ? styles.parentText : styles.teacherText
        ]}>
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            item.sender === 'parent' ? styles.parentTimeText : styles.teacherTimeText
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.sender === 'parent' && (
            <Text style={styles.messageStatus}>
              {item.status === 'sent' ? '✓' : item.status === 'pending' ? '⏳' : '❌'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderThreadList = () => (
    <View style={styles.threadList}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('messages')}</Text>
        <TouchableOpacity onPress={loadMessages}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('noMessages')}</Text>
          </View>
        }
      />
    </View>
  );

  const renderConversation = () => (
    <View style={styles.conversation}>
      <View style={styles.conversationHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedThread(null)}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName}>{selectedThread?.teacherName}</Text>
          <Text style={styles.conversationSubject}>{selectedThread?.teacherSubject}</Text>
        </View>
        <TouchableOpacity
          style={styles.notifyToggle}
          onPress={() => setNotifyEnabled(!notifyEnabled)}
        >
          <Text style={styles.notifyIcon}>{notifyEnabled ? '🔔' : '🔕'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={selectedThread?.messages || []}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.messageComposer}>
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={t('typeMessage')}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.headerBackIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {selectedThread ? selectedThread.teacherName : t('messages')}
            </Text>
            {selectedThread && (
              <Text style={styles.headerSubtitle}>{selectedThread.teacherSubject}</Text>
            )}
          </View>

          <View style={styles.headerActions}>
            {/* Placeholder for additional actions */}
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      {selectedThread ? renderConversation() : renderThreadList()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackIcon: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  headerActions: { width: 40 },

  threadList: { flex: 1, padding: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  refreshText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...commonStyles.shadow,
  },
  threadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  threadAvatarText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  threadContent: { flex: 1 },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  threadName: { fontSize: 16, fontWeight: '600', color: colors.text },
  threadTime: { fontSize: 12, color: colors.textSecondary },
  threadSubject: { fontSize: 14, color: colors.primary, marginBottom: spacing.xs },
  threadLastMessage: { fontSize: 14, color: colors.textSecondary },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  unreadCount: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  conversation: { flex: 1 },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  backIcon: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  conversationInfo: { flex: 1 },
  conversationName: { fontSize: 16, fontWeight: '600', color: colors.text },
  conversationSubject: { fontSize: 14, color: colors.textSecondary },
  notifyToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyIcon: { fontSize: 16 },

  messagesList: { flex: 1, padding: spacing.md },
  messageItem: { marginBottom: spacing.md },
  messageFromParent: { alignItems: 'flex-end' },
  messageFromTeacher: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: spacing.md,
  },
  parentBubble: { backgroundColor: colors.primary },
  teacherBubble: { backgroundColor: colors.surface, ...commonStyles.shadow },
  messageText: { fontSize: 16, lineHeight: 22 },
  parentText: { color: 'white' },
  teacherText: { color: colors.text },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  messageTime: { fontSize: 12 },
  parentTimeText: { color: 'rgba(255,255,255,0.8)' },
  teacherTimeText: { color: colors.textSecondary },
  messageStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginLeft: spacing.xs },

  messageComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: colors.textSecondary },
  sendButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ParentMessages;
