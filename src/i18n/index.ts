import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import * as Localization from 'expo-localization'; // Would be installed as dependency

// Stub for expo-localization
const Localization = {
  locale: 'en-US',
  locales: ['en-US'],
  timezone: 'America/New_York',
  isoCurrencyCodes: ['USD'],
  region: 'US',
};

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      send: 'Send',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      
      // Navigation
      home: 'Home',
      messages: 'Messages',
      progress: 'Progress',
      calendar: 'Calendar',
      settings: 'Settings',
      
      // Parent Dashboard
      overview: 'Overview',
      children: 'Children',
      events: 'Events',
      reports: 'Reports',
      recentActivity: 'Recent Activity',
      progressSnapshot: 'Progress Snapshot',
      weeklyProgress: 'Weekly Progress',
      attendance: 'Attendance',
      attendanceRate: 'Attendance Rate',
      
      // Messages
      newMessage: 'New Message',
      messageTeacher: 'Message Teacher',
      sendMessage: 'Send Message',
      typeMessage: 'Type your message...',
      messageSent: 'Message sent successfully',
      messagePending: 'Message pending (offline)',
      noMessages: 'No messages yet',
      
      // Progress
      thisWeek: 'This Week',
      lastWeek: 'Last Week',
      average: 'Average',
      excellent: 'Excellent',
      good: 'Good',
      needsImprovement: 'Needs Improvement',
      
      // Notifications
      pushNotifications: 'Push Notifications',
      smsNotifications: 'SMS Notifications',
      voiceNotification: 'Voice Notification',
      playVoice: 'Play Voice',
      notificationSent: 'Notification sent',
      
      // Reminders
      upcomingEvents: 'Upcoming Events',
      noReminders: 'No upcoming reminders',
      dueToday: 'Due Today',
      dueTomorrow: 'Due Tomorrow',
      
      // Language
      language: 'Language',
      english: 'English',
      sinhala: 'සිංහල',
      tamil: 'தமிழ்',
    }
  },
  si: {
    translation: {
      // Common
      loading: 'පූරණය වෙමින්...',
      error: 'දෝෂය',
      success: 'සාර්ථකයි',
      cancel: 'අවලංගු කරන්න',
      save: 'සුරකින්න',
      send: 'යවන්න',
      back: 'ආපසු',
      next: 'ඊළඟ',
      done: 'අවසන්',
      
      // Navigation
      home: 'මුල් පිටුව',
      messages: 'පණිවිඩ',
      progress: 'ප්‍රගතිය',
      calendar: 'දිනදර්ශනය',
      settings: 'සැකසීම්',
      
      // Parent Dashboard
      overview: 'සාරාංශය',
      children: 'දරුවන්',
      events: 'සිදුවීම්',
      reports: 'වාර්තා',
      recentActivity: 'මෑත ක්‍රියාකාරකම්',
      progressSnapshot: 'ප්‍රගති සාරාංශය',
      weeklyProgress: 'සතිපතා ප්‍රගතිය',
      attendance: 'පැමිණීම',
      attendanceRate: 'පැමිණීමේ අනුපාතය',
      
      // Messages
      newMessage: 'නව පණිවිඩය',
      messageTeacher: 'ගුරුවරයාට පණිවිඩය',
      sendMessage: 'පණිවිඩය යවන්න',
      typeMessage: 'ඔබේ පණිවිඩය ටයිප් කරන්න...',
      messageSent: 'පණිවිඩය සාර්ථකව යවන ලදී',
      messagePending: 'පණිවිඩය අපේක්ෂාවේ (නොබැඳි)',
      noMessages: 'තවම පණිවිඩ නැත',
      
      // Progress
      thisWeek: 'මෙම සතියේ',
      lastWeek: 'පසුගිය සතියේ',
      average: 'සාමාන්‍ය',
      excellent: 'විශිෂ්ට',
      good: 'හොඳ',
      needsImprovement: 'වැඩිදියුණු කිරීම අවශ්‍ය',
      
      // Notifications
      pushNotifications: 'තල්ලු දැනුම්දීම්',
      smsNotifications: 'SMS දැනුම්දීම්',
      voiceNotification: 'හඬ දැනුම්දීම',
      playVoice: 'හඬ වාදනය කරන්න',
      notificationSent: 'දැනුම්දීම යවන ලදී',
      
      // Reminders
      upcomingEvents: 'ඉදිරි සිදුවීම්',
      noReminders: 'ඉදිරි මතක්කිරීම් නැත',
      dueToday: 'අද නිමකිරීමට',
      dueTomorrow: 'හෙට නිමකිරීමට',
      
      // Language
      language: 'භාෂාව',
      english: 'English',
      sinhala: 'සිංහල',
      tamil: 'தமிழ்',
    }
  },
  ta: {
    translation: {
      // Common
      loading: 'ஏற்றுகிறது...',
      error: 'பிழை',
      success: 'வெற்றி',
      cancel: 'ரத்து செய்',
      save: 'சேமி',
      send: 'அனுப்பு',
      back: 'பின்',
      next: 'அடுத்து',
      done: 'முடிந்தது',
      
      // Navigation
      home: 'முகப்பு',
      messages: 'செய்திகள்',
      progress: 'முன்னேற்றம்',
      calendar: 'நாட்காட்டி',
      settings: 'அமைப்புகள்',
      
      // Parent Dashboard
      overview: 'கண்ணோட்டம்',
      children: 'குழந்தைகள்',
      events: 'நிகழ்வுகள்',
      reports: 'அறிக்கைகள்',
      recentActivity: 'சமீபத்திய செயல்பாடு',
      progressSnapshot: 'முன்னேற்ற சுருக்கம்',
      weeklyProgress: 'வாராந்திர முன்னேற்றம்',
      attendance: 'வருகை',
      attendanceRate: 'வருகை விகிதம்',
      
      // Messages
      newMessage: 'புதிய செய்தி',
      messageTeacher: 'ஆசிரியருக்கு செய்தி',
      sendMessage: 'செய்தி அனுப்பு',
      typeMessage: 'உங்கள் செய்தியை தட்டச்சு செய்யுங்கள்...',
      messageSent: 'செய்தி வெற்றிகரமாக அனுப்பப்பட்டது',
      messagePending: 'செய்தி நிலுவையில் (ஆஃப்லைன்)',
      noMessages: 'இன்னும் செய்திகள் இல்லை',
      
      // Progress
      thisWeek: 'இந்த வாரம்',
      lastWeek: 'கடந்த வாரம்',
      average: 'சராசரி',
      excellent: 'சிறந்த',
      good: 'நல்ல',
      needsImprovement: 'முன்னேற்றம் தேவை',
      
      // Notifications
      pushNotifications: 'புஷ் அறிவிப்புகள்',
      smsNotifications: 'SMS அறிவிப்புகள்',
      voiceNotification: 'குரல் அறிவிப்பு',
      playVoice: 'குரலை இயக்கு',
      notificationSent: 'அறிவிப்பு அனுப்பப்பட்டது',
      
      // Reminders
      upcomingEvents: 'வரவிருக்கும் நிகழ்வுகள்',
      noReminders: 'வரவிருக்கும் நினைவூட்டல்கள் இல்லை',
      dueToday: 'இன்று முடிக்க வேண்டும்',
      dueTomorrow: 'நாளை முடிக்க வேண்டும்',
      
      // Language
      language: 'மொழி',
      english: 'English',
      sinhala: 'සිංහල',
      tamil: 'தமிழ்',
    }
  }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.locale.split('-')[0] || 'en', // Default to device locale or English
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

export default i18n;
