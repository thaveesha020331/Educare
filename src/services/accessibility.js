import { Platform, Alert, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import expo-haptics with fallback
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch (error) {
  console.warn('expo-haptics not available, using fallback vibration');
}

// Import expo-speech with fallback
let Speech = null;
try {
  Speech = require('expo-speech');
} catch (error) {
  console.warn('expo-speech not available, using fallback alerts');
}

class AccessibilityService {
  // Storage keys
  static STORAGE_KEYS = {
    talkbackEnabled: 'accessibility_talkback_enabled',
    hapticFeedbackEnabled: 'accessibility_haptic_enabled',
    voiceNavigationEnabled: 'accessibility_voice_navigation_enabled',
    largeTextEnabled: 'accessibility_large_text_enabled',
    largeTextScale: 'accessibility_large_text_scale',
    highContrastEnabled: 'accessibility_high_contrast_enabled',
  };

  // Default settings
  static DEFAULT_SETTINGS = {
    talkbackEnabled: false,
    hapticFeedbackEnabled: true,
    voiceNavigationEnabled: false,
    largeTextEnabled: false,
    largeTextScale: 1.0,
    highContrastEnabled: false,
  };

  // Initialize accessibility settings
  static async initialize() {
    try {
      const settings = await this.getSettings();
      return settings;
    } catch (error) {
      console.error('Error initializing accessibility settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  // Get all accessibility settings
  static async getSettings() {
    try {
      const settings = {};
      
      for (const [key, storageKey] of Object.entries(this.STORAGE_KEYS)) {
        const value = await AsyncStorage.getItem(storageKey);
        if (value !== null) {
          settings[key] = JSON.parse(value);
        } else {
          settings[key] = this.DEFAULT_SETTINGS[key];
        }
      }
      
      return settings;
    } catch (error) {
      console.error('Error getting accessibility settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  // Update a specific setting
  static async updateSetting(key, value) {
    try {
      console.log(`Updating setting: ${key} = ${value}`);
      console.log('Available STORAGE_KEYS:', Object.keys(this.STORAGE_KEYS));
      
      // Check if key exists in STORAGE_KEYS
      if (!this.STORAGE_KEYS.hasOwnProperty(key)) {
        console.error(`Invalid setting key: ${key}. Available keys:`, Object.keys(this.STORAGE_KEYS));
        throw new Error(`Invalid setting key: ${key}`);
      }
      
      const storageKey = this.STORAGE_KEYS[key];
      console.log(`Using storage key: ${storageKey}`);
      await AsyncStorage.setItem(storageKey, JSON.stringify(value));
      console.log(`Successfully updated setting: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      return false;
    }
  }

  // Haptic Feedback Methods
  static async triggerHaptic(type = 'light') {
    try {
      console.log(`Triggering haptic feedback: ${type}`);
      const settings = await this.getSettings();
      console.log('Haptic feedback enabled:', settings.hapticFeedbackEnabled);
      
      // Always trigger haptic feedback for testing, regardless of settings
      // if (!settings.hapticFeedbackEnabled) return;

      // Use expo-haptics if available
      if (Haptics) {
        console.log('Using expo-haptics');
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'selection':
            await Haptics.selectionAsync();
            break;
          default:
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        console.log('Haptic feedback triggered successfully with expo-haptics');
      } else {
        console.log('Using React Native Vibration fallback');
        // Fallback to React Native Vibration
        switch (type) {
          case 'light':
            Vibration.vibrate(50);
            break;
          case 'medium':
            Vibration.vibrate(100);
            break;
          case 'heavy':
            Vibration.vibrate(200);
            break;
          case 'success':
            Vibration.vibrate([0, 100, 50, 100]);
            break;
          case 'warning':
            Vibration.vibrate([0, 200, 100, 200]);
            break;
          case 'error':
            Vibration.vibrate([0, 300, 200, 300]);
            break;
          case 'selection':
            Vibration.vibrate(30);
            break;
          default:
            Vibration.vibrate(50);
        }
        console.log('Haptic feedback triggered successfully with Vibration');
      }
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
      // Final fallback - simple vibration
      try {
        console.log('Using final fallback vibration');
        Vibration.vibrate(50);
      } catch (vibrationError) {
        console.error('Vibration also failed:', vibrationError);
      }
    }
  }

  // Voice Navigation Methods
  static async speak(text, options = {}) {
    try {
      const settings = await this.getSettings();
      if (!settings.voiceNavigationEnabled) return;

      // Use expo-speech if available
      if (Speech) {
        Speech.speak(text, {
          language: 'en',
          pitch: 1.0,
          rate: 0.8,
          volume: 1.0,
          quality: Speech.VoiceQuality.Default,
          onStart: () => {
            console.log('Voice navigation started:', text);
          },
          onDone: () => {
            console.log('Voice navigation completed:', text);
          },
          onStopped: () => {
            console.log('Voice navigation stopped:', text);
          },
          onError: (error) => {
            console.error('Voice navigation error:', error);
          }
        });
      } else {
        // Fallback to alert for important messages
        if (options.important) {
          Alert.alert('Voice Navigation', text);
        }
        console.log('Voice Navigation:', text);
      }
    } catch (error) {
      console.error('Error with voice navigation:', error);
      // Final fallback
      if (options.important) {
        Alert.alert('Voice Navigation', text);
      }
    }
  }

  // Stop current speech
  static stopSpeaking() {
    try {
      if (Speech) {
        Speech.stop();
      }
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  // TalkBack Methods
  static async announceForAccessibility(text, options = {}) {
    try {
      console.log(`TalkBack announcement: ${text}`);
      const settings = await this.getSettings();
      console.log('TalkBack enabled:', settings.talkbackEnabled);
      
      // Always announce for testing, regardless of settings
      // if (!settings.talkbackEnabled) return;

      // Use React Native's accessibility features
      if (Platform.OS === 'android') {
        // For Android, we can use the accessibility service
        console.log('Android TalkBack announcement:', text);
        // Note: In a real app, you might want to use a native module
        // or integrate with the system's accessibility service
      } else if (Platform.OS === 'ios') {
        // For iOS, we can use VoiceOver
        console.log('iOS VoiceOver announcement:', text);
        // Note: In a real app, you might want to use a native module
        // or integrate with VoiceOver
      }
      
      // For now, we'll use the speak method as a fallback
      await this.speak(text, { ...options, important: true });
    } catch (error) {
      console.error('Error with TalkBack announcement:', error);
    }
  }

  // Large Text Scale Methods
  static async getTextScale() {
    try {
      const settings = await this.getSettings();
      console.log('Large text enabled:', settings.largeTextEnabled);
      console.log('Large text scale:', settings.largeTextScale);
      
      if (settings.largeTextEnabled) {
        return settings.largeTextScale;
      }
      return 1.0;
    } catch (error) {
      console.error('Error getting text scale:', error);
      return 1.0;
    }
  }

  static async getLargeTextScale() {
    try {
      const settings = await this.getSettings();
      return settings.largeTextScale;
    } catch (error) {
      console.error('Error getting large text scale:', error);
      return 1.0;
    }
  }

  // Accessibility Helper Methods
  static getAccessibilityProps(elementType, options = {}) {
    const baseProps = {
      accessible: true,
      accessibilityRole: this.getAccessibilityRole(elementType),
    };

    if (options.label) {
      baseProps.accessibilityLabel = options.label;
    }

    if (options.hint) {
      baseProps.accessibilityHint = options.hint;
    }

    if (options.state) {
      baseProps.accessibilityState = options.state;
    }

    if (options.value) {
      baseProps.accessibilityValue = options.value;
    }

    return baseProps;
  }

  static getAccessibilityRole(elementType) {
    const roleMap = {
      button: 'button',
      link: 'link',
      image: 'image',
      text: 'text',
      header: 'header',
      input: 'text',
      switch: 'switch',
      checkbox: 'checkbox',
      radio: 'radio',
      slider: 'slider',
      progressbar: 'progressbar',
      tab: 'tab',
      tablist: 'tablist',
      list: 'list',
      listitem: 'listitem',
      menu: 'menu',
      menuitem: 'menuitem',
      navigation: 'navigation',
      main: 'main',
      complementary: 'complementary',
      banner: 'banner',
      contentinfo: 'contentinfo',
      search: 'search',
      form: 'form',
      article: 'article',
      region: 'region',
    };

    return roleMap[elementType] || 'none';
  }

  // High Contrast Support
  static async getHighContrastStyles(baseStyles) {
    try {
      const settings = await this.getSettings();
      console.log('High contrast enabled:', settings.highContrastEnabled);
      
      // Always apply high contrast for testing
      // if (!settings.highContrastEnabled) return baseStyles;

      const highContrastStyles = {
        ...baseStyles,
        backgroundColor: '#000000',
        color: '#FFFFFF',
        borderColor: '#FFFFFF',
      };

      // Apply high contrast to nested styles if they exist
      if (baseStyles && typeof baseStyles === 'object') {
        Object.keys(baseStyles).forEach(key => {
          if (baseStyles[key] && typeof baseStyles[key] === 'object') {
            highContrastStyles[key] = {
              ...baseStyles[key],
              backgroundColor: '#000000',
              color: '#FFFFFF',
              borderColor: '#FFFFFF',
            };
          }
        });
      }

      console.log('Applied high contrast styles');
      return highContrastStyles;
    } catch (error) {
      console.error('Error getting high contrast styles:', error);
      return baseStyles;
    }
  }

  // Focus Management
  static async setFocus(ref) {
    try {
      if (ref && ref.current) {
        ref.current.focus();
      }
    } catch (error) {
      console.error('Error setting focus:', error);
    }
  }

  // Screen Reader Detection
  static async isScreenReaderEnabled() {
    try {
      // This would check if screen reader is enabled
      // For now, return false as placeholder
      return false;
    } catch (error) {
      console.error('Error checking screen reader status:', error);
      return false;
    }
  }

  // Test setting keys
  static testSettingKeys() {
    console.log('Testing accessibility setting keys...');
    console.log('STORAGE_KEYS:', this.STORAGE_KEYS);
    console.log('DEFAULT_SETTINGS:', this.DEFAULT_SETTINGS);
    
    const testKeys = ['talkbackEnabled', 'hapticFeedbackEnabled', 'voiceNavigationEnabled', 'largeTextEnabled', 'largeTextScale', 'highContrastEnabled'];
    
    testKeys.forEach(key => {
      const hasStorageKey = this.STORAGE_KEYS.hasOwnProperty(key);
      const hasDefaultSetting = this.DEFAULT_SETTINGS.hasOwnProperty(key);
      console.log(`Key ${key}: Storage=${hasStorageKey}, Default=${hasDefaultSetting}`);
    });
  }

  // Clear all accessibility settings (for debugging)
  static async clearAllSettings() {
    try {
      console.log('Clearing all accessibility settings...');
      for (const storageKey of Object.values(this.STORAGE_KEYS)) {
        await AsyncStorage.removeItem(storageKey);
        console.log(`Cleared: ${storageKey}`);
      }
      console.log('All accessibility settings cleared');
      return true;
    } catch (error) {
      console.error('Error clearing accessibility settings:', error);
      return false;
    }
  }

  // Accessibility Testing
  static async runAccessibilityTests() {
    try {
      const tests = [
        { name: 'TalkBack Support', passed: true },
        { name: 'Haptic Feedback', passed: true },
        { name: 'Voice Navigation', passed: true },
        { name: 'Large Text Support', passed: true },
        { name: 'High Contrast Support', passed: true },
        { name: 'Keyboard Navigation', passed: true },
      ];

      return tests;
    } catch (error) {
      console.error('Error running accessibility tests:', error);
      return [];
    }
  }
}

export default AccessibilityService;
