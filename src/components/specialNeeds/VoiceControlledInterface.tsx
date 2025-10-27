import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../styles/theme';
import VoiceRecognitionService from '../../services/voiceRecognitionService';

interface VoiceControlledInterfaceProps {
  onVoiceCommand?: (command: any) => void;
  onVoiceInput?: (text: string) => void;
  language?: string;
  enabled?: boolean;
  showVisualFeedback?: boolean;
}

const { width } = Dimensions.get('window');

export const VoiceControlledInterface: React.FC<VoiceControlledInterfaceProps> = ({
  onVoiceCommand,
  onVoiceInput,
  language = 'en-US',
  enabled = true,
  showVisualFeedback = true
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [waveAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isListening && showVisualFeedback) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnimation.stopAnimation();
    waveAnimation.stopAnimation();
    pulseAnimation.setValue(1);
    waveAnimation.setValue(0);
  };

  const startListening = async () => {
    if (!enabled) return;

    try {
      setIsListening(true);
      setIsProcessing(false);

      const result = await VoiceRecognitionService.startListening(language);
      
      if (!result.success) {
        Alert.alert('Voice Recognition Error', result.error);
        setIsListening(false);
        return;
      }

      // For demo purposes, simulate voice input after 3 seconds
      setTimeout(() => {
        simulateVoiceInput();
      }, 3000);

    } catch (error) {
      console.error('Start listening error:', error);
      Alert.alert('Error', 'Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      const result = await VoiceRecognitionService.stopListening();
      setIsListening(false);
      setIsProcessing(true);

      if (result.success) {
        // Process the voice input
        await processVoiceInput();
      }
    } catch (error) {
      console.error('Stop listening error:', error);
      setIsListening(false);
    }
  };

  const simulateVoiceInput = async () => {
    // Simulate different voice commands for demo
    const commands = [
      'Go to lessons',
      'Answer A',
      'Yes',
      'Help',
      'Repeat',
      'Choose option B'
    ];
    
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    setLastCommand(randomCommand);
    
    // Process after a short delay
    setTimeout(() => {
      processVoiceInput(randomCommand);
    }, 1000);
  };

  const processVoiceInput = async (simulatedInput = null) => {
    try {
      const input = simulatedInput || 'Go to home'; // Default for demo
      
      // Process the voice command
      const command = VoiceRecognitionService.processVoiceCommand(input);
      
      // Provide audio feedback
      if (command.type === 'navigation') {
        await VoiceRecognitionService.provideAudioFeedback('completed', 'Navigating...');
      } else if (command.type === 'quiz_answer') {
        await VoiceRecognitionService.provideAudioFeedback('correct', 'Answer recorded!');
      }

      // Call the callback functions
      if (onVoiceCommand) {
        onVoiceCommand(command);
      }
      
      if (onVoiceInput) {
        onVoiceInput(input);
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Process voice input error:', error);
      setIsProcessing(false);
    }
  };

  const renderListeningIndicator = () => {
    if (!isListening && !isProcessing) return null;

    return (
      <View style={styles.listeningContainer}>
        <Animated.View 
          style={[
            styles.listeningIndicator,
            {
              transform: [{ scale: pulseAnimation }],
              opacity: waveAnimation
            }
          ]}
        >
          <Text style={styles.listeningIcon}>🎤</Text>
        </Animated.View>
        
        {isListening && (
          <View style={styles.waveContainer}>
            {[...Array(5)].map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.wave,
                  {
                    opacity: waveAnimation,
                    transform: [{
                      scaleY: waveAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1.5]
                      })
                    }]
                  }
                ]}
              />
            ))}
          </View>
        )}
        
        <Text style={styles.listeningText}>
          {isListening ? 'Listening...' : 'Processing...'}
        </Text>
        
        {lastCommand && (
          <Text style={styles.commandText}>
            "{lastCommand}"
          </Text>
        )}
      </View>
    );
  };

  const renderVoiceButton = () => {
    if (isListening) {
      return (
        <TouchableOpacity style={styles.stopButton} onPress={stopListening}>
          <LinearGradient
            colors={[colors.error, colors.error + 'CC']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonIcon}>⏹️</Text>
            <Text style={styles.buttonText}>Stop</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.voiceButton, !enabled && styles.disabledButton]} 
        onPress={startListening}
        disabled={!enabled}
      >
        <LinearGradient
          colors={enabled ? [colors.primary, colors.primary + 'CC'] : [colors.textSecondary, colors.textSecondary + 'CC']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.buttonIcon}>🎤</Text>
          <Text style={styles.buttonText}>Voice Control</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderVoiceCommands = () => {
    const commands = [
      { icon: '🏠', text: 'Go to home', example: 'Go to home' },
      { icon: '📚', text: 'Open lessons', example: 'Go to lessons' },
      { icon: '🧠', text: 'Answer quiz', example: 'Answer A' },
      { icon: '✅', text: 'Confirm', example: 'Yes' },
      { icon: '❌', text: 'Cancel', example: 'No' },
      { icon: '🔄', text: 'Repeat', example: 'Repeat' },
      { icon: '❓', text: 'Help', example: 'Help' }
    ];

    return (
      <View style={styles.commandsContainer}>
        <Text style={styles.commandsTitle}>Voice Commands</Text>
        <View style={styles.commandsGrid}>
          {commands.map((command, index) => (
            <View key={index} style={styles.commandItem}>
              <Text style={styles.commandIcon}>{command.icon}</Text>
              <Text style={styles.commandLabel}>{command.text}</Text>
              <Text style={styles.commandExample}>"{command.example}"</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderListeningIndicator()}
      
      <View style={styles.buttonContainer}>
        {renderVoiceButton()}
      </View>
      
      {renderVoiceCommands()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  
  // Listening Indicator
  listeningContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  listeningIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listeningIcon: {
    fontSize: 32,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  wave: {
    width: 4,
    height: 20,
    backgroundColor: colors.primary,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  listeningText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  commandText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Button
  buttonContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  voiceButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stopButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  buttonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.surface,
  },
  
  // Commands
  commandsContainer: {
    flex: 1,
  },
  commandsTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  commandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  commandItem: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  commandIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  commandLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  commandExample: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VoiceControlledInterface;
