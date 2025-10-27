import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Vibration
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { colors, spacing, typography, commonStyles } from '../../styles/theme';
import GeminiChatbotService from '../../services/geminiChatbotService';
import { useLocale } from '../../hooks/useLocale';

const GeminiChatbotInterface = ({ userData, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentSession, setCurrentSession] = useState(null);
  
  const scrollViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { t } = useLocale();

  useEffect(() => {
    initializeChatbot();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const initializeChatbot = async () => {
    try {
      setIsLoading(true);
      const response = await GeminiChatbotService.initializeChatbot(
        userData.role,
        userData.studentType
      );
      
      if (response && response.welcomeMessage) {
        setMessages([{
          id: 'welcome',
          text: response.welcomeMessage,
          isBot: true,
          timestamp: new Date(),
          suggestions: response.features
        }]);
        setCurrentSession(response.sessionId);
        setVoiceEnabled(response.features.voiceEnabled);
        setIsInitialized(true);
        
        // Speak welcome message if voice is enabled
        if (response.features.voiceEnabled) {
          speakMessage(response.welcomeMessage);
        }
      }
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      Alert.alert('Error', 'Failed to initialize chatbot. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText = null) => {
    const text = messageText || inputText.trim();
    if (!text || isLoading) return;

    try {
      setIsLoading(true);
      setInputText('');
      
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        text: text,
        isBot: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to chatbot
      const response = await GeminiChatbotService.sendMessage(text, {
        userRole: userData.role,
        studentType: userData.studentType,
        currentSubject: 'general',
        learningLevel: 'beginner',
        useSimpleLanguage: true,
        includeEmojis: true,
        voiceEnabled: voiceEnabled,
        visualAids: true
      });

      if (response && response.response) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          isBot: true,
          timestamp: new Date(),
          suggestions: response.suggestions || []
        };
        setMessages(prev => [...prev, botMessage]);
        setSuggestions(response.suggestions || []);
        
        // Speak bot response if voice is enabled
        if (voiceEnabled && response.voiceEnabled) {
          speakMessage(response.response);
        }
        
        // Haptic feedback for special needs students
        if (userData.studentType === 'special') {
          Vibration.vibrate(100);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = (text) => {
    if (!voiceEnabled) return;
    
    // Remove emojis for cleaner speech
    const cleanText = text.replace(/[^\w\s.,!?]/g, '');
    
    Speech.speak(cleanText, {
      rate: 0.8, // Slower speech for better understanding
      pitch: 1.0,
      language: 'en-US',
      onDone: () => {
        console.log('Speech completed');
      },
      onError: (error) => {
        console.error('Speech error:', error);
      }
    });
  };

  const handleSuggestionPress = (suggestion) => {
    sendMessage(suggestion);
    setSuggestions([]);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) {
      // Stop any current speech
      Speech.stop();
    }
  };

  const getEncouragement = async () => {
    try {
      const response = await GeminiChatbotService.getEncouragementMessage('general');
      if (response && response.encouragement) {
        const encouragementMessage = {
          id: Date.now().toString(),
          text: response.encouragement,
          isBot: true,
          timestamp: new Date(),
          isEncouragement: true
        };
        setMessages(prev => [...prev, encouragementMessage]);
        
        if (voiceEnabled) {
          speakMessage(response.encouragement);
        }
      }
    } catch (error) {
      console.error('Error getting encouragement:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  useEffect(() => {
    if (isLoading) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isLoading]);

  const renderMessage = (message) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.isBot ? styles.botMessageContainer : styles.userMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        message.isBot ? styles.botMessageBubble : styles.userMessageBubble,
        message.isEncouragement && styles.encouragementBubble
      ]}>
        <Text style={[
          styles.messageText,
          message.isBot ? styles.botMessageText : styles.userMessageText,
          userData.studentType === 'special' && styles.specialNeedsText
        ]}>
          {message.text}
        </Text>
        {message.isBot && voiceEnabled && (
          <TouchableOpacity 
            style={styles.speakButton}
            onPress={() => speakMessage(message.text)}
          >
            <Ionicons name="volume-high" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.messageTime}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0) return null;
    
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>💡 Quick Options:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionButton}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity 
        style={[styles.quickActionButton, voiceEnabled && styles.activeQuickAction]}
        onPress={toggleVoice}
      >
        <Ionicons 
          name={voiceEnabled ? "volume-high" : "volume-mute"} 
          size={20} 
          color={voiceEnabled ? colors.surface : colors.textSecondary} 
        />
        <Text style={[styles.quickActionText, voiceEnabled && styles.activeQuickActionText]}>
          Voice
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={getEncouragement}
      >
        <Ionicons name="heart" size={20} color={colors.surface} />
        <Text style={styles.quickActionText}>Encourage</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={() => sendMessage("Help me with my homework")}
      >
        <Ionicons name="help-circle" size={20} color={colors.surface} />
        <Text style={styles.quickActionText}>Help</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isInitialized && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingBot, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.loadingBotEmoji}>🤖</Text>
        </Animated.View>
        <Text style={styles.loadingText}>Initializing your learning buddy...</Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      {/* Header */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.botAvatar}>
            <Text style={styles.botEmoji}>🤖</Text>
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Learning Buddy</Text>
            <Text style={styles.headerSubtitle}>
              {userData.studentType === 'special' ? 'Your friendly helper' : 'AI Assistant'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={styles.loadingMessageContainer}>
            <Animated.View style={[styles.typingIndicator, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.typingText}>🤖 thinking...</Text>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* Suggestions */}
      {renderSuggestions()}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            userData.studentType === 'special' && styles.specialNeedsInput
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={userData.studentType === 'special' ? "Type your question here..." : "Ask me anything..."}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() && !isLoading ? colors.surface : colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  loadingBot: {
    marginBottom: spacing.lg,
  },
  loadingBotEmoji: {
    fontSize: 64,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: typography.h3.fontSize,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loadingSpinner: {
    marginTop: spacing.md,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  botEmoji: {
    fontSize: 24,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    opacity: 0.9,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  messagesContent: {
    paddingVertical: spacing.lg,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  botMessageBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  encouragementBubble: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  messageText: {
    fontSize: typography.body.fontSize,
    lineHeight: 20,
    flex: 1,
  },
  botMessageText: {
    color: colors.text,
  },
  userMessageText: {
    color: colors.surface,
  },
  specialNeedsText: {
    fontSize: typography.body.fontSize + 2,
    lineHeight: 24,
  },
  speakButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  messageTime: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginHorizontal: spacing.sm,
  },
  loadingMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  typingIndicator: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestionsTitle: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  suggestionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  suggestionText: {
    color: colors.surface,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeQuickAction: {
    backgroundColor: colors.primary,
  },
  quickActionText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  activeQuickActionText: {
    color: colors.surface,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    fontSize: typography.body.fontSize,
    color: colors.text,
    maxHeight: 100,
  },
  specialNeedsInput: {
    fontSize: typography.body.fontSize + 2,
    paddingVertical: spacing.md,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});

export default GeminiChatbotInterface;
