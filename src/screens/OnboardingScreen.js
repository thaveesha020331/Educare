import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors, spacing, typography, dimensions} from '../styles/theme';
import { useLocale } from '../hooks/useLocale';

const OnboardingScreen = ({navigation}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);
  const { t } = useLocale();

  const onboardingData = [
    {
      id: 1,
      title: t('children'),
      description: t('progressSnapshot'),
      gradient: [colors.teacher, colors.primary],
      icon: '👩‍🏫',
      features: ['Lesson Planning', 'Progress Tracking', 'Parent Communication'],
    },
    {
      id: 2,
      title: t('parents') || 'Parents',
      description: t('connectCommunity'),
      gradient: [colors.parent, colors.secondary],
      icon: '👨‍👩‍👧‍👦',
      features: ['Child Progress', 'Teacher Messages', 'Learning Support'],
    },
    {
      id: 3,
      title: t('students') || 'Students',
      description: t('weeklyProgress'),
      gradient: [colors.student, colors.primaryLight],
      icon: '🎓',
      features: ['Interactive Learning', 'Progress Tracking', 'Achievement Badges'],
    },
  ];

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * dimensions.width,
        animated: true,
      });
    } else {
      navigation.replace('Main', { userData: { role: 'teacher' } });
    }
  };

  const handleSkip = () => {
    navigation.replace('Main', { userData: { role: 'teacher' } });
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / dimensions.width);
    setCurrentPage(pageIndex);
  };

  const renderPage = (item, index) => (
    <View key={item.id} style={styles.pageContainer}>
      <LinearGradient
        colors={item.gradient}
        style={styles.gradientContainer}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{item.icon}</Text>
          </View>
          
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
          
          <View style={styles.featuresContainer}>
            {item.features.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {onboardingData.map((item, index) => renderPage(item, index))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === currentPage ? colors.surface : colors.surface + '40',
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>{t('skip')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={[colors.accent, colors.primary]}
              style={styles.nextButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.nextButtonText}>
                {currentPage === onboardingData.length - 1 ? t('getStarted') : t('next')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContainer: {
    width: dimensions.width,
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.surface,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: typography.body.lineHeight,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  featuresContainer: {
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.surface + '20',
    padding: spacing.sm,
    borderRadius: 8,
  },
  featureIcon: {
    fontSize: 16,
    color: colors.surface,
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.surface,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skipButtonText: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    fontWeight: '500',
  },
  nextButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
  },
  nextButtonText: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OnboardingScreen;