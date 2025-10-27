import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocale } from '../hooks/useLocale';
import { useAccessibility } from '../hooks/useAccessibility';
import { colors, spacing } from '../styles/theme';

// Screens
import TeacherDashboard from '../screens/dashboards/TeacherDashboard';
import ParentDashboard from '../screens/dashboards/ParentDashboardNew';
import StudentDashboard from '../screens/dashboards/StudentDashboard';
import CalendarScreen from '../screens/CalendarScreen';
import PeopleScreen from '../screens/PeopleScreen';
import MessagesScreen from '../screens/MessagesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const getDashboardComponent = (userData) => {
  switch (userData?.role) {
    case 'teacher': return TeacherDashboard;
    case 'parent':  return ParentDashboard;
    case 'student': return StudentDashboard;
    default:        return TeacherDashboard;
  }
};

/* ---------- Modern Icon Components ---------- */
const HomeIcon = ({ focused }) => (
  <View style={styles.iconContainer}>
    <Text style={[styles.iconText, focused && styles.iconTextActive]}>
      {focused ? '🏡' : '🏠'}
    </Text>
    {focused && <View style={styles.activePulse} />}
  </View>
);

const CalendarIcon = ({ focused }) => (
  <View style={styles.iconContainer}>
    <Text style={[styles.iconText, focused && styles.iconTextActive]}>
      {focused ? '📆' : '📅'}
    </Text>
    {focused && <View style={styles.activePulse} />}
  </View>
);

const PeopleIcon = ({ focused }) => (
  <View style={styles.iconContainer}>
    <Text style={[styles.iconText, focused && styles.iconTextActive]}>
      {focused ? '👨‍👩‍👧‍👦' : '👥'}
    </Text>
    {focused && <View style={styles.activePulse} />}
  </View>
);

const ChatIcon = ({ focused }) => (
  <View style={styles.iconContainer}>
    <Text style={[styles.iconText, focused && styles.iconTextActive]}>
      {focused ? '💭' : '💬'}
    </Text>
    {focused && (
      <View style={styles.messageIndicator}>
        <Text style={styles.messageDot}>•</Text>
      </View>
    )}
  </View>
);

/* ---------- Enhanced Animated Icon Component ---------- */
const CustomTabBarIcon = ({ focused, iconName }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.8,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [focused, scaleAnim, opacityAnim]);

  const renderIcon = () => {
    switch (iconName) {
      case 'home': return <HomeIcon focused={focused} />;
      case 'calendar': return <CalendarIcon focused={focused} />;
      case 'people': return <PeopleIcon focused={focused} />;
      case 'chat': return <ChatIcon focused={focused} />;
      default: return <HomeIcon focused={focused} />;
    }
  };

  return (
    <Animated.View style={[
      styles.tabIconContainer,
      { 
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim
      }
    ]}>
      {focused && (
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.3)', 'rgba(147, 197, 253, 0.1)']}
          style={styles.glowEffect}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <LinearGradient
        colors={focused 
          ? ['#3b82f6', '#2563eb', '#1d4ed8'] 
          : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.tabIconGradient,
          focused && styles.tabIconGradientActive
        ]}
      >
        {renderIcon()}
      </LinearGradient>
    </Animated.View>
  );
};

const MainNavigator = ({ route }) => {
  const { t } = useLocale();
  const { userData } = route.params || {};
  const DashboardComponent = getDashboardComponent(userData);
  const { triggerHaptic, speak, getAccessibilityProps } = useAccessibility();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        
        // Accessibility features for tab navigation
        tabBarAccessibilityLabel: `${route.name} tab`,
        tabBarAccessibilityRole: 'tab',
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={async (e) => {
              await triggerHaptic('light');
              await speak(`Navigating to ${route.name}`);
              props.onPress?.(e);
            }}
            accessibilityLabel={`${route.name} tab`}
            accessibilityRole="tab"
            accessibilityHint={`Double tap to navigate to ${route.name}`}
          />
        ),

        // ---------- Enhanced Glass Bar ----------
        tabBarStyle: [
          styles.tabBarBase,
          {
            backgroundColor: 'transparent',
            borderTopColor: 'transparent',
          },
        ],
        tabBarBackground: () => (
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.98)', 'rgba(30, 58, 138, 0.98)', 'rgba(37, 99, 235, 0.98)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ),

        // Labels
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#c7d2fe',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 4,
          letterSpacing: 0.3,
          textShadowColor: 'rgba(0, 0, 0, 0.3)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
        tabBarIconStyle: { marginTop: 0 },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{
          title: t('home'),
          tabBarIcon: ({ focused }) => <CustomTabBarIcon focused={focused} iconName="home" />,
        }}
      >
        {(props) => <DashboardComponent {...props} route={props.route} userData={userData} />}
      </Tab.Screen>

      <Tab.Screen
        name="Calendar"
        options={{
          title: t('calendar'),
          tabBarIcon: ({ focused }) => <CustomTabBarIcon focused={focused} iconName="calendar" />,
        }}
      >
        {(props) => <CalendarScreen {...props} userData={userData} />}
      </Tab.Screen>

      <Tab.Screen
        name="People"
        options={{
          title: t('community'),
          tabBarIcon: ({ focused }) => <CustomTabBarIcon focused={focused} iconName="people" />,
        }}
      >
        {(props) => <PeopleScreen {...props} userData={userData} navigation={props.navigation} />}
      </Tab.Screen>

      <Tab.Screen
        name="Messages"
        options={{
          title: t('messages'),
          tabBarIcon: ({ focused }) => <CustomTabBarIcon focused={focused} iconName="chat" />,
          tabBarBadge: 3, // Example badge count
        }}
      >
        {(props) => <MessagesScreen {...props} userData={userData} />}
      </Tab.Screen>

      {/* Hidden from bar but still routable */}
      <Tab.Screen
        name="Settings"
        options={{ tabBarButton: () => null }}
      >
        {(props) => <SettingsScreen {...props} userData={userData} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

/* ---------- Enhanced Styles ---------- */
const styles = StyleSheet.create({
  tabBarBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.select({ 
      ios: spacing.xl, 
      android: spacing.lg 
    }),
    borderRadius: 0,
    shadowColor: '#0f172a',
    shadowOpacity: 0.35,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    position: 'relative',
  },

  glowEffect: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    transform: [{ scale: 1.25 }],
  },

  tabIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  tabIconGradientActive: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#60a5fa',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  iconText: {
    fontSize: 22,
    color: '#e0e7ff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  iconTextActive: {
    color: '#ffffff',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  activePulse: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#60a5fa',
    shadowColor: '#60a5fa',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },

  messageIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  messageDot: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    marginTop: -1,
  },
});

export default MainNavigator;