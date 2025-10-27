import { apiRequest } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHILDREN_ENDPOINTS = {
  CHILDREN: '/api/children',
};

export class ChildrenService {
  // Get all children for the current parent
  static async getChildren() {
    try {
      const response = await apiRequest(CHILDREN_ENDPOINTS.CHILDREN, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get children error:', error);
      throw error;
    }
  }

  // Add a new child manually
  static async addChild(childData) {
    try {
      const response = await apiRequest(CHILDREN_ENDPOINTS.CHILDREN, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
        body: JSON.stringify(childData),
      });

      return response;
    } catch (error) {
      console.error('Add child error:', error);
      throw error;
    }
  }

  // Update child information
  static async updateChild(childId, childData) {
    try {
      const response = await apiRequest(`${CHILDREN_ENDPOINTS.CHILDREN}/${childId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
        body: JSON.stringify(childData),
      });

      return response;
    } catch (error) {
      console.error('Update child error:', error);
      throw error;
    }
  }

  // Remove child
  static async removeChild(childId) {
    try {
      const response = await apiRequest(`${CHILDREN_ENDPOINTS.CHILDREN}/${childId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Remove child error:', error);
      throw error;
    }
  }

  // Get child details
  static async getChildDetails(childId) {
    try {
      const response = await apiRequest(`${CHILDREN_ENDPOINTS.CHILDREN}/${childId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get child details error:', error);
      throw error;
    }
  }

  // Helper method to get stored token
  static async getStoredToken() {
    try {
      return await AsyncStorage.getItem('user_token');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  // Validate child data
  static validateChildData(childData) {
    const errors = {};

    if (!childData.studentId || childData.studentId.trim().length === 0) {
      errors.studentId = 'Student ID is required';
    }

    if (!childData.name || childData.name.trim().length < 2) {
      errors.name = 'Child name must be at least 2 characters long';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Format child data for API
  static formatChildData(childData) {
    return {
      studentId: childData.studentId.trim(),
      name: childData.name.trim(),
      grade: childData.grade || '',
      teacher: childData.teacher || ''
    };
  }

  // Store selected child in local storage
  static async setSelectedChild(child) {
    try {
      await AsyncStorage.setItem('selected_child', JSON.stringify(child));
    } catch (error) {
      console.error('Error storing selected child:', error);
    }
  }

  // Get selected child from local storage
  static async getSelectedChild() {
    try {
      const child = await AsyncStorage.getItem('selected_child');
      return child ? JSON.parse(child) : null;
    } catch (error) {
      console.error('Error getting selected child:', error);
      return null;
    }
  }

  // Clear selected child
  static async clearSelectedChild() {
    try {
      await AsyncStorage.removeItem('selected_child');
    } catch (error) {
      console.error('Error clearing selected child:', error);
    }
  }

  // Get child avatar/initial
  static getChildAvatar(child) {
    if (child.avatar) {
      return child.avatar;
    }
    
    // Generate initials from name
    const initials = child.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return initials;
  }

  // Get child display name
  static getChildDisplayName(child) {
    return child.name || `Child ${child.studentId}`;
  }

  // Get child status color
  static getChildStatusColor(child) {
    if (!child.isActive) {
      return '#6b7280'; // Gray for inactive
    }
    
    // You can add more logic here based on child's performance, attendance, etc.
    return '#10b981'; // Green for active
  }

  // Get child grade display
  static getChildGradeDisplay(child) {
    if (child.grade) {
      return child.grade;
    }
    return 'Grade not set';
  }

  // Get child teacher display
  static getChildTeacherDisplay(child) {
    if (child.teacher) {
      return child.teacher;
    }
    return 'Teacher not assigned';
  }

  // Check if child has recent activity
  static hasRecentActivity(child, events = []) {
    if (!events || events.length === 0) {
      return false;
    }
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return events.some(event => {
      const eventDate = new Date(event.date);
      return eventDate >= oneWeekAgo;
    });
  }

  // Get child's upcoming events count
  static getUpcomingEventsCount(child, events = []) {
    if (!events || events.length === 0) {
      return 0;
    }
    
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= oneWeekFromNow;
    }).length;
  }

  // Sort children by name
  static sortChildrenByName(children) {
    return [...children].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  // Sort children by grade
  static sortChildrenByGrade(children) {
    return [...children].sort((a, b) => {
      const gradeA = a.grade || '';
      const gradeB = b.grade || '';
      return gradeA.localeCompare(gradeB);
    });
  }

  // Filter children by active status
  static filterActiveChildren(children) {
    return children.filter(child => child.isActive);
  }

  // Search children by name or student ID
  static searchChildren(children, searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return children;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return children.filter(child => {
      const name = child.name.toLowerCase();
      const studentId = child.studentId.toLowerCase();
      const grade = (child.grade || '').toLowerCase();
      const teacher = (child.teacher || '').toLowerCase();
      
      return name.includes(term) || 
             studentId.includes(term) || 
             grade.includes(term) || 
             teacher.includes(term);
    });
  }
}
