import { apiRequest, getBaseUrlForDevice } from '../utils/api';

const CALENDAR_ENDPOINTS = {
  EVENTS: '/api/calendar/events',
  EVENTS_RANGE: '/api/calendar/events/range',
  REMINDERS: '/api/calendar/reminders',
  CLASSROOM_REMINDERS: '/api/calendar/reminders/classroom',
};

class CalendarService {
  static async getStoredToken() {
    try {
      const { AuthService } = await import('./auth');
      return await AuthService.getStoredToken();
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  // Get all events for a user
  static async getEvents(userId, filters = {}) {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams({
        userId,
        ...filters
      });

      const response = await apiRequest(`${CALENDAR_ENDPOINTS.EVENTS}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get events error:', error);
      throw error;
    }
  }

  // Get events by date range (for calendar view)
  static async getEventsByRange(startDate, endDate) {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await apiRequest(`${CALENDAR_ENDPOINTS.EVENTS_RANGE}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get events by range error:', error);
      throw error;
    }
  }

  // Create a new event
  static async createEvent(eventData) {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await apiRequest(CALENDAR_ENDPOINTS.EVENTS, {
        method: 'POST',
        body: JSON.stringify(eventData),
      });

      return response;
    } catch (error) {
      console.error('Create event error:', error);
      throw error;
    }
  }

  // Update an event
  static async updateEvent(eventId, eventData) {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await apiRequest(`${CALENDAR_ENDPOINTS.EVENTS}/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      return response;
    } catch (error) {
      console.error('Update event error:', error);
      throw error;
    }
  }

  // Delete an event
  static async deleteEvent(eventId) {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await apiRequest(`${CALENDAR_ENDPOINTS.EVENTS}/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Delete event error:', error);
      throw error;
    }
  }

  // Get reminders
  static async getReminders() {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await apiRequest(CALENDAR_ENDPOINTS.REMINDERS, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get reminders error:', error);
      throw error;
    }
  }

  // Get student events (for students and parents)
  static async getStudentEvents(studentId, startDate, endDate) {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams({
        userId: studentId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await apiRequest(`${CALENDAR_ENDPOINTS.EVENTS_RANGE}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get student events error:', error);
      throw error;
    }
  }

  // Get teacher events for students (events created by teacher for the classroom)
  static async getTeacherEventsForStudents(classroomId, startDate, endDate) {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams({
        classroomId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await apiRequest(`${CALENDAR_ENDPOINTS.EVENTS_RANGE}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      console.error('Get teacher events for students error:', error);
      throw error;
    }
  }

  // Create reminder for students in a classroom
  static async createClassroomReminder(reminderData) {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await apiRequest(CALENDAR_ENDPOINTS.CLASSROOM_REMINDERS, {
        method: 'POST',
        body: JSON.stringify(reminderData),
      });

      return response;
    } catch (error) {
      console.error('Create classroom reminder error:', error);
      throw error;
    }
  }
}

export default CalendarService;
