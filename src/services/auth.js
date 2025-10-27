import { apiRequest } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_ENDPOINTS = {
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  PROFILE: '/api/auth/profile',
};

export class AuthService {
  // Register a new user
  static async register(userData) {
    try {
      console.log('Sending registration data:', userData);
      
      const response = await apiRequest(AUTH_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      console.log('Registration response:', response);

      // Store token and user data
      if (response.user && response.user.token) {
        await this.storeAuthData(response.user);
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  // Login user
  static async login(email, password) {
    try {
      const response = await apiRequest(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store token and user data
      if (response.user && response.user.token) {
        await this.storeAuthData(response.user);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Get user profile
  static async getProfile() {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiRequest(AUTH_ENDPOINTS.PROFILE, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(profileData) {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiRequest(AUTH_ENDPOINTS.PROFILE, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Store authentication data
  static async storeAuthData(userData) {
    try {
      await AsyncStorage.setItem('user_token', userData.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  // Get stored token
  static async getStoredToken() {
    try {
      return await AsyncStorage.getItem('user_token');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  // Logout user
  static async logout() {
    try {
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_data');
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Check if token is valid
  static async isTokenValid() {
    try {
      const token = await this.getStoredToken();
      if (!token) return false;

      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }

  // Get stored user data
  static async getStoredUserData() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated() {
    try {
      const token = await this.getStoredToken();
      const userData = await this.getStoredUserData();
      return !!(token && userData);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Logout user
  static async logout() {
    try {
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_data');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Validate form data
  static validateRegistrationData(formData, selectedRole, selectedStudent = null) {
    const errors = {};

    // Required fields validation
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!selectedRole) {
      errors.role = 'Please select a role';
    }

    // Role-specific validation
    if (selectedRole === 'teacher' && (!formData.schoolId || formData.schoolId.trim().length === 0)) {
      errors.schoolId = 'School ID is required for teachers';
    }

    // For parents, check if a student is selected
    if (selectedRole === 'parent') {
      const childId = selectedStudent ? selectedStudent._id : formData.childId;
      if (!childId || childId.trim().length === 0) {
        errors.childId = "Please select a student to monitor";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateLoginData(email, password) {
    const errors = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password || password.length === 0) {
      errors.password = 'Password is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

