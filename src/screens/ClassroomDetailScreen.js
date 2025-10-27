import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ClassroomService } from '../services/classroom';
import { colors, spacing, typography } from '../styles/theme';

const ClassroomDetailScreen = ({ navigation, route }) => {
  const { classroom } = route.params;
  const [classroomStudents, setClassroomStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningStudent, setAssigningStudent] = useState(false);

  useEffect(() => {
    loadClassroomData();
  }, []);

  const loadClassroomData = async () => {
    try {
      setLoading(true);
      const [classroomStudentsResponse, allStudentsResponse] = await Promise.all([
        ClassroomService.getClassroomStudents(classroom._id),
        ClassroomService.getRegisteredStudents()
      ]);
      
      setClassroomStudents(classroomStudentsResponse.students || []);
      setAllStudents(allStudentsResponse.students || []);
      
      // Filter out students who are already assigned to any classroom
      const unassigned = (allStudentsResponse.students || []).filter(student => 
        !student.classroomId
      );
      setUnassignedStudents(unassigned);
    } catch (error) {
      console.error('Error loading classroom data:', error);
      Alert.alert('Error', 'Failed to load classroom data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClassroomData();
    setRefreshing(false);
  };

  const handleAssignStudent = async (student) => {
    try {
      setAssigningStudent(true);
      await ClassroomService.assignStudentToClassroom(classroom._id, student._id);
      Alert.alert('Success', `${student.name} assigned to ${classroom.name}!`);
      setShowAssignModal(false);
      await loadClassroomData();
    } catch (error) {
      console.error('Error assigning student:', error);
      Alert.alert('Error', error.message || 'Failed to assign student. Please try again.');
    } finally {
      setAssigningStudent(false);
    }
  };

  const handleRemoveStudent = async (student) => {
    Alert.alert(
      'Remove Student',
      `Remove ${student.name} from ${classroom.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ClassroomService.removeStudentFromClassroom(classroom._id, student._id);
              Alert.alert('Success', 'Student removed from classroom!');
              await loadClassroomData();
            } catch (error) {
              console.error('Error removing student:', error);
              Alert.alert('Error', 'Failed to remove student. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filteredUnassignedStudents = unassignedStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderClassroomStudent = ({ item: student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {student.name ? student.name[0].toUpperCase() : 'S'}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveStudent(student)}
        >
          <Ionicons name="remove-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUnassignedStudent = ({ item: student }) => (
    <TouchableOpacity
      style={styles.unassignedStudentCard}
      onPress={() => handleAssignStudent(student)}
      activeOpacity={0.7}
    >
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {student.name ? student.name[0].toUpperCase() : 'S'}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
        </View>
        <View style={styles.assignButton}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAssignStudentModal = () => (
    <Modal
      visible={showAssignModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Assign Students to {classroom.name}</Text>
          <TouchableOpacity
            onPress={() => setShowAssignModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students by name or email..."
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <FlatList
          data={filteredUnassignedStudents}
          renderItem={renderUnassignedStudent}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.studentListContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Unassigned Students</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm ? 'No students match your search' : 'All students have been assigned to classrooms'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading classroom details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{classroom.name}</Text>
          <TouchableOpacity
            onPress={() => setShowAssignModal(true)}
            style={styles.assignButton}
          >
            <Ionicons name="person-add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Classroom Info */}
      <View style={styles.classroomInfoCard}>
        <View style={styles.classroomIcon}>
          <Text style={styles.classroomIconText}>🏫</Text>
        </View>
        <View style={styles.classroomDetails}>
          <Text style={styles.classroomName}>{classroom.name}</Text>
          {classroom.grade && (
            <Text style={styles.classroomGrade}>Grade: {classroom.grade}</Text>
          )}
          {classroom.subject && (
            <Text style={styles.classroomSubject}>Subject: {classroom.subject}</Text>
          )}
          {classroom.description && (
            <Text style={styles.classroomDescription}>{classroom.description}</Text>
          )}
        </View>
      </View>

      {/* Students Section */}
      <View style={styles.studentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Students ({classroomStudents.length})
          </Text>
          <TouchableOpacity
            onPress={() => setShowAssignModal(true)}
            style={styles.addStudentButton}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addStudentButtonText}>Assign Students</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={classroomStudents}
          renderItem={renderClassroomStudent}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.studentsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Students Assigned</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Assign Students" to add students to this classroom
              </Text>
            </View>
          }
        />
      </View>

      {renderAssignStudentModal()}
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
    backgroundColor: colors.background,
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
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  assignButton: {
    padding: spacing.sm,
  },
  classroomInfoCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classroomIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  classroomIconText: {
    fontSize: 28,
  },
  classroomDetails: {
    flex: 1,
  },
  classroomName: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  classroomGrade: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  classroomSubject: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  classroomDescription: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  studentsSection: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
  },
  addStudentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
  },
  addStudentButtonText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  studentsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  studentCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  studentAvatarText: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.white,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  studentEmail: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing.sm,
  },
  unassignedStudentCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  assignButton: {
    padding: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + 20,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  studentListContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});

export default ClassroomDetailScreen;