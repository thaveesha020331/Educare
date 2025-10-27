import { apiRequest } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLASSROOM_ENDPOINTS = {
  CLASSROOMS: '/api/classrooms',
  STUDENTS: '/api/students',
  USERS_STUDENTS: '/api/users/students',
};

export class ClassroomService {
  // Get all classrooms for the current teacher
  static async getClassrooms() {
    try {
      const response = await apiRequest(CLASSROOM_ENDPOINTS.CLASSROOMS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get classrooms error:', error);
      throw error;
    }
  }

  // Create a new classroom
  static async createClassroom(classroomData) {
    try {
      const response = await apiRequest(CLASSROOM_ENDPOINTS.CLASSROOMS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
        body: JSON.stringify(classroomData),
      });

      return response;
    } catch (error) {
      console.error('Create classroom error:', error);
      throw error;
    }
  }

  // Update classroom information
  static async updateClassroom(classroomId, classroomData) {
    try {
      const response = await apiRequest(`${CLASSROOM_ENDPOINTS.CLASSROOMS}/${classroomId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
        body: JSON.stringify(classroomData),
      });

      return response;
    } catch (error) {
      console.error('Update classroom error:', error);
      throw error;
    }
  }

  // Delete classroom
  static async deleteClassroom(classroomId) {
    try {
      const response = await apiRequest(`${CLASSROOM_ENDPOINTS.CLASSROOMS}/${classroomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Delete classroom error:', error);
      throw error;
    }
  }

  // Get all students (for teacher to assign to classrooms)
  static async getStudents() {
    try {
      const response = await apiRequest(CLASSROOM_ENDPOINTS.STUDENTS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get students error:', error);
      throw error;
    }
  }

  // Get all registered students (users with student role)
  static async getRegisteredStudents() {
    try {
      const response = await apiRequest(CLASSROOM_ENDPOINTS.USERS_STUDENTS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get registered students error:', error);
      throw error;
    }
  }

  // Assign student to classroom (using users collection)
  static async assignStudentToClassroom(classroomId, studentId) {
    try {
      const response = await apiRequest(`${CLASSROOM_ENDPOINTS.CLASSROOMS}/${classroomId}/users/${studentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Assign student error:', error);
      throw error;
    }
  }

  // Remove student from classroom (using users collection)
  static async removeStudentFromClassroom(classroomId, studentId) {
    try {
      const response = await apiRequest(`${CLASSROOM_ENDPOINTS.CLASSROOMS}/${classroomId}/users/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Remove student error:', error);
      throw error;
    }
  }

  // Get students in a specific classroom (using users collection)
  static async getClassroomStudents(classroomId) {
    try {
      const response = await apiRequest(`${CLASSROOM_ENDPOINTS.CLASSROOMS}/${classroomId}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getStoredToken()}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get classroom students error:', error);
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

  // Validate classroom data
  static validateClassroomData(classroomData) {
    const errors = {};

    if (!classroomData.name || classroomData.name.trim().length === 0) {
      errors.name = 'Classroom name is required';
    }

    if (classroomData.name && classroomData.name.trim().length < 2) {
      errors.name = 'Classroom name must be at least 2 characters long';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Format classroom data for API
  static formatClassroomData(classroomData) {
    return {
      name: classroomData.name.trim(),
      description: classroomData.description || '',
      grade: classroomData.grade || '',
      subject: classroomData.subject || ''
    };
  }

  // Get classroom display name
  static getClassroomDisplayName(classroom) {
    return classroom.name || 'Unnamed Classroom';
  }

  // Get classroom status color
  static getClassroomStatusColor(classroom) {
    if (!classroom.isActive) {
      return '#6b7280'; // Gray for inactive
    }
    
    if (classroom.studentCount === 0) {
      return '#f59e0b'; // Amber for empty classroom
    }
    
    return '#10b981'; // Green for active classroom with students
  }

  // Get classroom grade display
  static getClassroomGradeDisplay(classroom) {
    if (classroom.grade) {
      return classroom.grade;
    }
    return 'Grade not set';
  }

  // Get classroom subject display
  static getClassroomSubjectDisplay(classroom) {
    if (classroom.subject) {
      return classroom.subject;
    }
    return 'Subject not set';
  }

  // Sort classrooms by name
  static sortClassroomsByName(classrooms) {
    return [...classrooms].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  // Sort classrooms by student count
  static sortClassroomsByStudentCount(classrooms) {
    return [...classrooms].sort((a, b) => {
      return (b.studentCount || 0) - (a.studentCount || 0);
    });
  }

  // Filter classrooms by active status
  static filterActiveClassrooms(classrooms) {
    return classrooms.filter(classroom => classroom.isActive);
  }

  // Search classrooms by name, grade, or subject
  static searchClassrooms(classrooms, searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return classrooms;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return classrooms.filter(classroom => {
      const name = classroom.name.toLowerCase();
      const grade = (classroom.grade || '').toLowerCase();
      const subject = (classroom.subject || '').toLowerCase();
      const description = (classroom.description || '').toLowerCase();
      
      return name.includes(term) || 
             grade.includes(term) || 
             subject.includes(term) ||
             description.includes(term);
    });
  }

  // Get student display name
  static getStudentDisplayName(student) {
    return student.name || `Student ${student.studentId}`;
  }

  // Get student classroom display
  static getStudentClassroomDisplay(student) {
    if (student.classroom) {
      return `${student.classroom.name} (${student.classroom.grade})`;
    }
    return 'Not assigned';
  }

  // Check if student is assigned to classroom
  static isStudentAssigned(student) {
    return student.classroomId && student.classroom;
  }

  // Get unassigned students
  static getUnassignedStudents(students) {
    return students.filter(student => !this.isStudentAssigned(student));
  }

  // Get students assigned to specific classroom
  static getStudentsInClassroom(students, classroomId) {
    return students.filter(student => student.classroomId === classroomId);
  }

  // Sort students by name
  static sortStudentsByName(students) {
    return [...students].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  // Sort students by grade
  static sortStudentsByGrade(students) {
    return [...students].sort((a, b) => {
      const gradeA = a.grade || '';
      const gradeB = b.grade || '';
      return gradeA.localeCompare(gradeB);
    });
  }

  // Search students by name or student ID
  static searchStudents(students, searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return students;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return students.filter(student => {
      const name = student.name.toLowerCase();
      const studentId = student.studentId.toLowerCase();
      const grade = (student.grade || '').toLowerCase();
      
      return name.includes(term) || 
             studentId.includes(term) || 
             grade.includes(term);
    });
  }
}

