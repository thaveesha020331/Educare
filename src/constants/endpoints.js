export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
  },
  
  // Tasks
  TASKS: {
    LIST: '/api/tasks',
    CREATE: '/api/tasks',
    GET: (id) => `/api/tasks/${id}`,
    UPDATE: (id) => `/api/tasks/${id}`,
    DELETE: (id) => `/api/tasks/${id}`,
  },
  
  // Users
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/profile',
  },
  
  // Add more endpoints as needed
};
