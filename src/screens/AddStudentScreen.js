import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, commonStyles } from '../styles/theme';
import { ParentService } from '../services/parentService';
import { UserService } from '../services/user';
import StudentSelector from '../components/StudentSelector';

const AddStudentScreen = ({ navigation, userData }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentStudents, setCurrentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCurrentStudents();
  }, []);

  const loadCurrentStudents = async () => {
    try {
      setLoading(true);
      const response = await ParentService.getAllStudents();
      setCurrentStudents(response.students || []);
    } catch (error) {
      console.error('Error loading current students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCurrentStudents();
    setRefreshing(false);
  };

  const handleAddStudent = async () => {
    if (!selectedStudent) {
      Alert.alert('Error', 'Please select a student to add');
      return;
    }

    // Check if student is already associated
    const isAlreadyAssociated = currentStudents.some(
      student => student._id === selectedStudent._id
    );

    if (isAlreadyAssociated) {
      Alert.alert('Error', 'This student is already associated with your account');
      return;
    }

    try {
      setAdding(true);
      const response = await ParentService.addStudent(selectedStudent._id);
      Alert.alert(
        'Success',
        response.message,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedStudent(null);
              loadCurrentStudents();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', error.message || 'Failed to add student. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Student</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Current Students */}
        {currentStudents.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Students</Text>
            {currentStudents.map((student, index) => (
              <View key={index} style={styles.studentItem}>
                <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.studentAvatarText}>
                    {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentEmail}>{student.email}</Text>
                </View>
                <View style={styles.studentStatus}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add New Student */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Student</Text>
          <Text style={styles.cardDescription}>
            Select a student to add to your account. You can monitor their progress, 
            view their activities, and communicate with their teachers.
          </Text>
          
          <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>Select Student</Text>
            <StudentSelector
              selectedStudent={selectedStudent}
              onStudentSelect={setSelectedStudent}
              placeholder="Choose a student to monitor"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              (!selectedStudent || adding) && styles.addButtonDisabled
            ]}
            onPress={handleAddStudent}
            disabled={!selectedStudent || adding}
          >
            {adding ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Ionicons name="person-add" size={20} color={colors.surface} />
            )}
            <Text style={styles.addButtonText}>
              {adding ? 'Adding...' : 'Add Student'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Need Help?</Text>
          <View style={styles.helpItems}>
            <View style={styles.helpItem}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.helpText}>
                Only students registered in the system can be added to your account
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="school" size={20} color={colors.primary} />
              <Text style={styles.helpText}>
                Contact your school administrator if you can't find your child
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.helpText}>
                You can add multiple students to monitor their progress
              </Text>
            </View>
          </View>
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
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.surface,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...commonStyles.shadow,
  },
  cardTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardDescription: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  studentAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  studentEmail: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  studentStatus: {
    marginLeft: spacing.sm,
  },
  selectorContainer: {
    marginBottom: spacing.lg,
  },
  selectorLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  helpItems: {
    gap: spacing.md,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  helpText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
});

export default AddStudentScreen;
