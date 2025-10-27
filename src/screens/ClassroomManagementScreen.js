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

const ClassroomManagementScreen = ({ navigation }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [newClassroom, setNewClassroom] = useState({
    name: '',
    description: '',
    grade: '',
    subject: ''
  });
  const [creatingClassroom, setCreatingClassroom] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    console.log('showAssignModal changed to:', showAssignModal);
    console.log('selectedClassroom changed to:', selectedClassroom?.name);
  }, [showAssignModal, selectedClassroom]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classroomsResponse, studentsResponse] = await Promise.all([
        ClassroomService.getClassrooms(),
        ClassroomService.getRegisteredStudents()
      ]);
      setClassrooms(classroomsResponse.classrooms || []);
      setStudents(studentsResponse.students || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateClassroom = async () => {
    const validation = ClassroomService.validateClassroomData(newClassroom);
    
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join('\n');
      Alert.alert('Validation Error', errorMessage);
      return;
    }

    try {
      setCreatingClassroom(true);
      const formattedData = ClassroomService.formatClassroomData(newClassroom);
      await ClassroomService.createClassroom(formattedData);
      
      Alert.alert('Success', 'Classroom created successfully!');
      setShowCreateModal(false);
      setNewClassroom({ name: '', description: '', grade: '', subject: '' });
      await loadData();
    } catch (error) {
      console.error('Error creating classroom:', error);
      Alert.alert('Error', error.message || 'Failed to create classroom. Please try again.');
    } finally {
      setCreatingClassroom(false);
    }
  };

  const handleDeleteClassroom = (classroom) => {
    Alert.alert(
      'Delete Classroom',
      `Are you sure you want to delete "${classroom.name}"? This will remove all student assignments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ClassroomService.deleteClassroom(classroom._id);
              Alert.alert('Success', 'Classroom deleted successfully!');
              await loadData();
            } catch (error) {
              console.error('Error deleting classroom:', error);
              Alert.alert('Error', 'Failed to delete classroom. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleAssignStudent = async (student) => {
    try {
      setAssigningStudent(true);
      await ClassroomService.assignStudentToClassroom(selectedClassroom._id, student._id);
      Alert.alert('Success', `${student.name} assigned to ${selectedClassroom.name}!`);
      setShowAssignModal(false);
      setSelectedClassroom(null);
      await loadData();
    } catch (error) {
      console.error('Error assigning student:', error);
      Alert.alert('Error', error.message || 'Failed to assign student. Please try again.');
    } finally {
      setAssigningStudent(false);
    }
  };

  const handleRemoveStudent = async (student, classroom) => {
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
              await loadData();
            } catch (error) {
              console.error('Error removing student:', error);
              Alert.alert('Error', 'Failed to remove student. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filteredClassrooms = ClassroomService.searchClassrooms(classrooms, searchTerm);
  const unassignedStudents = ClassroomService.getUnassignedStudents(students);

  const renderClassroomItem = ({ item: classroom }) => (
    <TouchableOpacity
      style={styles.classroomCard}
      onPress={() => navigation.navigate('ClassroomDetail', { classroom })}
      activeOpacity={0.7}
    >
      <View style={styles.classroomHeader}>
        <View style={styles.classroomIcon}>
          <Text style={styles.classroomIconText}>🏫</Text>
        </View>
        <View style={styles.classroomInfo}>
          <Text style={styles.classroomName}>
            {ClassroomService.getClassroomDisplayName(classroom)}
          </Text>
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
        <View style={styles.classroomActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteClassroom(classroom)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.classroomFooter}>
        <View style={styles.studentCount}>
          <Ionicons name="people" size={16} color={colors.textSecondary} />
          <Text style={styles.studentCountText}>
            {classroom.studentCount || 0} students
          </Text>
        </View>
        <Text style={styles.viewStudentsText}>Tap to view</Text>
      </View>
    </TouchableOpacity>
  );

  const renderStudentItem = ({ item: student }) => (
    <TouchableOpacity
      style={styles.studentCard}
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
          <Text style={styles.studentStatus}>
            {student.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <View style={styles.assignButton}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCreateClassroomModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create New Classroom</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Classroom Name *</Text>
            <TextInput
              style={styles.input}
              value={newClassroom.name}
              onChangeText={(text) => setNewClassroom({ ...newClassroom, name: text })}
              placeholder="Enter classroom name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Grade</Text>
            <TextInput
              style={styles.input}
              value={newClassroom.grade}
              onChangeText={(text) => setNewClassroom({ ...newClassroom, grade: text })}
              placeholder="Enter grade (optional)"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              value={newClassroom.subject}
              onChangeText={(text) => setNewClassroom({ ...newClassroom, subject: text })}
              placeholder="Enter subject (optional)"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newClassroom.description}
              onChangeText={(text) => setNewClassroom({ ...newClassroom, description: text })}
              placeholder="Enter description (optional)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setShowCreateModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleCreateClassroom}
            disabled={creatingClassroom}
          >
            {creatingClassroom ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.createButtonText}>Create Classroom</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderAssignStudentModal = () => {
    console.log('Rendering assign modal, showAssignModal:', showAssignModal, 'selectedClassroom:', selectedClassroom?.name); // Debug log
    return (
    <Modal
      visible={showAssignModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Assign Students to {selectedClassroom?.name}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowAssignModal(false);
              setSelectedClassroom(null);
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <FlatList
          data={unassignedStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.studentListContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Unassigned Students</Text>
              <Text style={styles.emptySubtitle}>
                All students have been assigned to classrooms
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading classrooms...</Text>
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
          <Text style={styles.headerTitle}>My Classrooms</Text>
          <View style={styles.headerActions}>
            {classrooms.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('AddStudentToClassroom')}
                style={styles.addStudentsButton}
              >
                <Text style={styles.addStudentsButtonText}>Add Students</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search classrooms..."
          placeholderTextColor={colors.textSecondary}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Classrooms List */}
      <FlatList
        data={filteredClassrooms}
        renderItem={renderClassroomItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
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
            <Ionicons name="school-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Classrooms Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first classroom to get started'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyButtonText}>Create Classroom</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {renderCreateClassroomModal()}
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
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addStudentsButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginRight: spacing.sm,
  },
  addStudentsButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.white,
  },
  addButton: {
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
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  classroomCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classroomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classroomIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  classroomIconText: {
    fontSize: 24,
  },
  classroomInfo: {
    flex: 1,
  },
  classroomName: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  classroomGrade: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  classroomSubject: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  classroomDescription: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  classroomActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.sm,
  },
  classroomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  studentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentCountText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  viewStudentsText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontStyle: 'italic',
  },
  studentCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
    marginBottom: spacing.xs,
  },
  studentStatus: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '600',
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
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
  },
  emptyButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.white,
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
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  createButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.white,
  },
  studentListContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});

export default ClassroomManagementScreen;
