import { apiRequest } from '../utils/api';
import { getBaseUrlForDevice } from '../utils/api';

export class HealthService {
  // Make unauthenticated request for testing auth protection
  static async makeUnauthenticatedRequest(path, options = {}) {
    const baseUrl = getBaseUrlForDevice();
    const url = `${baseUrl}${path}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    console.log('🔵 Unauthenticated API Request:', {
      method: options.method || 'GET',
      url,
    });

    try {
      const response = await fetch(url, { ...options, headers });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        const error = new Error(data.message || data.error || `Request failed with ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (!error.status) {
        console.error('🔴 Network Error:', error.message);
      }
      throw error;
    }
  }

  // Check backend health
  static async checkBackendHealth() {
    try {
      const response = await apiRequest('/health', {
        method: 'GET',
      });
      
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to backend',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Check if backend is reachable
  static async isBackendReachable() {
    try {
      const result = await this.checkBackendHealth();
      return result.success;
    } catch (error) {
      return false;
    }
  }

  // Get backend status with detailed info
  static async getBackendStatus() {
    const healthCheck = await this.checkBackendHealth();
    
    return {
      isOnline: healthCheck.success,
      message: healthCheck.success ? 'Backend is running' : 'Backend is offline',
      details: healthCheck.success ? healthCheck.data : null,
      error: healthCheck.success ? null : healthCheck.error,
      timestamp: healthCheck.timestamp,
      status: healthCheck.success ? 'healthy' : 'unhealthy'
    };
  }

  // Test multiple endpoints
  static async runFullHealthCheck() {
    const results = {
      health: await this.checkBackendHealth(),
      timestamp: new Date().toISOString()
    };

    // If health check passes, test auth endpoints
    if (results.health.success) {
      try {
        // Test if protected endpoints are accessible (without credentials)
        // Using /api/calendar/events with userId parameter to test auth protection
        const authTest = await this.makeUnauthenticatedRequest('/api/calendar/events?userId=test', {
          method: 'GET',
        });
        results.auth = { success: false, error: 'Unexpected success - should require auth' };
      } catch (error) {
        console.log('Auth test error:', error);
        console.log('Error message:', error.message);
        console.log('Error status:', error.status);
        
        if (error.message.includes('Access token required') || error.message.includes('401') || error.status === 401) {
          results.auth = { success: true, message: 'Auth endpoints protected correctly' };
        } else {
          results.auth = { success: false, error: error.message };
        }
      }
    }

    return results;
  }
}
