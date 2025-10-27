import { CalendarService } from './calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

export class NotificationService {
  // Check for upcoming reminders and show notifications
  static async checkUpcomingReminders() {
    try {
      const response = await CalendarService.getUpcomingReminders();
      const reminders = response.reminders || [];
      
      const now = new Date();
      
      for (const reminder of reminders) {
        const reminderTime = new Date(reminder.reminderTime);
        const timeDiff = reminderTime.getTime() - now.getTime();
        
        // Show notification if reminder is due (within 5 minutes)
        if (timeDiff <= 0 && timeDiff > -5 * 60 * 1000) {
          await this.showReminderNotification(reminder);
          await CalendarService.markReminderSent(reminder._id);
        }
      }
      
      return reminders;
    } catch (error) {
      console.error('Error checking reminders:', error);
      return [];
    }
  }

  // Show reminder notification
  static async showReminderNotification(reminder) {
    try {
      const event = reminder.event;
      if (!event) return;

      const title = `🔔 Reminder: ${event.title}`;
      const message = this.formatReminderMessage(event);
      
      // Show native alert
      Alert.alert(
        title,
        message,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Reminder acknowledged');
            }
          }
        ],
        { cancelable: false }
      );

      // Store notification in local storage for history
      await this.storeNotification({
        id: reminder._id,
        title,
        message,
        type: 'reminder',
        eventId: event._id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error showing reminder notification:', error);
    }
  }

  // Format reminder message
  static formatReminderMessage(event) {
    let message = '';
    
    if (event.description) {
      message += `${event.description}\n\n`;
    }
    
    if (event.startTime) {
      message += `⏰ Time: ${event.startTime}`;
      if (event.endTime) {
        message += ` - ${event.endTime}`;
      }
      message += '\n';
    }
    
    if (event.location) {
      message += `📍 Location: ${event.location}\n`;
    }
    
    message += `📅 Date: ${new Date(event.date).toLocaleDateString()}`;
    
    return message;
  }

  // Store notification in local storage
  static async storeNotification(notification) {
    try {
      const notifications = await this.getStoredNotifications();
      notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }
      
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  // Get stored notifications
  static async getStoredNotifications() {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  // Clear old notifications
  static async clearOldNotifications() {
    try {
      const notifications = await this.getStoredNotifications();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentNotifications = notifications.filter(notification => 
        new Date(notification.timestamp) > oneWeekAgo
      );
      
      await AsyncStorage.setItem('notifications', JSON.stringify(recentNotifications));
    } catch (error) {
      console.error('Error clearing old notifications:', error);
    }
  }

  // Schedule reminder check (call this periodically)
  static startReminderChecker() {
    // Check reminders every 5 minutes
    const interval = setInterval(async () => {
      await this.checkUpcomingReminders();
    }, 5 * 60 * 1000);

    // Also check immediately
    this.checkUpcomingReminders();

    return interval;
  }

  // Stop reminder checker
  static stopReminderChecker(interval) {
    if (interval) {
      clearInterval(interval);
    }
  }

  // Get upcoming events for today
  static async getTodaysEvents() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const response = await CalendarService.getEventsByRange(startOfDay, endOfDay);
      return response.events || [];
    } catch (error) {
      console.error('Error getting today\'s events:', error);
      return [];
    }
  }

  // Get upcoming events for this week
  static async getThisWeeksEvents() {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      const response = await CalendarService.getEventsByRange(startOfWeek, endOfWeek);
      return response.events || [];
    } catch (error) {
      console.error('Error getting this week\'s events:', error);
      return [];
    }
  }

  // Show event notification
  static async showEventNotification(event) {
    try {
      const title = `📅 ${event.title}`;
      const message = this.formatEventMessage(event);
      
      Alert.alert(
        title,
        message,
        [{ text: 'OK' }],
        { cancelable: true }
      );

      await this.storeNotification({
        id: event._id,
        title,
        message,
        type: 'event',
        eventId: event._id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error showing event notification:', error);
    }
  }

  // Format event message
  static formatEventMessage(event) {
    let message = '';
    
    if (event.description) {
      message += `${event.description}\n\n`;
    }
    
    if (event.startTime) {
      message += `⏰ Time: ${event.startTime}`;
      if (event.endTime) {
        message += ` - ${event.endTime}`;
      }
      message += '\n';
    }
    
    if (event.location) {
      message += `📍 Location: ${event.location}\n`;
    }
    
    message += `📅 Date: ${new Date(event.date).toLocaleDateString()}`;
    
    return message;
  }

  // Check for events starting soon (within 30 minutes)
  static async checkEventsStartingSoon() {
    try {
      const events = await this.getTodaysEvents();
      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      
      const upcomingEvents = events.filter(event => {
        if (!event.startTime) return false;
        
        const eventDateTime = new Date(`${event.date}T${event.startTime}`);
        return eventDateTime > now && eventDateTime <= thirtyMinutesFromNow;
      });
      
      for (const event of upcomingEvents) {
        await this.showEventNotification(event);
      }
      
      return upcomingEvents;
    } catch (error) {
      console.error('Error checking events starting soon:', error);
      return [];
    }
  }

  // Get notification badge count
  static async getNotificationBadgeCount() {
    try {
      const notifications = await this.getStoredNotifications();
      const unreadCount = notifications.filter(notification => 
        !notification.read
      ).length;
      
      return unreadCount;
    } catch (error) {
      console.error('Error getting notification badge count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId) {
    try {
      const notifications = await this.getStoredNotifications();
      const updatedNotifications = notifications.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead() {
    try {
      const notifications = await this.getStoredNotifications();
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}
