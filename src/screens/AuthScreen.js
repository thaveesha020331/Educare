import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {colors, spacing, typography, dimensions, educationStyles} from '../styles/theme';
import { useLocale } from '../hooks/useLocale';
import { AuthService } from '../services/auth';
import StudentSelector from '../components/StudentSelector';

const AuthScreen = ({navigation}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    schoolId: '',
    childId: '',
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    { id: 'teacher', title: 'Teacher', icon: '👩‍🏫', color: colors.teacher },
    { id: 'parent', title: 'Parent', icon: '👨‍👩‍👧‍👦', color: colors.parent },
    { id: 'student', title: 'Student', icon: '🎓', color: colors.student },
  ];


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleAuth = async () => {
    setSubmitting(true);
    
    try {
      if (isSignUp) {
        // Registration
        const validation = AuthService.validateRegistrationData(formData, selectedRole, selectedStudent);
        if (!validation.isValid) {
          Alert.alert('Validation Error', Object.values(validation.errors).join('\n'));
          return;
        }

        const userData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
          phone: formData.phone || '',
          schoolId: formData.schoolId || '',
          childId: selectedStudent ? selectedStudent._id : formData.childId || '',
        };

        console.log('Form data being sent:', userData);
        console.log('Selected role:', selectedRole);

        const response = await AuthService.register(userData);
        Alert.alert('Success', response.message);
        navigation.replace('Main', { userData: response.user });
      } else {
        // Login
        const validation = AuthService.validateLoginData(formData.email, formData.password);
        if (!validation.isValid) {
          Alert.alert('Validation Error', Object.values(validation.errors).join('\n'));
          return;
        }

        const response = await AuthService.login(formData.email, formData.password);
        Alert.alert('Success', response.message);
        navigation.replace('Main', { userData: response.user });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Parse error message for better user feedback
      let errorMessage = error.message || 'An error occurred during authentication';
      
      // If it's a validation error from backend, show the specific errors
      if (error.data && error.data.errors && Array.isArray(error.data.errors)) {
        errorMessage = error.data.errors.map(err => `${err.path}: ${err.msg}`).join('\n');
      } else if (error.message && error.message.includes('Validation failed')) {
        try {
          // Try to extract validation errors from the error message
          const errorData = JSON.parse(error.message);
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map(err => `${err.path}: ${err.msg}`).join('\n');
          }
        } catch (parseError) {
          // If parsing fails, use the original message
          console.log('Could not parse error message:', parseError);
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setSelectedRole(null);
    setSelectedStudent(null);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      schoolId: '',
      childId: '',
    });
  };

  const renderRoleCard = (role) => (
    <TouchableOpacity
      key={role.id}
      style={[
        educationStyles.roleCard,
        selectedRole === role.id && educationStyles.roleCardSelected,
      ]}
      onPress={() => handleRoleSelect(role.id)}>
      <Text style={styles.roleIcon}>{role.icon}</Text>
      <Text style={styles.roleTitle}>{role.title}</Text>
    </TouchableOpacity>
  );


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.gradientContainer}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.title}>
              {isSignUp ? t('join') : t('welcomeBack')}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp ? t('createAccount') : t('signIn')}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Role Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('children')}</Text>
              <View style={styles.rolesContainer}>
                {roles.map(renderRoleCard)}
              </View>
            </View>


            {/* Form Fields */}
            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('profile')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('voiceNotification')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            {isSignUp && selectedRole === 'teacher' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>School ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your School ID"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.schoolId}
                  onChangeText={(value) => handleInputChange('schoolId', value)}
                />
              </View>
            )}

            {isSignUp && selectedRole === 'parent' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Select Your Child</Text>
                <StudentSelector
                  selectedStudent={selectedStudent}
                  onStudentSelect={setSelectedStudent}
                  placeholder="Choose a student to monitor"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            )}

            <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={submitting}>
              <LinearGradient
                colors={[colors.accent, colors.primary]}
                style={styles.authButtonGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text style={styles.authButtonText}>
                  {submitting ? 'Please wait…' : isSignUp ? t('createAccount') : t('signIn')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isSignUp ? t('signIn') : t('signUp')}
              </Text>
              <TouchableOpacity onPress={toggleAuthMode}>
                <Text style={styles.footerLink}>
                  {isSignUp ? t('signIn') : t('signUp')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.surface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.surface,
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: colors.text,
    marginBottom: spacing.md,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  roleTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.bodySmall.fontSize,
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
    fontSize: typography.body.fontSize,
    color: colors.text,
    backgroundColor: colors.background,
  },
  authButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  authButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
  },
  authButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.surface,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  footerLink: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default AuthScreen;