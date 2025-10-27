import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ClassroomService } from '../services/classroom';
import { colors, spacing, typography } from '../styles/theme';

const AddStudentToClassroomScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsResponse, classroomsResponse] = await Promise.all([
        ClassroomService.getStudents(),
        ClassroomService.getClassrooms()
      ]);
      setStudents(studentsResponse.students || []);
      setClassrooms(classroomsResponse.classrooms || []);
      
      // Auto-select first classroom if only one exists
      if (classroomsResponse.classrooms && classroomsResponse.classrooms.length === 1) {
        setSelectedClassroom(classroomsResponse.classrooms[0]);
      }
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

  const handleAssignStudent = async (student) => {
    if (!selectedClassroom) {
      Alert.alert('No Classroom Selected', 'Please select a classroom first.');
      return;
    }

    try {
      setAssigningStudent(true);
      await ClassroomService.assignStudentToClassroom(selectedClassroom._id, student._id);
      Alert.alert('Success', `${student.name} assigned to ${selectedClassroom.name}!`);
      await loadData(); // Refresh to update student status
    } catch (error) {
      console.error('Error assigning student:', error);
      Alert.alert('Error', error.message || 'Failed to assign student. Please try again.');
    } finally {
      setAssigningStudent(false);
    }
  };

  const handleClassroomSelect = (classroom) => {
    setSelectedClassroom(classroom);
  };

  const filteredStudents = ClassroomService.searchStudents(students, searchTerm);
  const unassignedStudents = ClassroomService.getUnassignedStudents(filteredStudents);

  const renderClassroomSelector = () => {
    if (classrooms.length === 0) {
      return (
        <View style={styles.classroomSelector}>
          <Text style={styles.selectorTitle}>No Classrooms Available</Text>
          <Text style={styles.emptyClassroomText}>
            You need to create a classroom first before assigning students.
          </Text>
          <TouchableOpacity
            style={styles.createClassroomButton}
            onPress={() => navigation.navigate('ClassroomManagement')}
          >
            <Text style={styles.createClassroomButtonText}>Create Classroom</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.classroomSelector}>
        <Text style={styles.selectorTitle}>Select Classroom:</Text>
        <FlatList
          data={classrooms}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item: classroom }) => (
            <TouchableOpacity
              style={[
                styles.classroomOption,
                selectedClassroom?._id === classroom._id && styles.classroomOptionSelected
              ]}
              onPress={() => handleClassroomSelect(classroom)}
            >
              <Text style={[
                styles.classroomOptionText,
                selectedClassroom?._id === classroom._id && styles.classroomOptionTextSelected
              ]}>
                {classroom.name}
              </Text>
              <Text style={styles.classroomOptionSubtext}>
                {classroom.studentCount || 0} students
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.classroomListContainer}
        />
      </View>
    );
  };

  const renderStudentItem = ({ item: student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {student.name ? student.name[0].toUpperCase() : 'S'}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {ClassroomService.getStudentDisplayName(student)}
          </Text>
          <Text style={styles.studentId}>ID: {student.studentId}</Text>
          {student.grade && (
            <Text style={styles.studentGrade}>Grade: {student.grade}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.assignButton,
            !selectedClassroom && styles.assignButtonDisabled
          ]}
          onPress={() => handleAssignStudent(student)}
          disabled={!selectedClassroom || assigningStudent}
        >
          {assigningStudent ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="add-circle" size={24} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading students...</Text>
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
          <Text style={styles.headerTitle}>Add Students</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ClassroomManagement')}
            style={styles.manageButton}
          >
            <Ionicons name="settings" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Classroom Selector */}
      {renderClassroomSelector()}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search students..."
          placeholderTextColor={colors.textSecondary}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Students List */}
      <FlatList
        data={unassignedStudents}
        renderItem={renderStudentItem}
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
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {searchTerm ? 'No Students Found' : 'No Unassigned Students'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'All students have been assigned to classrooms'
              }
            </Text>
          </View>
        }
      />
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
  manageButton: {
    padding: spacing.sm,
  },
  classroomSelector: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
  },
  classroomListContainer: {
    paddingRight: spacing.lg,
  },
  classroomOption: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
    alignItems: 'center',
  },
  classroomOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classroomOptionText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  classroomOptionTextSelected: {
    color: colors.white,
  },
  classroomOptionSubtext: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  emptyClassroomText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  createClassroomButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignSelf: 'center',
  },
  createClassroomButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
  studentCard: {
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
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
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
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  studentId: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  studentGrade: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  assignButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignButtonDisabled: {
    backgroundColor: colors.textSecondary,
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
});

export default AddStudentToClassroomScreen;
