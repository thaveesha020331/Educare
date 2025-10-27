import { apiRequest } from '../utils/api';

export class MessageService {
  // Get all conversations for current user
  static async getConversations() {
    try {
      const response = await apiRequest('/api/messages/conversations', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get conversations error:', error);
      throw error;
    }
  }

  // Get messages for a specific conversation
  static async getMessages(userId) {
    try {
      const response = await apiRequest(`/api/messages/${userId}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }

  // Send a message
  static async sendMessage(recipientId, content) {
    try {
      console.log('MessageService.sendMessage called with:', { recipientId, content });
      
      // Validate inputs
      if (!recipientId) {
        throw new Error('Recipient ID is required');
      }
      if (!content || content.trim().length === 0) {
        throw new Error('Message content is required');
      }
      
      const requestBody = {
        recipientId,
        message: content.trim(),
        type: 'text',
      };
      
      console.log('MessageService sending request body:', requestBody);
      
      const response = await apiRequest('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      console.log('MessageService.sendMessage response:', response);
      return response;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(userId) {
    try {
      const response = await apiRequest(`/api/messages/read/${userId}`, {
        method: 'PUT',
      });
      return response;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  // Alias for backward compatibility
  static async markAsRead(userId) {
    return this.markMessagesAsRead(userId);
  }

  // Delete a message
  static async deleteMessage(messageId) {
    try {
      const response = await apiRequest(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  // Format message time
  static formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  // Format chat time
  static formatChatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }
}
