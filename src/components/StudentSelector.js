import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { UserService } from '../services/user';

const StudentSelector = ({ selectedStudent, onStudentSelect, placeholder = "Select a student" }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await UserService.getAllUsers();
      const allUsers = response.users || [];
      const studentUsers = allUsers.filter(user => user.role === 'student');
      setStudents(studentUsers);
      setFilteredStudents(studentUsers);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    onStudentSelect(student);
    setModalVisible(false);
    setSearchQuery('');
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity
      style={styles.studentItem}
      onPress={() => handleStudentSelect(item)}
    >
      <View style={styles.studentInfo}>
        <View style={[styles.studentAvatar, { backgroundColor: UserService.getUserStatusColor(item) }]}>
          <Text style={styles.studentAvatarText}>
            {UserService.getUserAvatarText(item)}
          </Text>
        </View>
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentEmail}>{item.email}</Text>
          {item.studentType && (
            <Text style={styles.studentType}>
              {UserService.getStudentTypeDisplay(item)}
            </Text>
          )}
        </View>
      </View>
      {selectedStudent && selectedStudent._id === item._id && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          {selectedStudent ? (
            <View style={styles.selectedStudent}>
              <View style={[styles.selectedAvatar, { backgroundColor: UserService.getUserStatusColor(selectedStudent) }]}>
                <Text style={styles.selectedAvatarText}>
                  {UserService.getUserAvatarText(selectedStudent)}
                </Text>
              </View>
              <View style={styles.selectedDetails}>
                <Text style={styles.selectedName}>{selectedStudent.name}</Text>
                <Text style={styles.selectedEmail}>{selectedStudent.email}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Student</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredStudents}
            renderItem={renderStudent}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.studentsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>
                  {searchQuery ? 'No students found' : 'No students available'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'Try a different search term' : 'No students are registered yet'}
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 50,
  },
  selectorContent: {
    flex: 1,
  },
  selectedStudent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  selectedAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
  selectedDetails: {
    flex: 1,
  },
  selectedName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  selectedEmail: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  placeholder: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    padding: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  modalHeaderSpacer: {
    width: 44,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  studentsList: {
    padding: spacing.lg,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  studentType: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default StudentSelector;
