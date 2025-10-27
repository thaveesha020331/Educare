import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors, spacing, typography, commonStyles} from '../styles/theme';
import { useAccessibility } from '../hooks/useAccessibility';

const NotificationsScreen = ({navigation}) => {
  const { 
    settings: accessibilitySettings, 
    triggerHaptic, 
    speak, 
    getAccessibilityProps,
    getScaledFontSize 
  } = useAccessibility();

  const notifications = [
    { id: 1, type: 'assignment', title: 'Assignment Submitted', message: 'Alex submitted Math Homework', time: '2m ago', icon: '📝', tint: '#60a5fa' },
    { id: 2, type: 'message',    title: 'New Message',          message: 'Mrs. Wilson: Can we meet tomorrow?', time: '1h ago', icon: '💬', tint: '#22c55e' },
    { id: 3, type: 'reminder',   title: 'Staff Meeting',        message: 'Tomorrow • 3:00 PM • Room A', time: 'Yesterday', icon: '⏰', tint: '#f59e0b' },
  ];

  const renderItem = (n) => {
    const handlePress = async () => {
      await triggerHaptic('light');
      await speak(`Notification: ${n.title}. ${n.message}`);
    };

    const accessibilityProps = getAccessibilityProps('button', {
      label: `Notification: ${n.title}. ${n.message}. ${n.time}`,
      hint: 'Double tap to view notification details',
      state: { disabled: false }
    });

    return (
      <TouchableOpacity 
        key={n.id} 
        style={styles.item}
        onPress={handlePress}
        activeOpacity={0.7}
        {...accessibilityProps}
      >
        <View style={[styles.iconWrap, {backgroundColor: n.tint + '22', borderColor: n.tint + '55'}]}>
          <Text style={styles.iconText}>{n.icon}</Text>
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { fontSize: getScaledFontSize(16) }]}>{n.title}</Text>
          <Text style={[styles.itemMessage, { fontSize: getScaledFontSize(14) }]}>{n.message}</Text>
        </View>
        <Text style={[styles.itemTime, { fontSize: getScaledFontSize(12) }]}>{n.time}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={async () => {
              await triggerHaptic('light');
              navigation.goBack();
            }} 
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextBlock}>
            <Text style={[styles.headerTitle, { fontSize: getScaledFontSize(20) }]}>Notifications</Text>
            <Text style={[styles.headerSubtitle, { fontSize: getScaledFontSize(14) }]}>Recent updates and messages</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>{notifications.map(renderItem)}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginHorizontal: -spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface + '20', justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm,
  },
  backIcon: { fontSize: 18, color: colors.surface },
  headerTextBlock: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.surface, marginBottom: 2 },
  headerSubtitle: { fontSize: typography.bodySmall.fontSize, color: colors.surface, opacity: 0.9 },

  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, ...commonStyles.shadow },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, borderWidth: 1 },
  iconText: { fontSize: 18 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text, marginBottom: 2 },
  itemMessage: { fontSize: typography.bodySmall.fontSize, color: colors.textSecondary },
  itemTime: { fontSize: typography.caption.fontSize, color: colors.textLight, marginLeft: spacing.sm },
});

export default NotificationsScreen;


