import { apiRequest } from '../utils/api';

class GeminiChatbotService {
  static async initializeChatbot(userRole, studentType = null) {
    try {
      const systemPrompt = this.getSystemPrompt(userRole, studentType);
      const response = await apiRequest('/api/chatbot/initialize', {
        method: 'POST',
        body: JSON.stringify({
          systemPrompt,
          userRole,
          studentType,
          preferences: {
            useSimpleLanguage: true,
            includeEmojis: true,
            voiceEnabled: true,
            visualAids: true
          }
        }),
      });
      return response;
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      throw error;
    }
  }

  static getSystemPrompt(userRole, studentType) {
    const basePrompt = `You are a friendly, patient, and encouraging educational assistant designed specifically for students with special needs. Your role is to help students learn, understand concepts, and feel supported in their educational journey.

Key Guidelines:
- Use simple, clear language with short sentences
- Be extremely patient and encouraging
- Use emojis and visual cues when helpful
- Break down complex topics into easy steps
- Always be positive and supportive
- Offer multiple ways to explain concepts (visual, audio, text)
- Never rush the student
- Celebrate small achievements

Special Instructions for Different Needs:`;

    if (studentType === 'special') {
      return `${basePrompt}

For students with special needs:
- Use even simpler language (grade 2-3 level)
- Provide step-by-step instructions
- Use visual cues and emojis frequently
- Offer breaks and encouragement
- Repeat important information
- Use positive reinforcement
- Be extra patient with responses
- Suggest alternative learning methods`;
    }

    return `${basePrompt}

For all students:
- Adapt your language to the student's level
- Use examples from their daily life
- Encourage questions
- Provide multiple explanation methods
- Be supportive of learning differences`;
  }

  static async sendMessage(message, context = {}) {
    try {
      console.log('GeminiChatbotService.sendMessage called with:', { message, context });
      
      const response = await apiRequest('/api/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({
          message: message.trim(),
          context: {
            userRole: context.userRole || 'student',
            studentType: context.studentType || 'normal',
            currentSubject: context.currentSubject,
            learningLevel: context.learningLevel || 'beginner',
            preferences: {
              useSimpleLanguage: context.useSimpleLanguage !== false,
              includeEmojis: context.includeEmojis !== false,
              voiceEnabled: context.voiceEnabled !== false,
              visualAids: context.visualAids !== false
            }
          }
        }),
      });
      
      console.log('GeminiChatbotService.sendMessage response:', response);
      return response;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  }

  static async getLearningSuggestions(subject, difficulty = 'beginner') {
    try {
      const response = await apiRequest('/api/chatbot/suggestions', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          difficulty,
          type: 'learning_activities'
        }),
      });
      return response;
    } catch (error) {
      console.error('Error getting learning suggestions:', error);
      throw error;
    }
  }

  static async getEncouragementMessage(achievement = 'general') {
    try {
      const response = await apiRequest('/api/chatbot/encouragement', {
        method: 'POST',
        body: JSON.stringify({
          achievement,
          type: 'motivational'
        }),
      });
      return response;
    } catch (error) {
      console.error('Error getting encouragement:', error);
      throw error;
    }
  }

  static formatResponseForSpecialNeeds(response, preferences = {}) {
    // Add visual cues and emojis to make responses more accessible
    let formattedResponse = response;
    
    if (preferences.includeEmojis) {
      // Add relevant emojis based on content
      formattedResponse = formattedResponse
        .replace(/good job/gi, '🎉 Good job! 🎉')
        .replace(/great/gi, '🌟 Great! 🌟')
        .replace(/well done/gi, '👏 Well done! 👏')
        .replace(/excellent/gi, '⭐ Excellent! ⭐')
        .replace(/try again/gi, '🔄 Try again! 🔄')
        .replace(/step 1/gi, '1️⃣ Step 1:')
        .replace(/step 2/gi, '2️⃣ Step 2:')
        .replace(/step 3/gi, '3️⃣ Step 3:')
        .replace(/question/gi, '❓ Question:')
        .replace(/answer/gi, '💡 Answer:')
        .replace(/help/gi, '🤝 Help:')
        .replace(/remember/gi, '🧠 Remember:')
        .replace(/important/gi, '⭐ Important:');
    }

    if (preferences.useSimpleLanguage) {
      // Simplify complex words
      formattedResponse = formattedResponse
        .replace(/difficult/gi, 'hard')
        .replace(/complicated/gi, 'tricky')
        .replace(/understand/gi, 'get')
        .replace(/comprehend/gi, 'get')
        .replace(/analyze/gi, 'look at')
        .replace(/examine/gi, 'check');
    }

    return formattedResponse;
  }

  static getQuickResponses() {
    return {
      greetings: [
        "👋 Hi there! How can I help you today?",
        "😊 Hello! What would you like to learn about?",
        "🌟 Hi! Ready to learn something new?",
        "🤗 Hey! I'm here to help you succeed!"
      ],
      encouragements: [
        "🎉 You're doing amazing! Keep it up!",
        "⭐ That's fantastic! I'm proud of you!",
        "👏 You're getting better every day!",
        "🌟 You're so smart! Great thinking!",
        "💪 You can do this! I believe in you!"
      ],
      helpOffers: [
        "🤝 Need help? I'm right here!",
        "💡 Want me to explain that differently?",
        "📚 Should I break this down into smaller steps?",
        "🎯 Would you like some hints to get started?",
        "🔍 Let's figure this out together!"
      ],
      breaks: [
        "⏰ Time for a quick break! You've been working hard!",
        "🍎 Let's take a rest and come back fresh!",
        "🌱 Remember to breathe and relax for a moment!",
        "💆‍♀️ You deserve a break! Great work so far!"
      ]
    };
  }

  static getAccessibilityFeatures() {
    return {
      voiceSettings: {
        speechRate: 0.8, // Slower for better understanding
        speechPitch: 1.0,
        language: 'en-US'
      },
      visualSettings: {
        highContrast: true,
        largeText: true,
        emojiSupport: true,
        colorCoding: true
      },
      interactionSettings: {
        autoRepeat: true,
        stepByStep: true,
        pauseBetweenSteps: 2000, // 2 seconds
        confirmationRequired: true
      }
    };
  }
}

export default GeminiChatbotService;
