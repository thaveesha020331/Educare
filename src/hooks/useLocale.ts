import { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next'; // Would be installed as dependency
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Would be installed as dependency

// Minimal in-app translations (stub) that actually switch by language
const TRANSLATIONS = {
  en: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      send: 'Send',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      home: 'Home',
      messages: 'Messages',
      progress: 'Progress',
      calendar: 'Calendar',
      settings: 'Settings',
      overview: 'Overview',
      children: 'Children',
      events: 'Events',
      reports: 'Reports',
      recentActivity: 'Recent Activity',
      progressSnapshot: 'Progress Snapshot',
      weeklyProgress: 'Weekly Progress',
      attendance: 'Attendance',
      attendanceRate: 'Attendance Rate',
      newMessage: 'New Message',
      messageTeacher: 'Message Teacher',
      sendMessage: 'Send Message',
      typeMessage: 'Type your message...',
      messageSent: 'Message sent successfully',
      messagePending: 'Message pending (offline)',
      noMessages: 'No messages yet',
      thisWeek: 'This Week',
      lastWeek: 'Last Week',
      average: 'Average',
      excellent: 'Excellent',
      good: 'Good',
      needsImprovement: 'Needs Improvement',
      pushNotifications: 'Push Notifications',
      smsNotifications: 'SMS Notifications',
      voiceNotification: 'Voice Notification',
      playVoice: 'Play Voice',
      upcomingEvents: 'Upcoming Events',
      noReminders: 'No upcoming reminders',
      dueToday: 'Due Today',
      dueTomorrow: 'Due Tomorrow',
      language: 'Language',
      english: 'English',
      sinhala: 'සිංහල',
      tamil: 'தமிழ்',
      search: 'Search',
    // Additional UI
    getStarted: 'Get Started',
    next: 'Next',
    skip: 'Skip',
    welcomeBack: 'Welcome Back',
    join: 'Join EduCare',
    createAccount: 'Create Account',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    calendarHeader: 'Calendar',
    upcomingReminders: 'Upcoming events and reminders',
    eventsFor: 'Events for',
    noEvents: 'No events scheduled',
    tapToAdd: 'Tap + to add an event',
    upcomingThisWeek: 'Upcoming This Week',
    addNewEvent: 'Add New Event',
    eventTitle: 'Event Title',
    descriptionOptional: 'Description (Optional)',
    time: 'Time',
    saveEvent: 'Save Event',
    cancel: 'Cancel',
    people: 'People',
    connectCommunity: 'Connect with your community',
    searchPeople: 'Search people, roles, subjects...',
    peopleFound: 'People Found',
    allRoles: 'All roles',
    noPeopleFound: 'No people found',
    adjustSearch: 'Try adjusting your search or filter criteria',
    profile: 'Profile',
    sendMessage: 'Send Message',
    voiceCall: 'Voice Call',
    quizzes: 'Quizzes',
    refresh: 'Refresh',
    viewAll: 'View All',
    quickActions: 'Quick Actions',
    guidedLesson: 'Guided Lesson',
    prev: 'Previous',
    back: 'Back',
    viewDetails: 'View Details',
    childSchedule: "Children's Schedule",
    grades: 'Grades',
    createLesson: 'Create Lesson',
    createQuiz: 'Create Quiz',
  },
  si: {
    loading: 'පූරණය වෙමින්...',
    error: 'දෝෂයක්',
    success: 'සාර්ථකයි',
    cancel: 'අවලංගු කරන්න',
    save: 'සුරකින්න',
    send: 'යවන්න',
    back: 'ආපසු',
    next: 'ඊළඟ',
    done: 'අවසන්',
    home: 'මුල් පිටුව',
    messages: 'පණිවිඩ',
    progress: 'ප්‍රගති',
    calendar: 'දින දර්ශනය',
    settings: 'සැකසීම්',
    overview: 'සමාක්ෂේපය',
    children: 'ළමුන්',
    events: 'සිදූලි',
    reports: 'වාර්තා',
    recentActivity: 'මෑත ක්‍රියාකාරකම්',
    progressSnapshot: 'ප්‍රගති සාරාංශය',
    weeklyProgress: 'සතිපතා ප්‍රගතිය',
    attendance: 'පැමිණීම',
    attendanceRate: 'පැමිණීමේ අනුපාතය',
    newMessage: 'නව පණිවිඩය',
    messageTeacher: 'ගුරුවරයාට පණිවිඩය',
    sendMessage: 'පණිවිඩය යවන්න',
    typeMessage: 'ඔබගේ පණිවිඩය ටයිප් කරන්න...',
    messageSent: 'පණිවිඩය සාර්ථකව යවා ඇත',
    messagePending: 'පණිවිඩය පොරොත්තු (නොබැඳි)',
    noMessages: 'පණිවිඩ නැත',
    thisWeek: 'මේ සතිය',
    lastWeek: 'පසුගිය සතිය',
    average: 'සාමාන්‍ය',
    excellent: 'අතිවිශිෂ්ට',
    good: 'හොඳ',
    needsImprovement: 'වැඩිදියුණු විය යුතුය',
    pushNotifications: 'ප්‍රවේශන දැනුම්දීම්',
    smsNotifications: 'කෙටිපණිවිඩ දැනුම්දීම්',
    voiceNotification: 'ශබ්ද දැනුම්දීම',
    playVoice: 'ශබ්දය ධාවනය',
    upcomingEvents: 'ඉදිරි සිදූලි',
    noReminders: 'ඉදිරි මතක් කිරීම් නැත',
    dueToday: 'අදට',
    dueTomorrow: 'හෙටට',
    language: 'භාෂාව',
    english: 'English',
    sinhala: 'සිංහල',
    tamil: 'தமிழ்',
    search: 'සෙවීම',
    getStarted: 'ආරම්භ කරන්න',
    next: 'ඊළඟ',
    skip: 'මඟහරින්න',
    welcomeBack: 'පසුගිය වරට හමුවූවාට ආයුබෝවන්',
    join: 'EduCareට එක්වන්න',
    createAccount: 'ගිණුම සෑදීම',
    signIn: 'පිවිසෙන්න',
    signUp: 'ලියාපදිංචි වන්න',
    calendarHeader: 'දින දර්ශනය',
    upcomingReminders: 'ඉදිරි සිදූලි සහ මතක් කිරීම්',
    eventsFor: 'සිදූලි',
    noEvents: 'සිදූලි නොමැත',
    tapToAdd: '+ ඔබා එකතු කරන්න',
    upcomingThisWeek: 'මෙම සතියේ එන සිදූලි',
    addNewEvent: 'නව සිදුවීමක් එකතු කරන්න',
    eventTitle: 'සිදුවීමේ මාතෘකාව',
    descriptionOptional: 'විස්තර (විකල්පය)',
    time: 'වේලාව',
    saveEvent: 'සිදුවීම සුරකින්න',
    cancel: 'අවලංගු කරන්න',
    people: 'පුද්ගලයින්',
    connectCommunity: 'ඔබගේ ප්රජාව සමඟ සම්බන්ධ වන්න',
    searchPeople: 'පුද්ගලයන්, තනතුරු, විෂයන් සොයන්න...',
    peopleFound: 'සොයාගත් පුද්ගලයින්',
    allRoles: 'සියලුම භූමිකාවන්',
    noPeopleFound: 'පුද්ගලයන් හමු නොවීය',
    adjustSearch: 'ඔබගේ සෙවුම හෝ පෙරහන් වෙනස් කර බලන්න',
    profile: 'පැතිකඩ',
    sendMessage: 'පණිවිඩය යවන්න',
    voiceCall: 'කථා කෙරීම්',
    quizzes: 'ප්‍රශ්නෝත්තර',
    refresh: 'නවතම',
    viewAll: 'සියල්ල බලන්න',
    quickActions: 'ක්ෂණික ක්‍රියා',
    guidedLesson: 'මඟපෙන්වූ පාඩම',
    prev: 'පෙර',
    back: 'ආපසු',
    viewDetails: 'විස්තර බලන්න',
    childSchedule: 'ළමා කාලසටහන',
    grades: 'ප්‍රමාණාත්මක ලකුණු',
    createLesson: 'පාඩම සෑදීම',
    createQuiz: 'ප්‍රශ්නෝත්තර සෑදීම',
  },
  ta: {
    loading: 'ஏற்றப்படுகிறது...',
    error: 'பிழை',
    success: 'வெற்றி',
    cancel: 'ரத்து',
    save: 'சேமிக்க',
    send: 'அனுப்பு',
    back: 'பின்',
    next: 'அடுத்து',
    done: 'முடிந்தது',
    home: 'முகப்பு',
    messages: 'செய்திகள்',
    progress: 'முன்னேற்றம்',
    calendar: 'நாள்காட்டி',
    settings: 'அமைப்புகள்',
    overview: 'மேலோட்டம்',
    children: 'குழந்தைகள்',
    events: 'நிகழ்வுகள்',
    reports: 'அறிக்கைகள்',
    recentActivity: 'சமீபத்திய செயல்கள்',
    progressSnapshot: 'முன்னேற்ற சுருக்கம்',
    weeklyProgress: 'வாராந்திர முன்னேற்றம்',
    attendance: 'வருகை',
    attendanceRate: 'வருகை விகிதம்',
    newMessage: 'புதிய செய்தி',
    messageTeacher: 'ஆசிரியருக்கு செய்தி',
    sendMessage: 'செய்தி அனுப்பவும்',
    typeMessage: 'உங்கள் செய்தியை type செய்யவும்...',
    messageSent: 'செய்தி வெற்றிகரமாக அனுப்பப்பட்டது',
    messagePending: 'செய்தி நிலுவையில் (ஆஃப்லைன்)',
    noMessages: 'இன்னும் செய்திகள் இல்லை',
    thisWeek: 'இந்த வாரம்',
    lastWeek: 'கடந்த வாரம்',
    average: 'சராசரி',
    excellent: 'மிகச் சிறப்பு',
    good: 'நன்று',
    needsImprovement: 'மேம்படுத்த வேண்டும்',
    pushNotifications: 'புஷ் அறிவிப்புகள்',
    smsNotifications: 'எஸ்எம்எஸ் அறிவிப்புகள்',
    voiceNotification: 'குரல் அறிவிப்பு',
    playVoice: 'குரல் இயக்கு',
    upcomingEvents: 'வரவிருக்கும் நிகழ்வுகள்',
    noReminders: 'நினைவூட்டல்கள் இல்லை',
    dueToday: 'இன்று',
    dueTomorrow: 'நாளை',
    language: 'மொழி',
    english: 'English',
    sinhala: 'සිංහල',
    tamil: 'தமிழ்',
    search: 'தேடல்',
    getStarted: 'தொடங்கவும்',
    next: 'அடுத்து',
    skip: 'தவிர்க்க',
    welcomeBack: 'மீண்டும் வரவேற்கிறோம்',
    join: 'EduCare-இல் சேரவும்',
    createAccount: 'கணக்கு உருவாக்கவும்',
    signIn: 'உள்நுழைக',
    signUp: 'பதிவுபெற',
    calendarHeader: 'நாள்காட்டி',
    upcomingReminders: 'வரவிருக்கும் நிகழ்வுகள் மற்றும் நினைவூட்டல்கள்',
    eventsFor: 'நிகழ்வுகள்',
    noEvents: 'நிகழ்வுகள் இல்லை',
    tapToAdd: '+ அழுத்தி நிகழ்வு சேர்க்கவும்',
    upcomingThisWeek: 'இந்த வாரம் வரவிருப்பவை',
    addNewEvent: 'புதிய நிகழ்வு சேர்க்க',
    eventTitle: 'நிகழ்வு தலைப்பு',
    descriptionOptional: 'விளக்கம் (விருப்பம்)',
    time: 'நேரம்',
    saveEvent: 'நிகழ்வை சேமிக்க',
    cancel: 'ரத்து',
    people: 'மக்கள்',
    connectCommunity: 'உங்கள் சமூகத்துடன் இணைக',
    searchPeople: 'மக்கள், பங்குகள், பாடங்கள் தேடுக...',
    peopleFound: 'மக்கள் கிடைத்தனர்',
    allRoles: 'அனைத்து பங்குகள்',
    noPeopleFound: 'மக்கள் எவரும் இல்லை',
    adjustSearch: 'தேடலை அல்லது வடிகட்டியை மாற்றி முயற்சி செய்க',
    profile: 'சுயவிவரம்',
    sendMessage: 'செய்தி அனுப்பு',
    voiceCall: 'குரல் அழைப்பு',
    quizzes: 'வினாடி வினா',
    refresh: 'புதுப்பி',
    viewAll: 'அனைத்தையும் பார்க்க',
    quickActions: 'விரைவு செயல்கள்',
    guidedLesson: 'வழிகாட்டும் பாடம்',
    prev: 'முந்தைய',
    back: 'பின்',
    viewDetails: 'விவரங்களை காண்க',
    childSchedule: 'குழந்தைகளின் அட்டவணை',
    grades: 'மதிப்பெண்கள்',
    createLesson: 'பாடம் உருவாக்கு',
    createQuiz: 'வினாடிவினா உருவாக்கு',
  },
} as const;

