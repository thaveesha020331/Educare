import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, dimensions, commonStyles } from '../../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { LessonQRCodeSheet } from '../../components/share/LessonQRCodeSheet';
import { AuthService } from '../../services/auth';
// import * as DocumentPicker from 'expo-document-picker'; // Would be installed as dependency

// Stub implementations for missing dependencies
const DocumentPicker = {
  getDocumentAsync: async (options: any) => {
    return {
      canceled: false,
      assets: [{
        uri: 'file://stub-document.pdf',
        name: 'Sample Document.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
      }]
    };
  }
};

export type LessonPlan = {
  _id?: string;
  title: string;
  mode: 'normal' | 'special';
  subject: string;
  dateISO: string;
  objectives: string;
  steps: Array<{ order: number; instruction: string }>;
  resources: Array<{uri: string; mime: string; name: string; size?: number}>;
  notes?: string;
  qrCode?: string;
  status: 'draft' | 'queued' | 'synced';
  updatedAt: string;
  classroomId?: string;
};

const CreateLessonWizard = () => {
  const navigation = useNavigation();
  const { queue, isOnline } = useOfflineQueue();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showQRSheet, setShowQRSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  
  const [lessonPlan, setLessonPlan] = useState<LessonPlan>({
    title: '',
    mode: 'normal',
    subject: '',
    dateISO: new Date().toISOString().split('T')[0],
    objectives: '',
    steps: [{ order: 1, instruction: '' }],
    resources: [],
    notes: '',
    status: 'draft',
    updatedAt: new Date().toISOString(),
    classroomId: '',
  });

  const steps = [
    { title: 'Basics', icon: '📝' },
    { title: 'Steps', icon: '📋' },
    { title: 'Resources', icon: '📎' },
  ];

  // Load classrooms on component mount
  React.useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      const token = await AuthService.getStoredToken();
      if (token) {
        const { ClassroomService } = await import('../../services/classroom');
        const result = await ClassroomService.getClassrooms();
        if (result.classrooms) {
          setClassrooms(result.classrooms);
        }
      }
    } catch (error) {
      console.error('Failed to load classrooms:', error);
    }
  };

  const updateLessonPlan = (updates: Partial<LessonPlan>) => {
    setLessonPlan(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const addStep = () => {
    const newOrder = lessonPlan.steps.length + 1;
    updateLessonPlan({
      steps: [...lessonPlan.steps, { order: newOrder, instruction: '' }]
    });
  };

  const removeStep = (index: number) => {
    if (lessonPlan.steps.length <= 1) return;
    const newSteps = lessonPlan.steps.filter((_, i) => i !== index);
    updateLessonPlan({
      steps: newSteps.map((step, i) => ({ ...step, order: i + 1 }))
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...lessonPlan.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    updateLessonPlan({
      steps: newSteps.map((step, i) => ({ ...step, order: i + 1 }))
    });
  };

  const updateStep = (index: number, instruction: string) => {
    const newSteps = [...lessonPlan.steps];
    newSteps[index] = { ...newSteps[index], instruction };
    updateLessonPlan({ steps: newSteps });
  };

  const pickResource = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'video/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newResource = {
          uri: asset.uri,
          mime: asset.mimeType || 'application/octet-stream',
          name: asset.name,
          size: asset.size,
        };
        
        updateLessonPlan({
          resources: [...lessonPlan.resources, newResource]
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick resource');
    }
  };

  const removeResource = (index: number) => {
    updateLessonPlan({
      resources: lessonPlan.resources.filter((_, i) => i !== index)
    });
  };

  const startVoiceDictation = () => {
    // Stub for voice-to-text functionality
    setIsRecording(true);
    Alert.alert('Voice Dictation', 'Voice dictation would start here. This is a stub implementation.');
    
    // Simulate voice input after 2 seconds
    setTimeout(() => {
      setIsRecording(false);
      updateLessonPlan({
        notes: lessonPlan.notes + ' [Voice input would appear here]'
      });
    }, 2000);
  };

  const generateQRCode = async () => {
    try {
      const QRCodeService = await import('../../services/qrCodeService');
      const localId = Date.now().toString();
      
      const result = await QRCodeService.default.generateLessonQRCode(
        localId,
        lessonPlan.title
      );
      
      if (result.success) {
        updateLessonPlan({ qrCode: result.data });
        setShowQRSheet(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('QR Code generation error:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };

  const saveOffline = async () => {
    try {
      const localId = await queue('lessons', lessonPlan);
      Alert.alert('Saved Offline', `Lesson saved locally with ID: ${localId}`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save lesson offline');
    }
  };

  const submitAndSync = async () => {
    if (!lessonPlan.title.trim() || !lessonPlan.subject.trim()) {
      Alert.alert('Validation Error', 'Please fill in title and subject');
      return;
    }

    if (!lessonPlan.classroomId) {
      Alert.alert('Validation Error', 'Please select a classroom');
      return;
    }

    try {
      if (isOnline()) {
        // Get auth token from AuthService
        const token = await AuthService.getStoredToken();
        if (!token) {
          Alert.alert('Error', 'Authentication required. Please login again.');
          return;
        }

        // Import the API function
        const { createLesson } = await import('../../api/lessons');
        const result = await createLesson(lessonPlan, token);
        
        if (result.success) {
          Alert.alert('Success', 'Lesson created successfully!');
          navigation.goBack();
        } else {
          Alert.alert('Error', result.error || 'Failed to create lesson');
        }
      } else {
        await queue('lessons', { ...lessonPlan, status: 'queued' });
        Alert.alert('Queued', 'Lesson queued for sync when online');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit lesson');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.stepTab,
            currentStep === index && styles.stepTabActive
          ]}
          onPress={() => setCurrentStep(index)}
        >
          <Text style={styles.stepIcon}>{step.icon}</Text>
          <Text style={[
            styles.stepTitle,
            currentStep === index && styles.stepTitleActive
          ]}>
            {step.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          { width: `${((currentStep + 1) / steps.length) * 100}%` }
        ]} />
      </View>
    </View>
  );

  const renderBasicsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Lesson Title</Text>
        <TextInput
          style={styles.input}
          value={lessonPlan.title}
          onChangeText={(text) => updateLessonPlan({ title: text })}
          placeholder="Enter lesson title"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={lessonPlan.subject}
          onChangeText={(text) => updateLessonPlan({ subject: text })}
          placeholder="e.g., Mathematics, Science"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Classroom</Text>
        <View style={styles.classroomSelector}>
          {classrooms.map((classroom) => (
            <TouchableOpacity
              key={classroom._id}
              style={[
                styles.classroomOption,
                lessonPlan.classroomId === classroom._id && styles.classroomOptionSelected
              ]}
              onPress={() => updateLessonPlan({ classroomId: classroom._id })}
            >
              <Text style={[
                styles.classroomOptionText,
                lessonPlan.classroomId === classroom._id && styles.classroomOptionTextSelected
              ]}>
                {classroom.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={lessonPlan.dateISO}
          onChangeText={(text) => updateLessonPlan({ dateISO: text })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Special Needs Mode</Text>
          <Switch
            value={lessonPlan.mode === 'special'}
            onValueChange={(value) => updateLessonPlan({ mode: value ? 'special' : 'normal' })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Learning Objectives</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={lessonPlan.objectives}
          onChangeText={(text) => updateLessonPlan({ objectives: text })}
          placeholder="What will students learn?"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderStepsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lesson Steps</Text>
        <TouchableOpacity style={styles.addButton} onPress={addStep}>
          <Text style={styles.addButtonText}>+ Add Step</Text>
        </TouchableOpacity>
      </View>

      {lessonPlan.steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={styles.stepItemHeader}>
            <Text style={styles.stepNumber}>Step {step.order}</Text>
            <View style={styles.stepControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => moveStep(index, 'up')}
                disabled={index === 0}
              >
                <Text style={styles.controlButtonText}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => moveStep(index, 'down')}
                disabled={index === lessonPlan.steps.length - 1}
              >
                <Text style={styles.controlButtonText}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.removeButton]}
                onPress={() => removeStep(index)}
                disabled={lessonPlan.steps.length <= 1}
              >
                <Text style={styles.controlButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={step.instruction}
            onChangeText={(text) => updateStep(index, text)}
            placeholder="Describe this step..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>
      ))}
    </View>
  );

  const renderResourcesStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickResource}>
          <Text style={styles.addButtonText}>+ Add File</Text>
        </TouchableOpacity>
      </View>

      {lessonPlan.resources.map((resource, index) => (
        <View key={index} style={styles.resourceItem}>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceName}>{resource.name}</Text>
            <Text style={styles.resourceMeta}>
              {resource.mime} • {resource.size ? `${Math.round(resource.size / 1024)}KB` : 'Unknown size'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeResourceButton}
            onPress={() => removeResource(index)}
          >
            <Text style={styles.removeResourceText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.inputGroup}>
        <View style={styles.notesHeader}>
          <Text style={styles.label}>Notes</Text>
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={startVoiceDictation}
          >
            <Text style={styles.voiceButtonText}>
              {isRecording ? '🔴 Recording...' : '🎤 Dictate'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={lessonPlan.notes}
          onChangeText={(text) => updateLessonPlan({ notes: text })}
          placeholder="Additional notes..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderBasicsStep();
      case 1: return renderStepsStep();
      case 2: return renderResourcesStep();
      default: return renderBasicsStep();
    }
  };

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
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Create Lesson</Text>
            <Text style={styles.headerSubtitle}>
              {lessonPlan.mode === 'special' ? 'Special Needs Mode' : 'Normal Mode'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.qrButton}
            onPress={generateQRCode}
          >
            <Text style={styles.qrIcon}>📱</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {renderStepIndicator()}
      {renderProgressBar()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={saveOffline}
        >
          <Text style={styles.saveButtonText}>Save Offline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={submitAndSync}
        >
          <LinearGradient
            colors={['#2563eb', '#3b82f6']}
            style={styles.submitGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
          >
            <Text style={styles.submitButtonText}>
              {isOnline() ? 'Submit & Sync' : 'Queue for Sync'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* QR Code Sheet */}
      <LessonQRCodeSheet
        visible={showQRSheet}
        qrCodeData={lessonPlan.qrCode}
        onClose={() => setShowQRSheet(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrIcon: { fontSize: 18 },

  stepIndicator: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  stepTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  stepIcon: { fontSize: 20, marginBottom: spacing.xs },
  stepTitle: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  stepTitleActive: { color: colors.primary, fontWeight: '600' },

  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  content: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  stepContent: { flex: 1 },

  inputGroup: { marginBottom: spacing.lg },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  stepItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...commonStyles.shadow,
  },
  stepItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  stepControls: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeButton: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },

  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...commonStyles.shadow,
  },
  resourceInfo: { flex: 1 },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resourceMeta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  removeResourceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeResourceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
  },

  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  voiceButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  voiceButtonActive: {
    backgroundColor: colors.error,
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  actionBar: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Classroom selector styles
  classroomSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  classroomOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
  },
  classroomOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classroomOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  classroomOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
});

export default CreateLessonWizard;
