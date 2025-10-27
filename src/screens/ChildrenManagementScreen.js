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
import { ChildrenService } from '../services/children';
import { colors, spacing, typography } from '../styles/theme';

const ChildrenManagementScreen = ({ navigation }) => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChild, setNewChild] = useState({
    studentId: '',
    name: '',
    grade: '',
    teacher: ''
  });
  const [addingChild, setAddingChild] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await ChildrenService.getChildren();
      setChildren(response.children || []);
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    setRefreshing(false);
  };

  const handleAddChild = async () => {
    const validation = ChildrenService.validateChildData(newChild);
    
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join('\n');
      Alert.alert('Validation Error', errorMessage);
      return;
    }

    try {
      setAddingChild(true);
      const formattedData = ChildrenService.formatChildData(newChild);
      await ChildrenService.addChild(formattedData);
      
      Alert.alert('Success', 'Child added successfully!');
      setShowAddModal(false);
      setNewChild({ studentId: '', name: '', grade: '', teacher: '' });
      await loadChildren();
    } catch (error) {
      console.error('Error adding child:', error);
      Alert.alert('Error', error.message || 'Failed to add child. Please try again.');
    } finally {
      setAddingChild(false);
    }
  };

  const handleSelectChild = async (child) => {
    try {
      await ChildrenService.setSelectedChild(child);
      navigation.navigate('ParentDashboard');
    } catch (error) {
      console.error('Error selecting child:', error);
      Alert.alert('Error', 'Failed to select child. Please try again.');
    }
  };

  const handleRemoveChild = (child) => {
    Alert.alert(
      'Remove Child',
      `Are you sure you want to remove ${child.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChildrenService.removeChild(child._id);
              Alert.alert('Success', 'Child removed successfully!');
              await loadChildren();
            } catch (error) {
              console.error('Error removing child:', error);
              Alert.alert('Error', 'Failed to remove child. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filteredChildren = ChildrenService.searchChildren(children, searchTerm);

  const renderChildItem = ({ item: child }) => (
    <TouchableOpacity
      style={styles.childCard}
      onPress={() => handleSelectChild(child)}
      activeOpacity={0.7}
    >
      <View style={styles.childHeader}>
        <View style={styles.childAvatar}>
          <Text style={styles.childAvatarText}>
            {ChildrenService.getChildAvatar(child)}
          </Text>
        </View>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>
            {ChildrenService.getChildDisplayName(child)}
          </Text>
          <Text style={styles.childStudentId}>ID: {child.studentId}</Text>
          {child.grade && (
            <Text style={styles.childGrade}>Grade: {child.grade}</Text>
          )}
          {child.teacher && (
            <Text style={styles.childTeacher}>Teacher: {child.teacher}</Text>
          )}
        </View>
        <View style={styles.childActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveChild(child)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.childStatus}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: ChildrenService.getChildStatusColor(child) }
        ]} />
        <Text style={styles.statusText}>
          {child.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAddChildModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add New Child</Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Student ID *</Text>
            <TextInput
              style={styles.input}
              value={newChild.studentId}
              onChangeText={(text) => setNewChild({ ...newChild, studentId: text })}
              placeholder="Enter student ID"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Child Name *</Text>
            <TextInput
              style={styles.input}
              value={newChild.name}
              onChangeText={(text) => setNewChild({ ...newChild, name: text })}
              placeholder="Enter child's name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Grade</Text>
            <TextInput
              style={styles.input}
              value={newChild.grade}
              onChangeText={(text) => setNewChild({ ...newChild, grade: text })}
              placeholder="Enter grade (optional)"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teacher</Text>
            <TextInput
              style={styles.input}
              value={newChild.teacher}
              onChangeText={(text) => setNewChild({ ...newChild, teacher: text })}
              placeholder="Enter teacher name (optional)"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setShowAddModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={handleAddChild}
            disabled={addingChild}
          >
            {addingChild ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.addButtonText}>Add Child</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading children...</Text>
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
          <Text style={styles.headerTitle}>My Children</Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search children..."
          placeholderTextColor={colors.textSecondary}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Children List */}
      <FlatList
        data={filteredChildren}
        renderItem={renderChildItem}
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
            <Text style={styles.emptyTitle}>No Children Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first child to get started'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyButtonText}>Add Child</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {renderAddChildModal()}
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
  childCard: {
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
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  childAvatarText: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.white,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  childStudentId: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  childGrade: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  childTeacher: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  childActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.sm,
  },
  childStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
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
  addButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  addButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.white,
  },
});

export default ChildrenManagementScreen;