// Stub AsyncStorage implementation
const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    console.log(`AsyncStorage.getItem: ${key}`);
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    console.log(`AsyncStorage.setItem: ${key} = ${value}`);
  },
};

export type SupportedLanguage = 'en' | 'si' | 'ta';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'si',
    name: 'Sinhala',
    nativeName: 'සිංහල',
    flag: '🇱🇰',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇱🇰',
  },
];

const STORAGE_KEY = 'user_language';

export const useLocale = () => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage && isSupportedLanguage(savedLanguage)) {
        await changeLanguage(savedLanguage as SupportedLanguage, false);
      } else {
        // Default to English if no saved language
        setCurrentLanguage('en');
      }
    } catch (error) {
      console.error('Failed to load saved language:', error);
      setCurrentLanguage('en');
    } finally {
      setIsLoading(false);
    }
  };

  const isSupportedLanguage = (lang: string): boolean => {
    return SUPPORTED_LANGUAGES.some(l => l.code === lang);
  };

  const changeLanguage = async (language: SupportedLanguage, persist: boolean = true) => {
    try {
      setIsLoading(true);
      
      // Update state
      setCurrentLanguage(language);
      
      // Persist to storage if requested
      if (persist) {
        await AsyncStorage.setItem(STORAGE_KEY, language);
      }
      
      console.log(`Language changed to: ${language}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLanguageInfo = (): LanguageOption => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  };

  const getLanguageDirection = (): 'ltr' | 'rtl' => {
    // All supported languages use left-to-right direction
    // Add RTL support here if needed for Arabic, Hebrew, etc.
    return 'ltr';
  };

  const formatNumber = (number: number): string => {
    // Format numbers according to locale
    try {
      return new Intl.NumberFormat(getLocaleCode()).format(number);
    } catch (error) {
      return number.toString();
    }
  };

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    // Format dates according to locale
    try {
      return new Intl.DateTimeFormat(getLocaleCode(), options).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  };

  const getLocaleCode = (): string => {
    switch (currentLanguage) {
      case 'si':
        return 'si-LK';
      case 'ta':
        return 'ta-LK';
      default:
        return 'en-US';
    }
  };

  const isRTL = getLanguageDirection() === 'rtl';

  const translate = (key: string): string => {
    const pack = (TRANSLATIONS as any)[currentLanguage] || (TRANSLATIONS as any).en;
    return pack[key] || (TRANSLATIONS as any).en[key] || key;
  };

  return {
    // Current language info
    currentLanguage,
    currentLanguageInfo: getCurrentLanguageInfo(),
    supportedLanguages: SUPPORTED_LANGUAGES,
    
    // Language switching
    changeLanguage,
    isLoading,
    
    // Utilities
    t: translate,
    formatNumber,
    formatDate,
    getLocaleCode,
    isRTL,
    
    // Convenience methods
    isEnglish: currentLanguage === 'en',
    isSinhala: currentLanguage === 'si',
    isTamil: currentLanguage === 'ta',
  };
};

export default useLocale;
