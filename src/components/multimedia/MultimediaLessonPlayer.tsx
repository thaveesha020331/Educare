import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../styles/theme';
import MultimediaService from '../../services/multimediaService';

interface MultimediaLessonPlayerProps {
  lesson: any;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  adaptiveQuality?: boolean;
}

const { width, height } = Dimensions.get('window');

export const MultimediaLessonPlayer: React.FC<MultimediaLessonPlayerProps> = ({
  lesson,
  onComplete,
  onProgress,
  adaptiveQuality = true
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [currentInteraction, setCurrentInteraction] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  
  const progressInterval = useRef(null);

  useEffect(() => {
    if (lesson) {
      setDuration(lesson.duration || 0);
      setCurrentSlide(0);
      setProgress(0);
      setCurrentTime(0);
    }
  }, [lesson]);

  useEffect(() => {
    if (isPlaying && duration > 0) {
      progressInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          const newProgress = (newTime / duration) * 100;
          setProgress(newProgress);
          
          if (onProgress) {
            onProgress(newProgress);
          }
          
          // Check for interactions at current time
          checkForInteractions(newTime);
          
          if (newTime >= duration) {
            setIsPlaying(false);
            if (onComplete) {
              onComplete();
            }
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, duration, onProgress, onComplete]);

  const checkForInteractions = (time) => {
    if (!lesson.interactions) return;
    
    const interaction = lesson.interactions.find(int => 
      Math.abs(int.timestamp - time) <= 2
    );
    
    if (interaction && interaction !== currentInteraction) {
      setCurrentInteraction(interaction);
      handleInteraction(interaction);
    }
  };

  const handleInteraction = (interaction) => {
    switch (interaction.type) {
      case 'quiz':
        // Quiz will be handled by the quiz component
        break;
      case 'note':
        Alert.alert('Note', interaction.content);
        break;
      case 'highlight':
        // Highlight will be shown in the UI
        break;
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time) => {
    setCurrentTime(time);
    setProgress((time / duration) * 100);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Close quiz after answering
    setTimeout(() => {
      setCurrentInteraction(null);
    }, 1000);
  };

  const renderVideoPlayer = () => {
    return (
      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoPlaceholderText}>📹</Text>
          <Text style={styles.videoPlaceholderLabel}>Video Player</Text>
          <Text style={styles.videoTitle}>{lesson.title}</Text>
        </View>
        
        {showControls && (
          <View style={styles.videoControls}>
            <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
              <Text style={styles.controlIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                <TouchableOpacity 
                  style={[styles.progressThumb, { left: `${progress}%` }]}
                  onPress={() => {}}
                />
              </View>
            </View>
            
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAudioPlayer = () => {
    return (
      <View style={styles.audioContainer}>
        <View style={styles.audioVisualizer}>
          {[...Array(20)].map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.audioBar,
                {
                  height: isPlaying ? Math.random() * 40 + 10 : 10,
                  backgroundColor: colors.primary + '80'
                }
              ]} 
            />
          ))}
        </View>
        
        <Text style={styles.audioTitle}>{lesson.title}</Text>
        
        <View style={styles.audioControls}>
          <TouchableOpacity style={styles.audioControlButton} onPress={togglePlayPause}>
            <Text style={styles.audioControlIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
          
          <View style={styles.audioProgressContainer}>
            <View style={styles.audioProgressBar}>
              <View style={[styles.audioProgressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.audioTimeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSlideshow = () => {
    if (!lesson.slides || lesson.slides.length === 0) return null;
    
    const slide = lesson.slides[currentSlide];
    
    return (
      <View style={styles.slideshowContainer}>
        <View style={styles.slideContainer}>
          {slide.image && (
            <Image source={{ uri: slide.image }} style={styles.slideImage} />
          )}
          
          <View style={styles.slideContent}>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideText}>{slide.text}</Text>
          </View>
        </View>
        
        <View style={styles.slideshowControls}>
          <TouchableOpacity 
            style={[styles.slideButton, currentSlide === 0 && styles.disabledButton]}
            onPress={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
          >
            <Text style={styles.slideButtonText}>← Previous</Text>
          </TouchableOpacity>
          
          <Text style={styles.slideCounter}>
            {currentSlide + 1} / {lesson.slides.length}
          </Text>
          
          <TouchableOpacity 
            style={[styles.slideButton, currentSlide === lesson.slides.length - 1 && styles.disabledButton]}
            onPress={() => setCurrentSlide(Math.min(lesson.slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === lesson.slides.length - 1}
          >
            <Text style={styles.slideButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderQuiz = () => {
    if (!currentInteraction || currentInteraction.type !== 'quiz') return null;
    
    return (
      <View style={styles.quizOverlay}>
        <View style={styles.quizContainer}>
          <Text style={styles.quizTitle}>Quiz Question</Text>
          
          {currentInteraction.questions.map((question, index) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.questionText}>{question.question}</Text>
              
              {question.options.map((option, optionIndex) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.optionButton,
                    quizAnswers[question.id] === option && styles.selectedOption
                  ]}
                  onPress={() => handleQuizAnswer(question.id, option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHighlight = () => {
    if (!currentInteraction || currentInteraction.type !== 'highlight') return null;
    
    return (
      <View style={styles.highlightOverlay}>
        <View style={styles.highlightContainer}>
          <Text style={styles.highlightText}>{currentInteraction.content}</Text>
        </View>
      </View>
    );
  };

  if (!lesson) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {lesson.type === 'video' && renderVideoPlayer()}
      {lesson.type === 'audio' && renderAudioPlayer()}
      {lesson.type === 'slideshow' && renderSlideshow()}
      
      {renderQuiz()}
      {renderHighlight()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  
  // Video Player
  videoContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  videoPlaceholderText: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  videoPlaceholderLabel: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  videoTitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  controlButton: {
    padding: spacing.sm,
  },
  controlIcon: {
    fontSize: 24,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginLeft: -8,
  },
  timeText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    minWidth: 80,
    textAlign: 'right',
  },
  
  // Audio Player
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  audioVisualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: spacing.lg,
  },
  audioBar: {
    width: 4,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  audioTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  audioControls: {
    width: '100%',
    alignItems: 'center',
  },
  audioControlButton: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  audioControlIcon: {
    fontSize: 48,
  },
  audioProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  audioProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  audioProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  audioTimeText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  
  // Slideshow
  slideshowContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  slideContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  slideImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  slideContent: {
    flex: 1,
  },
  slideTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
  },
  slideText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    lineHeight: 24,
  },
  slideshowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  slideButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  slideButtonText: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    fontWeight: '600',
  },
  slideCounter: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    fontWeight: '600',
  },
  
  // Quiz Overlay
  quizOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    margin: spacing.lg,
    maxWidth: width - spacing.lg * 2,
  },
  quizTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: spacing.lg,
  },
  questionText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionButton: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  selectedOption: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  
  // Highlight Overlay
  highlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightContainer: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    padding: spacing.lg,
    margin: spacing.lg,
    maxWidth: width - spacing.lg * 2,
  },
  highlightText: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default MultimediaLessonPlayer;
