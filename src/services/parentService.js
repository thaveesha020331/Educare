import { apiRequest } from '../utils/api';

export class ParentService {
  // Get parent's associated student
  static async getStudent() {
    try {
      const response = await apiRequest('/api/parent/student', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get student error:', error);
      throw error;
    }
  }

  // Get parent's student progress
  static async getStudentProgress() {
    try {
      const response = await apiRequest('/api/parent/student/progress', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get student progress error:', error);
      throw error;
    }
  }

  // Get parent's student events
  static async getStudentEvents(studentId = null) {
    try {
      const url = studentId 
        ? `/api/parent/student/events?studentId=${studentId}`
        : '/api/parent/student/events';
      
      const response = await apiRequest(url, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get student events error:', error);
      throw error;
    }
  }

  // Get parent's student lessons
  static async getStudentLessons() {
    try {
      const response = await apiRequest('/api/parent/student/lessons', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get student lessons error:', error);
      throw error;
    }
  }

  // Get parent's student quizzes
  static async getStudentQuizzes() {
    try {
      const response = await apiRequest('/api/parent/student/quizzes', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get student quizzes error:', error);
      throw error;
    }
  }

  // Get teachers for messaging
  static async getTeachers() {
    try {
      const response = await apiRequest('/api/parent/teachers', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get teachers error:', error);
      throw error;
    }
  }

  // Add student to parent
  static async addStudent(studentId) {
    try {
      const response = await apiRequest('/api/parent/students', {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      });
      return response;
    } catch (error) {
      console.error('Add student error:', error);
      throw error;
    }
  }

  // Remove student from parent
  static async removeStudent(studentId) {
    try {
      const response = await apiRequest(`/api/parent/students/${studentId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Remove student error:', error);
      throw error;
    }
  }

  // Get all students for parent
  static async getAllStudents() {
    try {
      const response = await apiRequest('/api/parent/students', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get all students error:', error);
      throw error;
    }
  }
}
