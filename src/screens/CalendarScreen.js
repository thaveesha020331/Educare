import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { colors, spacing, typography, dimensions, commonStyles } from '../styles/theme';
import { useLocale } from '../hooks/useLocale';
import { useAccessibility } from '../hooks/useAccessibility';
import DateTimePicker from '@react-native-community/datetimepicker';
import CalendarService from '../services/calendar';

const CalendarScreen = ({ userData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const { t } = useLocale();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState({});
  const [allEvents, setAllEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: new Date(),
    type: 'lesson',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    priority: 'medium',
    location: ''
  });

  const { 
    settings: accessibilitySettings, 
    triggerHaptic, 
    speak, 
    announce, 
    getAccessibilityProps,
    getScaledFontSize 
  } = useAccessibility();

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Load events from last month
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2); // Load events for next 2 months

      let response;
      if (userData?.role === 'student') {
        // For students, get their own events
        response = await CalendarService.getEventsByRange(startDate, endDate);
      } else if (userData?.role === 'parent') {
        // For parents, get events for their children
        // This would need to be implemented based on parent-child relationship
        response = await CalendarService.getEventsByRange(startDate, endDate);
      } else {
        // For teachers, get their own events
        response = await CalendarService.getEventsByRange(startDate, endDate);
      }

      if (response.events) {
        setAllEvents(response.events);
        // Group events by date
        const groupedEvents = {};
        response.events.forEach(event => {
          const eventDate = new Date(event.date).toISOString().split('T')[0];
          if (!groupedEvents[eventDate]) {
            groupedEvents[eventDate] = [];
          }
          groupedEvents[eventDate].push({
            id: event._id,
            title: event.title,
            time: event.startTime || 'All Day',
            type: event.type,
            description: event.description,
            priority: event.priority,
            location: event.location
          });
        });
        setEvents(groupedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markedDates = {
    ...Object.keys(events).reduce((acc, date) => {
      acc[date] = {
        marked: true,
        dotColor: getEventColor(events[date][0].type),
        selected: date === selectedDate,
        selectedColor: colors.primary
      };
      return acc;
    }, {}),
    [selectedDate]: {
      selected: true,
      selectedColor: colors.primary,
      marked: events[selectedDate]?.length > 0,
      dotColor: events[selectedDate]?.[0] ? getEventColor(events[selectedDate][0].type) : colors.primary
    }
  };

  function getEventColor(type) {
    switch (type) {
      case 'lesson': return colors.primary;
      case 'assignment': return colors.parent;
      case 'deadline': return colors.accent;
      case 'exam': return '#dc2626';
      case 'meeting': return '#8b5cf6';
      case 'event': return '#06b6d4';
      case 'reminder': return '#f97316';
      default: return colors.primary;
    }
  }

  function getEventEmoji(type) {
    switch (type) {
      case 'lesson': return '📚';
      case 'assignment': return '📝';
      case 'deadline': return '⏰';
      case 'exam': return '📝';
      case 'meeting': return '👥';
      case 'event': return '🎉';
      case 'reminder': return '🔔';
      default: return '📅';
    }
  }

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    try {
      setLoading(true);
      
      // Get user ID from stored user data
      const { AuthService } = await import('../services/auth');
      const token = await AuthService.getStoredToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      // Get user data from AsyncStorage
      const storedUserData = await AuthService.getStoredUserData();
      const userId = storedUserData?.id || userData?.id;

      if (!userId) {
        Alert.alert('Error', 'User ID not found. Please login again.');
        return;
      }

      // Validate and convert date to proper ISO8601 format
      let eventDate;
      try {
        // Handle different date formats
        if (newEvent.date instanceof Date) {
          eventDate = new Date(newEvent.date);
        } else if (typeof newEvent.date === 'string') {
          eventDate = new Date(newEvent.date);
        } else {
          throw new Error('Invalid date format');
        }

        // Check if date is valid
        if (isNaN(eventDate.getTime())) {
          throw new Error('Invalid date value');
        }

        // Set time if provided
        if (newEvent.startTime) {
          const [hours, minutes] = newEvent.startTime.split(':');
          if (hours && minutes) {
            eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          }
        }
      } catch (dateError) {
        console.error('Date parsing error:', dateError);
        Alert.alert('Error', 'Invalid date format. Please select a valid date.');
        return;
      }

      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description?.trim() || '',
        date: eventDate.toISOString(),
        startTime: newEvent.startTime || null,
        endTime: newEvent.endTime || null,
        type: newEvent.type || 'event',
        priority: newEvent.priority || 'medium',
        location: newEvent.location?.trim() || '',
        userId: userId
      };

      console.log('Creating event with data:', eventData);
      const response = await CalendarService.createEvent(eventData);
      console.log('Event creation response:', response);
      
      if (response.event) {
        // Add the new event to local state
        const eventDate = new Date(eventData.date).toISOString().split('T')[0];
        const newEventObj = {
          id: response.event.id,
          title: response.event.title,
          time: response.event.startTime || 'All Day',
          type: response.event.type,
          description: response.event.description,
          priority: response.event.priority,
          location: response.event.location
        };

        setEvents(prev => ({
          ...prev,
          [eventDate]: [...(prev[eventDate] || []), newEventObj]
        }));

        setNewEvent({
          title: '',
          time: new Date(),
          type: 'lesson',
          description: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
          priority: 'medium',
          location: ''
        });
        setShowAddEventModal(false);
        Alert.alert('Success', 'Event created successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEvent = (event) => (
    <View key={event.id} style={styles.eventItem}>
      <View style={[styles.eventIcon, { backgroundColor: getEventColor(event.type) }]}>
        <Text style={styles.eventEmoji}>
          {getEventEmoji(event.type)}
        </Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventTime}>{event.time}</Text>
        {event.description ? (
          <Text style={styles.eventDescription}>{event.description}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.eventAction}>
        <Text style={styles.eventActionText}>⋯</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>{t('calendarHeader')}</Text>
            <Text style={styles.headerSubtitle}>{t('upcomingReminders')}</Text>
            
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={async () => {
              await triggerHaptic('medium');
              await speak('Opening add event modal');
              setNewEvent(prev => ({ ...prev, date: selectedDate }));
              setShowAddEventModal(true);
            }}
            accessibilityLabel="Add new event"
            accessibilityRole="button"
            accessibilityHint="Double tap to create a new event"
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Calendar Section */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.text,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.surface,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textSecondary,
              dotColor: colors.primary,
              selectedDotColor: colors.surface,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14
            }}
            style={styles.calendar}
          />
        </View>

        {/* Events for Selected Date */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('eventsFor')} {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <Text style={styles.eventsCount}>
              {events[selectedDate]?.length || 0} events
            </Text>
          </View>

          <View style={styles.eventsContainer}>
            {events[selectedDate]?.length > 0 ? (
              events[selectedDate].map(renderEvent)
            ) : (
              <View style={styles.noEvents}>
                <Text style={styles.noEventsText}>{t('noEvents')}</Text>
                <Text style={styles.noEventsSubtext}>{t('tapToAdd')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('upcomingThisWeek')} 📅</Text>
            <Text style={styles.eventsCount}>
              {Object.entries(events).filter(([date]) => new Date(date) > new Date()).length} upcoming
            </Text>
          </View>
          <Text style={styles.scrollHint}>← Swipe to see more upcoming events →</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.upcomingScroll}
            contentContainerStyle={styles.upcomingScrollContent}
            decelerationRate="fast"
            snapToInterval={170} // Snap to each card (150px width + 20px margin)
            snapToAlignment="start"
            contentInsetAdjustmentBehavior="automatic"
          >
            {Object.entries(events)
              .filter(([date]) => new Date(date) > new Date())
              .slice(0, 7)
              .map(([date, dayEvents]) => (
                <TouchableOpacity 
                  key={date} 
                  style={styles.upcomingCard}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={styles.upcomingDate}>
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.upcomingDay}>
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <View style={styles.upcomingEvents}>
                    {dayEvents.slice(0, 3).map(event => (
                      <View key={event.id} style={styles.upcomingEvent}>
                        <View style={[styles.upcomingDot, { backgroundColor: getEventColor(event.type) }]} />
                        <Text style={styles.upcomingEventTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </View>
                    ))}
                    {dayEvents.length > 3 && (
                      <Text style={styles.moreEventsText}>+{dayEvents.length - 3} more</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAddEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('addNewEvent')}</Text>
            
            <TextInput
              style={styles.input}
              placeholder={t('eventTitle')}
              value={newEvent.title}
              onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('descriptionOptional')}
              value={newEvent.description}
              onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Start Time (HH:MM)"
              value={newEvent.startTime}
              onChangeText={(text) => setNewEvent(prev => ({ ...prev, startTime: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="End Time (HH:MM) - Optional"
              value={newEvent.endTime}
              onChangeText={(text) => setNewEvent(prev => ({ ...prev, endTime: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Location - Optional"
              value={newEvent.location}
              onChangeText={(text) => setNewEvent(prev => ({ ...prev, location: text }))}
            />

            <View style={styles.typeSelector}>
              {['lesson', 'assignment', 'deadline', 'exam', 'meeting', 'event', 'reminder'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newEvent.type === type && styles.typeButtonSelected
                  ]}
                  onPress={() => setNewEvent(prev => ({ ...prev, type }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newEvent.type === type && styles.typeButtonTextSelected
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.prioritySelector}>
              <Text style={styles.selectorLabel}>Priority:</Text>
              {['low', 'medium', 'high'].map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    newEvent.priority === priority && styles.priorityButtonSelected
                  ]}
                  onPress={() => setNewEvent(prev => ({ ...prev, priority }))}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    newEvent.priority === priority && styles.priorityButtonTextSelected
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddEventModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddEvent}
              >
                <Text style={styles.saveButtonText}>{t('saveEvent')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.surface,
    marginBottom: 0,
    marginTop: spacing.sm + 4,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.surface,
    opacity: 0.9,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm + 4,
  },
  addButtonText: {
    fontSize: 24,
    color: colors.surface,
    fontWeight: '300',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl + 60, // Extra padding to ensure content is visible above tab bar
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.md,
    ...commonStyles.shadow,
  },
  calendar: {
    borderRadius: 12,
  },
  eventsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  eventsCount: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  eventsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    ...commonStyles.shadow,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventEmoji: {
    fontSize: 24,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  eventTime: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  eventDescription: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  eventAction: {
    padding: spacing.sm,
  },
  eventActionText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noEventsText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  noEventsSubtext: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    opacity: 0.7,
  },
  upcomingScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    height: 140, // Fixed height to ensure consistent scrolling
  },
  upcomingScrollContent: {
    paddingRight: spacing.lg, // Extra padding at the end for better scrolling
  },
  upcomingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    width: 150, // Slightly wider for better content visibility
    minHeight: 120, // Ensure consistent card height
    ...commonStyles.shadow,
  },
  upcomingDate: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  upcomingDay: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  upcomingEvents: {
    gap: spacing.xs,
  },
  upcomingEvent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  upcomingEventTitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    flex: 1,
  },
  moreEventsText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  scrollHint: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timePickerButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePickerText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
  },
  typeButtonTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
  prioritySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  selectorLabel: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginRight: spacing.sm,
    fontWeight: '600',
  },
  priorityButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  priorityButtonSelected: {
    backgroundColor: colors.primary,
  },
  priorityButtonText: {
    fontSize: typography.caption.fontSize,
    color: colors.text,
    fontWeight: '600',
  },
  priorityButtonTextSelected: {
    color: colors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
});

export default CalendarScreen;