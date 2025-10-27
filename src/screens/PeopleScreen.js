import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  FlatList,
  Modal,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, dimensions, commonStyles } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocale } from '../hooks/useLocale';
import { UserService } from '../services/user';

const PeopleScreen = ({ userData, navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLocale();

  // Parents can now see all users in People screen

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const usersResponse = await UserService.getAllUsers();
      // Combine all registered users and filter out invalid ones
      const allUsers = usersResponse.users || [];
      // Only show users with valid roles (teacher, parent, student)
      const validUsers = allUsers.filter(user => 
        user.role === 'teacher' || user.role === 'parent' || user.role === 'student'
      );
      setUsers(validUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredConnections = UserService.searchUsers(users, searchQuery);

  const getStatusColor = (status) => {
    return status === 'online' ? colors.success : colors.textLight;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'teacher': return '#3b82f6';
      case 'student': return '#10b981';
      case 'parent': return '#f59e0b';
      case 'admin': return '#ef4444';
      default: return colors.primary;
    }
  };

  const renderConnection = ({ item }) => (
    <TouchableOpacity 
      style={styles.connectionCard}
      onPress={() => {
        setSelectedPerson(item);
        setShowProfileModal(true);
      }}
    >
      <View style={styles.connectionHeader}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarCircle, { backgroundColor: UserService.getUserStatusColor(item) }]}>
            <Text style={styles.avatar}>{UserService.getUserAvatarText(item)}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
        </View>
        
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{UserService.getUserDisplayName(item)}</Text>
          <View style={styles.roleBadge}>
            <Text style={[styles.roleText, { color: UserService.getUserStatusColor(item) }]}>
              {UserService.getUserRoleDisplay(item)}
            </Text>
          </View>
        </View>
        
        <View style={styles.connectionMeta}>
          <Text style={styles.lastActive}>{UserService.getUserCreationDisplay(item)}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: colors.success }]} />
        </View>
      </View>

      <View style={styles.connectionDetails}>
        <Text style={styles.detailText}>
          📧 {item.email}
          {item.studentType && ` | 🎓 ${UserService.getStudentTypeDisplay(item)}`}
        </Text>
      </View>

      <View style={styles.connectionActions}>
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={() => navigation.navigate('ChatConversation', {
            userId: item._id,
            userName: item.name,
            userRole: item.role,
          })}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color={colors.surface} />
          <Text style={styles.messageButtonText}>
            {userData?.role === 'parent' && item.role === 'teacher' ? 'Message Teacher' : 'Message'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={16} color={colors.primary} />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>{t('people')}</Text>
            <Text style={styles.headerSubtitle}>
              {userData?.role === 'parent' ? `${users.length} People to Connect With` : `${users.length} Registered Users`}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.headerAction} onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color={colors.surface} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPeople')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Connections List */}
      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {filteredConnections.length} {filteredConnections.length === 1 ? 'Person' : 'People'} Found
          </Text>
          <Text style={styles.listSubtitle}>
            {userData?.role === 'parent' ? 'Connect with teachers, students, and other parents' : 'All registered users in the system'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredConnections}
            renderItem={renderConnection}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>
                  {searchQuery ? t('noPeopleFound') : 'No Users Registered'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? t('adjustSearch') : 'No registered users in the database yet'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfileModal(false)}
      >
        {selectedPerson && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowProfileModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('profile')}</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.profileHeader}>
                <View style={[styles.avatarCircle, { backgroundColor: UserService.getUserStatusColor(selectedPerson), width: 100, height: 100, borderRadius: 50 }]}>
                  <Text style={[styles.avatar, { fontSize: 40 }]}>{UserService.getUserAvatarText(selectedPerson)}</Text>
                </View>
                <View style={styles.profileStatus}>
                  <View style={[styles.profileStatusDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.profileStatusText}>Active</Text>
                </View>
              </View>

              <Text style={styles.profileName}>{UserService.getUserDisplayName(selectedPerson)}</Text>
              <View style={[styles.profileRoleBadge, { backgroundColor: UserService.getUserStatusColor(selectedPerson) + '20' }]}>
                <Text style={[styles.profileRoleText, { color: UserService.getUserStatusColor(selectedPerson) }]}>
                  {UserService.getUserRoleDisplay(selectedPerson)}
                </Text>
              </View>

              <View style={styles.profileDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="mail" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{selectedPerson.email}</Text>
                </View>
                
                {selectedPerson.phone && (
                  <View style={styles.detailItem}>
                    <Ionicons name="call" size={20} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{selectedPerson.phone}</Text>
                  </View>
                )}

                {selectedPerson.studentType && (
                  <View style={styles.detailItem}>
                    <Ionicons name="school" size={20} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{UserService.getStudentTypeDisplay(selectedPerson)}</Text>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <Ionicons name="time" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{UserService.getUserCreationDisplay(selectedPerson)}</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.primaryAction}
                  onPress={() => {
                    setShowProfileModal(false);
                    navigation.navigate('ChatConversation', {
                      userId: selectedPerson._id,
                      userName: selectedPerson.name,
                      userRole: selectedPerson.role,
                    });
                  }}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color={colors.surface} />
                  <Text style={styles.primaryActionText}>
                    {userData?.role === 'parent' && selectedPerson?.role === 'teacher' ? 'Message Teacher' : t('sendMessage')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryAction}>
                  <Ionicons name="call" size={20} color={colors.primary} />
                  <Text style={styles.secondaryActionText}>{t('voiceCall')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
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
    marginBottom: spacing.md,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.surface,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    opacity: 0.9,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface + '20',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.surface,
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listHeader: {
    paddingVertical: spacing.md,
  },
  listTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  listSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  connectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...commonStyles.shadow,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    fontSize: 48,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  connectionMeta: {
    alignItems: 'flex-end',
  },
  lastActive: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionDetails: {
    marginBottom: spacing.md,
  },
  detailText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  connectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  messageButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  messageButtonText: {
    color: colors.surface,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  callButtonText: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Modal Styles
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
  modalContent: {
    flex: 1,
    padding: spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileAvatar: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  profileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileStatusText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  profileRoleBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  profileRoleText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  profileBio: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  profileDetails: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalActions: {
    gap: spacing.md,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 16,
    gap: spacing.sm,
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  secondaryActionText: {
    color: colors.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PeopleScreen;
