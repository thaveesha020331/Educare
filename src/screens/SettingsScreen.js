import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors, spacing, typography, dimensions, commonStyles} from '../styles/theme';
import { useLocale, SUPPORTED_LANGUAGES } from '../hooks/useLocale';
import { useAccessibility } from '../hooks/useAccessibility';

const SettingsScreen = ({navigation, userData}) => {
  const [notifications, setNotifications] = useState(true);
  const [audioGuidance, setAudioGuidance] = useState(false);
  const [largeText, setLargeText] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => navigation.replace('Auth'),
        },
      ]
    );
  };

  const { t, currentLanguage, changeLanguage } = useLocale();
  const { 
    settings: accessibilitySettings, 
    triggerHaptic, 
    speak, 
    announce, 
    getAccessibilityProps,
    getScaledFontSize 
  } = useAccessibility();

  const settingsSections = [
    {
      title: 'Profile',
      items: [
        {
          id: 1,
          title: 'Personal Information',
          subtitle: 'Update your profile details',
          icon: '👤',
          action: () => Alert.alert('Action', 'Edit Profile'),
        },
        {
          id: 2,
          title: 'Change Password',
          subtitle: 'Update your password',
          icon: '🔒',
          action: () => Alert.alert('Action', 'Change Password'),
        },
        {
          id: 3,
          title: 'Accessibility Settings',
          subtitle: 'Customize accessibility features',
          icon: '♿',
          action: () => navigation.navigate('AccessibilitySettings'),
        },
      ],
    },
    {
      title: t('settings'),
      items: [
        {
          id: 3,
          title: 'Audio Guidance',
          subtitle: 'Voice-over for special needs students',
          icon: '🔊',
          type: 'switch',
          value: audioGuidance,
          onValueChange: setAudioGuidance,
        },
        {
          id: 4,
          title: 'Large Text Mode',
          subtitle: 'Increase text size for better readability',
          icon: '🔍',
          type: 'switch',
          value: largeText,
          onValueChange: setLargeText,
        },
      ],
    },
    {
      title: t('language'),
      items: [
        {
          id: 200,
          title: 'App Language',
          subtitle: 'Choose Sinhala, Tamil, or English',
          icon: '🌐',
          action: () => {},
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 5,
          title: 'Push Notifications',
          subtitle: 'Receive notifications for updates',
          icon: '🔔',
          type: 'switch',
          value: notifications,
          onValueChange: setNotifications,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 6,
          title: 'Help & FAQ',
          subtitle: 'Get help and find answers',
          icon: '❓',
          action: () => Alert.alert('Action', 'Help & FAQ'),
        },
        {
          id: 7,
          title: 'Contact Support',
          subtitle: 'Get in touch with our team',
          icon: '📞',
          action: () => Alert.alert('Action', 'Contact Support'),
        },
      ],
    },
  ];

  const renderSettingItem = (item) => {
    const handlePress = async () => {
      await triggerHaptic('light');
      await speak(`Opening ${item.title}`);
      item.action();
    };

    const accessibilityProps = getAccessibilityProps('button', {
      label: `${item.title}. ${item.subtitle}`,
      hint: `Double tap to ${item.title.toLowerCase()}`,
      state: { disabled: false }
    });

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={handlePress}
        activeOpacity={0.7}
        {...accessibilityProps}
      >
        <Text style={styles.settingIcon}>{item.icon}</Text>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { fontSize: getScaledFontSize(16) }]}>{item.title}</Text>
          <Text style={[styles.settingSubtitle, { fontSize: getScaledFontSize(14) }]}>{item.subtitle}</Text>
        </View>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={colors.surface}
            accessibilityLabel={`Toggle ${item.title}`}
            accessibilityHint={item.value ? 'Disable' : 'Enable'}
          />
        ) : (
          <Text style={styles.settingArrow}>›</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (section) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContainer}>
        {section.items.map(renderSettingItem)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <View style={styles.headerRow}>
    
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>{t('settings')}</Text>
            <Text style={styles.headerSubtitle}>{t('overview')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
  
        </View>

        {settingsSections.map(renderSection)}

        {/* Language Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.languageContainer}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  currentLanguage === lang.code && styles.langOptionActive,
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={styles.langName}>{lang.nativeName}</Text>
                {currentLanguage === lang.code && <Text style={styles.langCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface + '20', justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm,
  },
  backIcon: { fontSize: 18, color: colors.surface },
  headerTextBlock: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.surface,
    marginBottom: 1,
    marginTop:spacing.sm +4,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.surface,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2 + 84, // ensure button clears tab bar
  },
  profileCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...commonStyles.shadow,
  },
  profileGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  profileAvatar: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  profileName: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.surface,
    marginBottom: spacing.xs,
  },
  profileRole: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    opacity: 0.9,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    ...commonStyles.shadow,
    
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  settingArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  logoutSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.surface,
  },

  /* Language */
  languageContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    ...commonStyles.shadow,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  langOptionActive: {
    backgroundColor: colors.primary + '10',
  },
  langFlag: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  langName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  langCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '800',
  },
  
});

export default SettingsScreen;
