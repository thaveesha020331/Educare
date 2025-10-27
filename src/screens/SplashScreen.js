import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors, spacing, typography, dimensions} from '../styles/theme';
import { useLocale } from '../hooks/useLocale';

const SplashScreen = ({navigation}) => {
  const { t } = useLocale();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to health test first, then to onboarding
    const timer = setTimeout(() => {
      navigation.replace('HealthTest');
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>📚</Text>
          </View>
        </View>
        
        <Text style={styles.appName}>EduCare</Text>
        <Text style={styles.tagline}>{t('progressSnapshot')}</Text>
        <Text style={styles.subtitle}>{t('children')} • {t('parents') || 'Parents'} • {t('students') || 'Students'}</Text>
        
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <View style={styles.loadingProgress} />
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.surface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.surface,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  loadingContainer: {
    width: dimensions.width * 0.6,
    marginTop: spacing.xl,
  },
  loadingBar: {
    height: 4,
    backgroundColor: colors.surface,
    opacity: 0.3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 2,
  },
});

export default SplashScreen;