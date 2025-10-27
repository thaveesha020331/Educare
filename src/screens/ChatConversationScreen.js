import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, commonStyles } from '../styles/theme';
import { MessageService } from '../services/messageService';
import { useLocale } from '../hooks/useLocale';

const ChatConversationScreen = ({ route, navigation }) => {
  const { userId, userName, userRole } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const scrollViewRef = useRef(null);
  const { t } = useLocale();

  useEffect(() => {
    loadUserData();
    loadMessages();
    
    // Set up real-time updates (polling every 3 seconds)
    const interval = setInterval(loadMessages, 3000);
    
    return () => clearInterval(interval);
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

  const loadMessages = async () => {
    try {
      const response = await MessageService.getMessages(userId);
      if (response && response.messages) {
        setMessages(response.messages);
        // Mark messages as read
        await MessageService.markMessagesAsRead(userId);
        
        // Scroll to bottom after loading
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      const messageText = newMessage.trim();
      setNewMessage('');

      console.log('ChatConversationScreen.sendMessage called with userId:', userId, 'message:', messageText);
      
      const response = await MessageService.sendMessage(userId, messageText);
      
      console.log('ChatConversationScreen.sendMessage response:', response);
      
      if (response && response.message === 'Message sent successfully') {
        // Reload messages to get the new message
        await loadMessages();
      } else {
        Alert.alert('Error', response?.message || 'Failed to send message');
        setNewMessage(messageText); // Restore the message if sending failed
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
      setNewMessage(newMessage); // Restore the message if sending failed
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = (message) => {
    const isMyMessage = message.senderId === currentUserId;
    
    return (
      <View
        key={message._id}
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'teacher': return '👩‍🏫';
      case 'parent': return '👩';
      case 'student': return '👦';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.surface} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerAvatar}>{getRoleIcon(userRole)}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerRole}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call" size={20} color={colors.surface} />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>Start a conversation</Text>
              <Text style={styles.emptyStateText}>
                Send a message to {userName} to begin your conversation
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="send" size={20} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: 2,
  },
  headerRole: {
    fontSize: typography.caption.fontSize,
    color: colors.surface,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  headerAction: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  messagesContent: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    ...commonStyles.shadow,
  },
  myMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.body.fontSize,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  myMessageText: {
    color: colors.surface,
  },
  otherMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: typography.caption.fontSize,
    opacity: 0.7,
  },
  myMessageTime: {
    color: colors.surface,
  },
  otherMessageTime: {
    color: colors.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
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
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
});

export default ChatConversationScreen;
