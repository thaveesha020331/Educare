import { Alert, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';
import { PermissionsAndroid } from 'react-native';

class RealVoiceRecognition {
  static isListening = false;
  static isInitialized = false;
  static onSpeechResults = null;
  static onSpeechError = null;

  // Request microphone permissions
  static async requestMicrophonePermission() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs microphone access to use voice commands.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Microphone permission is required for voice commands. Please enable it in settings.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
      
      console.log('Microphone permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      Alert.alert('Error', 'Failed to request microphone permission');
      return false;
    }
  }

  // Initialize voice recognition
  static async initialize() {
    try {
      if (this.isInitialized) return { success: true };

      // Request microphone permission
      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        return { success: false, error: 'Microphone permission denied' };
      }

      // Set up voice event handlers
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechRecognized = this.onSpeechRecognized;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechError = this.onSpeechError;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechPartialResults = this.onSpeechPartialResults;

      this.isInitialized = true;
      console.log('Real voice recognition initialized');
      
      return { success: true };
    } catch (error) {
      console.error('Voice recognition initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Start listening for voice input
  static async startListening() {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (this.isListening) {
        return { success: false, error: 'Already listening' };
      }

      // Clear any previous results
      this.lastResult = null;
      
      // Start voice recognition
      await Voice.start('en-US');
      this.isListening = true;

      console.log('Started listening for voice input');
      return { success: true };
    } catch (error) {
      console.error('Start listening error:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop listening
  static async stopListening() {
    try {
      if (!this.isListening) {
        return { success: false, error: 'Not currently listening' };
      }

      await Voice.stop();
      this.isListening = false;

      console.log('Stopped listening');
      return { success: true, transcript: this.lastResult };
    } catch (error) {
      console.error('Stop listening error:', error);
      this.isListening = false;
      return { success: false, error: error.message };
    }
  }

  // Cancel listening
  static async cancelListening() {
    try {
      await Voice.cancel();
      this.isListening = false;
      this.lastResult = null;
      console.log('Voice listening cancelled');
      return { success: true };
    } catch (error) {
      console.error('Cancel listening error:', error);
      return { success: false, error: error.message };
    }
  }

  // Voice event handlers
  static onSpeechStart = (e) => {
    console.log('Speech started:', e);
  };

  static onSpeechRecognized = (e) => {
    console.log('Speech recognized:', e);
  };

  static onSpeechEnd = (e) => {
    console.log('Speech ended:', e);
    this.isListening = false;
  };

  static onSpeechError = (e) => {
    console.error('Speech error:', e);
    this.isListening = false;
  };

  static onSpeechResults = (e) => {
    console.log('Speech results:', e);
    if (e.value && e.value.length > 0) {
      this.lastResult = e.value[0];
      console.log('Recognized text:', this.lastResult);
    }
  };

  static onSpeechPartialResults = (e) => {
    console.log('Partial speech results:', e);
    if (e.value && e.value.length > 0) {
      this.lastResult = e.value[0];
    }
  };

  // Process voice command
  static processVoiceCommand(transcript) {
    const command = transcript.toLowerCase().trim();
    console.log('Processing command:', command);
    
    // Navigation commands
    if (command.includes('go to') || command.includes('navigate to')) {
      const destination = this.extractDestination(command);
      return {
        type: 'navigation',
        action: 'navigate',
        destination: destination
      };
    }

    // Help commands
    if (command.includes('help') || command.includes('assistance')) {
      return {
        type: 'help',
        action: 'show_help'
      };
    }

    // Quiz commands
    if (command.includes('quiz') || command.includes('take quiz')) {
      return {
        type: 'quiz_answer',
        action: 'start_quiz'
      };
    }

    // Repeat commands
    if (command.includes('repeat') || command.includes('again')) {
      return {
        type: 'repeat',
        action: 'repeat_content'
      };
    }

    // Default to text input
    return {
      type: 'text_input',
      action: 'input_text',
      text: transcript
    };
  }

  // Extract destination from navigation command
  static extractDestination(command) {
    const destinations = {
      'home': 'home',
      'dashboard': 'home',
      'calendar': 'calendar',
      'people': 'people',
      'messages': 'messages',
      'settings': 'settings',
      'lessons': 'lessons',
      'progress': 'progress'
    };

    for (const [key, value] of Object.entries(destinations)) {
      if (command.includes(key)) {
        return value;
      }
    }

    return 'home'; // Default destination
  }

  // Check if voice recognition is available
  static async isAvailable() {
    try {
      const hasPermission = await this.requestMicrophonePermission();
      return { available: hasPermission };
    } catch (error) {
      console.error('Check availability error:', error);
      return { available: false, error: error.message };
    }
  }

  // Cleanup
  static destroy() {
    Voice.destroy().then(Voice.removeAllListeners);
    this.isInitialized = false;
    this.isListening = false;
    this.lastResult = null;
  }
}

export default RealVoiceRecognition;
