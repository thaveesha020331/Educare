import React, { useState } from 'react';
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, commonStyles } from '../../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

export type Quiz = {
  _id?: string;
  title: string;
  subject: string;
  grade?: string;
  durationMinutes?: number;
  questions: QuizQuestion[];
  status: 'draft' | 'queued' | 'synced';
  updatedAt: string;
  lessonId?: string;
};

const emptyQuestion = (): QuizQuestion => ({
  id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
});

const CreateQuizWizard: React.FC = () => {
  const navigation = useNavigation();
  const { queue, isOnline } = useOfflineQueue();

  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    subject: '',
    grade: '',
    durationMinutes: 20,
    questions: [emptyQuestion()],
    status: 'draft',
    updatedAt: new Date().toISOString(),
    lessonId: '',
  });

  const [lessons, setLessons] = useState([]);

  // Load lessons on component mount
  React.useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const { AuthService } = await import('../../services/auth');
      const token = await AuthService.getStoredToken();
      if (token) {
        const { getLessons } = await import('../../api/lessons');
        const result = await getLessons(token);
        if (result.success) {
          setLessons(result.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load lessons:', error);
    }
  };

  const updateQuiz = (updates: Partial<Quiz>) => {
    setQuiz(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateQuestionField = (index: number, field: keyof QuizQuestion, value: any) => {
    const next = [...quiz.questions];
    next[index] = { ...next[index], [field]: value };
    updateQuiz({ questions: next });
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const next = [...quiz.questions];
    const opts = [...next[qIndex].options];
    opts[optIndex] = value;
    next[qIndex] = { ...next[qIndex], options: opts };
    updateQuiz({ questions: next });
  };

  const addQuestion = () => {
    updateQuiz({ questions: [...quiz.questions, emptyQuestion()] });
  };

  const removeQuestion = (index: number) => {
    if (quiz.questions.length <= 1) return;
    const next = quiz.questions.filter((_, i) => i !== index);
    updateQuiz({ questions: next });
  };

  const validateQuiz = (): string | null => {
    if (!quiz.title.trim()) return 'Please enter a quiz title';
    if (!quiz.subject.trim()) return 'Please enter a subject';
    if (!quiz.lessonId) return 'Please select a lesson';
    for (const q of quiz.questions) {
      if (!q.question.trim()) return 'All questions must have text';
      if (q.options.some(o => !o.trim())) return 'All options must be filled';
      if (q.correctIndex < 0 || q.correctIndex > 3) return 'Each question must have a correct answer selected';
    }
    return null;
  };

  const saveOffline = async () => {
    const error = validateQuiz();
    if (error) return Alert.alert('Validation', error);
    try {
      const localId = await queue('quizzes', quiz);
      Alert.alert('Saved Offline', `Quiz saved with ID: ${localId}`);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save quiz');
    }
  };

  const submitAndSync = async () => {
    const error = validateQuiz();
    if (error) return Alert.alert('Validation', error);
    
    try {
      if (isOnline()) {
        // Get auth token from AuthService
        const { AuthService } = await import('../../services/auth');
        const token = await AuthService.getStoredToken();
        if (!token) {
          Alert.alert('Error', 'Authentication required. Please login again.');
          return;
        }

        // Import the API function
        const { createQuiz } = await import('../../api/lessons');
        
        // Convert quiz data to backend format
        const quizData = {
          title: quiz.title,
          description: quiz.subject,
          lessonId: quiz.lessonId || null, // You may need to add lessonId to the quiz form
          questions: quiz.questions,
          timeLimit: quiz.durationMinutes,
          maxAttempts: 3
        };
        
        const result = await createQuiz(quizData, token);
        
        if (result.success) {
          Alert.alert('Success', 'Quiz created successfully!');
          navigation.goBack();
        } else {
          Alert.alert('Error', result.error || 'Failed to create quiz');
        }
      } else {
        await queue('quizzes', { ...quiz, status: 'queued' });
        Alert.alert('Queued', 'Quiz queued for sync when online');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Submit quiz error:', error);
      Alert.alert('Error', 'Failed to submit quiz');
    }
  };

  const renderQuestion = (q: QuizQuestion, index: number) => (
    <View key={q.id} style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionTitle}>Question {index + 1}</Text>
        <TouchableOpacity style={styles.removeBtn} onPress={() => removeQuestion(index)} disabled={quiz.questions.length <= 1}>
          <Text style={styles.removeBtnText}>×</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter question"
        placeholderTextColor={colors.textSecondary}
        value={q.question}
        onChangeText={(t) => updateQuestionField(index, 'question', t)}
        multiline
      />
      <View style={styles.optionsGroup}>
        {q.options.map((opt, optIdx) => (
          <View key={optIdx} style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.radio, q.correctIndex === optIdx && styles.radioActive]}
              onPress={() => updateQuestionField(index, 'correctIndex', optIdx)}
            >
              {q.correctIndex === optIdx && <Text style={styles.radioDot}>●</Text>}
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.optionInput]}
              placeholder={`Option ${optIdx + 1}`}
              placeholderTextColor={colors.textSecondary}
              value={opt}
              onChangeText={(t) => updateOption(index, optIdx, t)}
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => (navigation as any).goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Create Quiz</Text>
            <Text style={styles.headerSubtitle}>Multiple-choice questions</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={quiz.title}
            onChangeText={(t) => updateQuiz({ title: t })}
            placeholder="e.g., Algebra Basics Quiz"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Lesson</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={quiz.lessonId}
              onValueChange={(value) => updateQuiz({ lessonId: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select a lesson..." value="" />
              {lessons.map((lesson) => (
                <Picker.Item key={lesson._id} label={lesson.title} value={lesson._id} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.section, styles.half]}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={quiz.subject}
              onChangeText={(t) => updateQuiz({ subject: t })}
              placeholder="Mathematics"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={[styles.section, styles.half]}>
            <Text style={styles.label}>Grade</Text>
            <TextInput
              style={styles.input}
              value={quiz.grade}
              onChangeText={(t) => updateQuiz({ grade: t })}
              placeholder="e.g., 7A"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(quiz.durationMinutes || '')}
            onChangeText={(t) => updateQuiz({ durationMinutes: Number(t || 0) })}
            placeholder="20"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.questionsHeader}>
          <Text style={styles.questionsTitle}>Questions</Text>
          <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
            <Text style={styles.addButtonText}>+ Add Question</Text>
          </TouchableOpacity>
        </View>

        {quiz.questions.map((q, idx) => renderQuestion(q, idx))}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={saveOffline}>
          <Text style={styles.saveButtonText}>Save Offline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.submitButton]} onPress={submitAndSync}>
          <LinearGradient colors={['#2563eb', '#3b82f6']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.submitButtonText}>{isOnline() ? 'Submit & Sync' : 'Queue for Sync'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: spacing.lg, paddingBottom: spacing.md, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  section: { marginBottom: spacing.lg },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, color: colors.text, backgroundColor: 'white' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  questionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  questionsTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  addButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  questionCard: { backgroundColor: 'white', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, ...commonStyles.shadow },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  questionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.error + '20', justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { fontSize: 18, color: colors.error, fontWeight: 'bold' },
  optionsGroup: { marginTop: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm, backgroundColor: 'white' },
  radioActive: { backgroundColor: colors.primary + '20' },
  radioDot: { color: colors.primary, fontSize: 14, marginTop: -2 },
  optionInput: { flex: 1 },
  actionBar: { flexDirection: 'row', padding: spacing.lg, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  actionButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveButton: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  submitButton: { borderRadius: 12, overflow: 'hidden' },
  submitGradient: { paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  pickerContainer: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  picker: { height: 50, color: colors.text },
});

export default CreateQuizWizard;


