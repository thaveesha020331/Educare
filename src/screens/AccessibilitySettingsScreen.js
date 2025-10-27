import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import AccessibilityService from '../services/accessibility';

const AccessibilitySettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState(AccessibilityService.DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    // Test the setting keys
    AccessibilityService.testSettingKeys();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const loadedSettings = await AccessibilityService.initialize();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
      Alert.alert('Error', 'Failed to load accessibility settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const success = await AccessibilityService.updateSetting(key, value);
      if (success) {
        setSettings(prev => ({ ...prev, [key]: value }));
        
        // Trigger haptic feedback for setting changes
        await AccessibilityService.triggerHaptic('selection');
        
        // Announce changes for screen readers
        await AccessibilityService.announceForAccessibility(
          `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`
        );
      } else {
        Alert.alert('Error', 'Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleLargeTextScaleChange = async (scale) => {
    await updateSetting('largeTextScale', scale);
  };

  const renderSettingItem = (title, description, key, value, onValueChange, options = {}) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
          {title}
        </Text>
        <Text style={[styles.settingDescription, { fontSize: typography.caption.fontSize * settings.largeTextScale }]}>
          {description}
        </Text>
      </View>
      <View style={styles.settingControl}>
        {options.type === 'switch' ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={value ? colors.white : colors.textSecondary}
            accessibilityLabel={`Toggle ${title}`}
            accessibilityHint={value ? 'Disable' : 'Enable'}
          />
        ) : options.type === 'slider' ? (
          <View style={styles.sliderContainer}>
            {options.values.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sliderOption,
                  value === option.value && styles.sliderOptionSelected
                ]}
                onPress={() => onValueChange(option.value)}
                accessibilityLabel={`${option.label} text size`}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.sliderOptionText,
                  value === option.value && styles.sliderOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: typography.h3.fontSize * settings.largeTextScale }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading accessibility settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: typography.h2.fontSize * settings.largeTextScale }]}>
            Accessibility Settings
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={loadSettings}
              style={styles.refreshButton}
              accessibilityLabel="Refresh settings"
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Visual Accessibility */}
        {renderSection('Visual Accessibility', (
          <>
            {renderSettingItem(
              'Large Text Mode',
              'Increase text size for better readability',
              'largeTextEnabled',
              settings.largeTextEnabled,
              (value) => updateSetting('largeTextEnabled', value),
              { type: 'switch' }
            )}
            
            {settings.largeTextEnabled && renderSettingItem(
              'Text Size',
              'Adjust the scale of text throughout the app',
              'largeTextScale',
              settings.largeTextScale,
              handleLargeTextScaleChange,
              {
                type: 'slider',
                values: [
                  { label: 'Small', value: 1.0 },
                  { label: 'Medium', value: 1.2 },
                  { label: 'Large', value: 1.4 },
                  { label: 'Extra Large', value: 1.6 },
                ]
              }
            )}

            {renderSettingItem(
              'High Contrast Mode',
              'Increase contrast for better visibility',
              'highContrastEnabled',
              settings.highContrastEnabled,
              (value) => updateSetting('highContrastEnabled', value),
              { type: 'switch' }
            )}
          </>
        ))}

        {/* Audio Accessibility */}
        {renderSection('Audio Accessibility', (
          <>
            {renderSettingItem(
              'TalkBack Support',
              'Enable screen reader announcements',
              'talkbackEnabled',
              settings.talkbackEnabled,
              (value) => updateSetting('talkbackEnabled', value),
              { type: 'switch' }
            )}

            {renderSettingItem(
              'Voice Navigation',
              'Enable voice guidance for navigation',
              'voiceNavigationEnabled',
              settings.voiceNavigationEnabled,
              (value) => updateSetting('voiceNavigationEnabled', value),
              { type: 'switch' }
            )}
          </>
        ))}

        {/* Haptic Feedback */}
        {renderSection('Haptic Feedback', (
          <>
            {renderSettingItem(
              'Haptic Feedback',
              'Enable vibration feedback for interactions',
              'hapticFeedbackEnabled',
              settings.hapticFeedbackEnabled,
              (value) => updateSetting('hapticFeedbackEnabled', value),
              { type: 'switch' }
            )}

            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                await AccessibilityService.triggerHaptic('medium');
                await AccessibilityService.speak('Haptic feedback test');
              }}
              accessibilityLabel="Test haptic feedback"
              accessibilityRole="button"
            >
              <Ionicons name="phone-portrait" size={20} color={colors.primary} />
              <Text style={[styles.testButtonText, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
                Test Haptic Feedback
              </Text>
            </TouchableOpacity>
          </>
        ))}

        {/* Voice Testing */}
        {renderSection('Voice Testing', (
          <>
            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                await AccessibilityService.speak('Voice navigation test. This is how the app will sound with voice navigation enabled.');
              }}
              accessibilityLabel="Test voice navigation"
              accessibilityRole="button"
            >
              <Ionicons name="volume-high" size={20} color={colors.primary} />
              <Text style={[styles.testButtonText, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
                Test Voice Navigation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                AccessibilityService.stopSpeaking();
              }}
              accessibilityLabel="Stop voice navigation"
              accessibilityRole="button"
            >
              <Ionicons name="volume-mute" size={20} color={colors.accent} />
              <Text style={[styles.testButtonText, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
                Stop Voice Navigation
              </Text>
            </TouchableOpacity>
          </>
        ))}

        {/* Comprehensive Testing Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: typography.h3.fontSize * settings.largeTextScale }]}>
            Test All Features
          </Text>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              console.log('Testing haptic feedback...');
              await AccessibilityService.triggerHaptic('medium');
              Alert.alert('Test', 'Haptic feedback test completed. Check console for details.');
            }}
            accessibilityLabel="Test haptic feedback"
            accessibilityRole="button"
          >
            <Text style={[styles.testButtonText, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
              Test Haptic Feedback
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              console.log('Testing TalkBack...');
              await AccessibilityService.announceForAccessibility('This is a TalkBack test announcement');
              Alert.alert('Test', 'TalkBack test completed. Check console for details.');
            }}
            accessibilityLabel="Test TalkBack"
            accessibilityRole="button"
          >
            <Text style={[styles.testButtonText, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
              Test TalkBack
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              console.log('Testing large text scaling...');
              const scale = await AccessibilityService.getTextScale();
              Alert.alert('Large Text Test', `Current text scale: ${scale}x. Text should be larger if large text is enabled.`);
            }}
            accessibilityLabel="Test large text"
            accessibilityRole="button"
          >
            <Text style={[styles.testButtonText, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
              Test Large Text (Current: {settings.largeTextScale}x)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              console.log('Testing high contrast...');
              const testStyles = { backgroundColor: 'white', color: 'black' };
              const highContrastStyles = await AccessibilityService.getHighContrastStyles(testStyles);
              console.log('Original styles:', testStyles);
              console.log('High contrast styles:', highContrastStyles);
              Alert.alert('High Contrast Test', 'Check console for style comparison. Background should be black if high contrast is enabled.');
            }}
            accessibilityLabel="Test high contrast"
            accessibilityRole="button"
          >
            <Text style={[styles.testButtonText, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
              Test High Contrast
            </Text>
          </TouchableOpacity>
        </View>

        {/* Debug Section */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: typography.h3.fontSize * settings.largeTextScale }]}>
              Debug (Development Only)
            </Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                await AccessibilityService.clearAllSettings();
                await loadSettings();
                Alert.alert('Debug', 'Settings cleared and reloaded');
              }}
              accessibilityLabel="Clear all settings"
              accessibilityRole="button"
            >
              <Text style={[styles.testButtonText, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
                Clear All Settings
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Accessibility Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { fontSize: typography.h3.fontSize * settings.largeTextScale }]}>
            About Accessibility Features
          </Text>
          <Text style={[styles.infoText, { fontSize: typography.body.fontSize * settings.largeTextScale }]}>
            These accessibility features help make the app more usable for everyone. 
            Enable the features that work best for you and your needs.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  header: {
    paddingTop: spacing.xxl + 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  sliderContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    padding: 2,
  },
  sliderOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm - 2,
  },
  sliderOptionSelected: {
    backgroundColor: colors.primary,
  },
  sliderOptionText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sliderOptionTextSelected: {
    color: 'white',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  testButtonText: {
    fontSize: typography.body.fontSize,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  infoSection: {
    backgroundColor: 'white',
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default AccessibilitySettingsScreen;
