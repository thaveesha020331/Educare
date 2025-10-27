import { apiRequest } from '../utils/api';

export class TaskService {
  // Get all tasks
  static async getTasks() {
    try {
      const response = await apiRequest('/api/tasks', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get tasks error:', error);
      throw error;
    }
  }

  // Get single task
  static async getTask(taskId) {
    try {
      const response = await apiRequest(`/api/tasks/${taskId}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get task error:', error);
      throw error;
    }
  }

  // Create task
  static async createTask(taskData) {
    try {
      const response = await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });
      return response;
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  }

  // Update task
  static async updateTask(taskId, taskData) {
    try {
      const response = await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
      });
      return response;
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  }

  // Delete task
  static async deleteTask(taskId) {
    try {
      const response = await apiRequest(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Delete task error:', error);
      throw error;
    }
  }
}
