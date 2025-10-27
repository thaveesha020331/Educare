import { API_CONFIG } from '../constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getDefaultBaseUrl() {
  return 'http://10.60.210.34:4000';
}

const BASE_URL = getDefaultBaseUrl();

function withTimeout(promise, ms = API_CONFIG.timeout || 10000) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Network timeout')), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeout,
  ]);
}

export async function apiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  
  // Automatically add auth token if available
  const token = await AsyncStorage.getItem('user_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  console.log('🔵 API Request:', {
    method: options.method || 'GET',
    url,
    hasToken: !!token,
  });

  try {
    const res = await withTimeout(fetch(url, { ...options, headers }));
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();

    console.log('🟢 API Response:', {
      status: res.status,
      url,
    });

    if (!res.ok) {
      const message = (data && data.message) || (data && data.error) || `Request failed with ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      error.data = data;
      
      console.error('🔴 API Error:', {
        status: res.status,
        message,
        url,
      });
      
      // Check if it's a token expiration error
      if (res.status === 403 && message.includes('token')) {
        console.log('🔄 Token expired, clearing stored auth data');
        try {
          await AsyncStorage.removeItem('user_token');
          await AsyncStorage.removeItem('user_data');
        } catch (storageError) {
          console.error('Error clearing auth data:', storageError);
        }
      }
      
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

export function getBaseUrlForDevice() {
  return getDefaultBaseUrl();
}
