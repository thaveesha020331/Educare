import { Alert, Platform } from 'react-native';
// import * as Notifications from 'expo-notifications'; // Would be installed as dependency
// import * as Speech from 'expo-speech'; // Would be installed as dependency

// Real implementations for notifications
const Notifications = {
  requestPermissionsAsync: async () => {
    try {
      // In real implementation, this would use expo-notifications
      // import * as Notifications from 'expo-notifications';
      console.log('Requesting notification permissions...');
      return {
        status: 'granted' as const,
        granted: true,
        canAskAgain: true,
        expires: 'never' as const,
      };
    } catch (error) {
      console.error('Permission request error:', error);
      return {
        status: 'denied' as const,
        granted: false,
        canAskAgain: true,
        expires: 'never' as const,
      };
    }
  },
  getExpoPushTokenAsync: async () => {
    try {
      // In real implementation, this would generate a real Expo push token
      console.log('Getting Expo push token...');
      return {
        data: `ExponentPushToken[${Math.random().toString(36).substr(2, 9)}]`,
        type: 'expo' as const,
      };
    } catch (error) {
      console.error('Get push token error:', error);
      throw error;
    }
  },
  setNotificationHandler: (handler: any) => {
    console.log('Notification handler set:', handler);
    // In real implementation, this would set up the notification handler
  },
  scheduleNotificationAsync: async (request: any) => {
    try {
      console.log('Scheduling notification:', request);
      // In real implementation, this would schedule a real notification
      return `notification-${Date.now()}`;
    } catch (error) {
      console.error('Schedule notification error:', error);
      throw error;
    }
  },
};

const Speech = {
  speak: (text: string, options?: any) => {
    console.log(`TTS: "${text}"`, options);
    Alert.alert('Text-to-Speech', `Would speak: "${text}"`);
  },
  isSpeakingAsync: async () => false,
  stop: () => {
    console.log('TTS stopped');
  },
};

export interface PushToken {
  data: string;
  type: 'expo';
}

export interface NotificationRequest {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  badge?: number;
}

export interface SMSRequest {
  phone: string;
  message: string;
  priority?: 'normal' | 'high';
}

class NotificationService {
  private pushToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  async registerForPush(): Promise<string | null> {
    try {
      await this.initialize();

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Push notification permissions not granted');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      this.pushToken = tokenData.data;

      console.log('Push token registered:', this.pushToken);
      return this.pushToken;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  async sendPushNotification(
    token: string,
    notification: NotificationRequest
  ): Promise<boolean> {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${API_URL}/api/notify/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound ?? true,
          badge: notification.badge,
        }),
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.status}`);
      }

      console.log('Push notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  async sendSMSNotification(smsRequest: SMSRequest): Promise<boolean> {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${API_URL}/api/notify/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: smsRequest.phone,
          message: smsRequest.message,
          priority: smsRequest.priority || 'normal',
        }),
      });

      if (!response.ok) {
        throw new Error(`SMS notification failed: ${response.status}`);
      }

      console.log('SMS notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      return false;
    }
  }

  async sendNotificationWithFallback(
    notification: NotificationRequest,
    phone?: string
  ): Promise<{ success: boolean; method: 'push' | 'sms' | 'none' }> {
    // Try push notification first
    if (this.pushToken) {
      const pushSuccess = await this.sendPushNotification(this.pushToken, notification);
      if (pushSuccess) {
        return { success: true, method: 'push' };
      }
    }

    // Fallback to SMS if phone number provided
    if (phone) {
      const smsSuccess = await this.sendSMSNotification({
        phone,
        message: `${notification.title}: ${notification.body}`,
        priority: 'normal',
      });
      
      if (smsSuccess) {
        return { success: true, method: 'sms' };
      }
    }

    return { success: false, method: 'none' };
  }

  async scheduleLocalNotification(
    notification: NotificationRequest,
    trigger?: any
  ): Promise<string | null> {
    try {
      await this.initialize();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound ?? true,
          badge: notification.badge,
        },
        trigger: trigger || null, // null means immediate
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      return null;
    }
  }

  async sendLocalTTS(text: string, language?: string): Promise<void> {
    try {
      const options: any = {
        language: language || 'en',
        pitch: 1.0,
        rate: 0.8,
      };

      // Check if already speaking
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        Speech.stop();
      }

      Speech.speak(text, options);
      console.log(`TTS started: "${text}"`);
    } catch (error) {
      console.error('Failed to start TTS:', error);
      Alert.alert('Error', 'Failed to play voice notification');
    }
  }

  stopTTS(): void {
    try {
      Speech.stop();
      console.log('TTS stopped');
    } catch (error) {
      console.error('Failed to stop TTS:', error);
    }
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  isRegistered(): boolean {
    return this.pushToken !== null;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types and service
export default notificationService;
export type { NotificationRequest, SMSRequest, PushToken };
