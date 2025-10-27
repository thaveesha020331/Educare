import { apiRequest } from '../utils/api';

const USER_ENDPOINTS = {
  USERS: '/api/users',
  STUDENTS: '/api/users/students',
};

export class UserService {
  /**
   * Get all users (parents, teachers, students)
   */
  static async getAllUsers() {
    try {
      const response = await apiRequest(USER_ENDPOINTS.USERS, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Get all students (users with student role)
   */
  static async getStudents() {
    try {
      const response = await apiRequest(USER_ENDPOINTS.STUDENTS, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  /**
   * Get user display name
   */
  static getUserDisplayName(user) {
    if (!user) return 'Unknown User';
    return user.name || user.email || 'Unknown User';
  }

  /**
   * Get user role display
   */
  static getUserRoleDisplay(user) {
    if (!user) return 'Unknown Role';
    
    const roleMap = {
      'parent': 'Parent',
      'teacher': 'Teacher',
      'student': 'Student',
      'admin': 'Admin'
    };
    
    return roleMap[user.role] || user.role || 'Unknown Role';
  }

  /**
   * Get student type display
   */
  static getStudentTypeDisplay(student) {
    if (!student || !student.studentType) return 'Regular Student';
    
    const typeMap = {
      'regular': 'Regular Student',
      'advanced': 'Advanced Student',
      'special_needs': 'Special Needs',
      'gifted': 'Gifted Student'
    };
    
    return typeMap[student.studentType] || student.studentType || 'Regular Student';
  }

  /**
   * Get user avatar text
   */
  static getUserAvatarText(user) {
    if (!user) return 'U';
    const name = user.name || user.email || 'User';
    return name[0].toUpperCase();
  }

  /**
   * Get user status color
   */
  static getUserStatusColor(user) {
    if (!user) return '#6b7280';
    
    const statusMap = {
      'parent': '#3b82f6',    // Blue
      'teacher': '#10b981',    // Green
      'student': '#f59e0b',    // Yellow
      'admin': '#ef4444'       // Red
    };
    
    return statusMap[user.role] || '#6b7280';
  }

  /**
   * Search users by name or email
   */
  static searchUsers(users, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return users;
    }
    
    const term = searchTerm.toLowerCase().trim();
    return users.filter(user => 
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.role && user.role.toLowerCase().includes(term))
    );
  }

  /**
   * Filter users by role
   */
  static filterUsersByRole(users, role) {
    if (!role || role === 'all') {
      return users;
    }
    
    return users.filter(user => user.role === role);
  }

  /**
   * Get user creation date display
   */
  static getUserCreationDisplay(user) {
    if (!user || !user.createdAt) return 'Unknown Date';
    
    const date = new Date(user.createdAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

