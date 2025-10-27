export const APP_CONFIG = {
  name: 'React Native App',
  version: '1.0.0',
  description: 'A modern React Native mobile application',
};

export const API_CONFIG = {
  baseURL: '',
  timeout: 10000,
};

export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

export const SCREEN_NAMES = {
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  AUTH: 'Auth',
  HOME: 'Home',
};

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
};
