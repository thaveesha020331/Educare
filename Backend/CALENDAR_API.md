# EduCare Calendar System

## Overview
A comprehensive calendar system with reminders, deadlines, and notifications for the EduCare educational platform.

## Features
- ✅ **Event Management**: Create, read, update, delete calendar events
- ✅ **Reminder System**: Automatic notifications for upcoming events
- ✅ **Multiple Event Types**: Lessons, assignments, exams, meetings, events, deadlines
- ✅ **Priority Levels**: Low, medium, high priority events
- ✅ **Recurring Events**: Support for recurring patterns
- ✅ **Location Support**: Add location information to events
- ✅ **Time-based Notifications**: Reminders before events start
- ✅ **Database Storage**: Persistent storage in MongoDB
- ✅ **User-specific**: Each user has their own calendar

## Database Schema

### Events Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to user
  title: String,
  description: String,
  date: Date,
  startTime: String, // Format: "HH:MM"
  endTime: String, // Format: "HH:MM"
  type: String, // 'lesson', 'assignment', 'exam', 'meeting', 'event', 'deadline', 'reminder'
  priority: String, // 'low', 'medium', 'high'
  location: String,
  isRecurring: Boolean,
  recurringPattern: String, // 'daily', 'weekly', 'monthly'
  reminderTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Reminders Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to user
  eventId: ObjectId, // Reference to event
  reminderTime: Date,
  type: String, // 'push', 'email', 'sms'
  message: String,
  isSent: Boolean,
  sentAt: Date,
  createdAt: Date
}
```

## API Endpoints

### Calendar Events

#### 1. Get All Events
```
GET /api/calendar/events
Authorization: Bearer <jwt_token>
Query Parameters:
  - startDate (optional): Filter events from this date
  - endDate (optional): Filter events until this date
  - type (optional): Filter by event type
```

**Response:**
```json
{
  "events": [
    {
      "_id": "68eb3d6f17b2f210b7473715",
      "userId": "68eb37c3a25304617d58e925",
      "title": "Math Lesson",
      "description": "Algebra basics",
      "date": "2025-10-15T10:00:00.000Z",
      "startTime": "10:00",
      "endTime": "11:00",
      "type": "lesson",
      "priority": "high",
      "location": "Room 301",
      "isRecurring": false,
      "recurringPattern": null,
      "reminderTime": "2025-10-15T09:30:00.000Z",
      "createdAt": "2025-10-12T05:32:31.000Z",
      "updatedAt": "2025-10-12T05:32:31.000Z"
    }
  ]
}
```

#### 2. Create Event
```
POST /api/calendar/events
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Math Lesson",
  "description": "Algebra basics",
  "date": "2025-10-15T10:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "type": "lesson",
  "priority": "high",
  "location": "Room 301",
  "isRecurring": false,
  "recurringPattern": null,
  "reminderTime": "2025-10-15T09:30:00.000Z"
}
```

**Response:**
```json
{
  "message": "Event created successfully",
  "event": {
    "id": "68eb3d6f17b2f210b7473715",
    "userId": "68eb37c3a25304617d58e925",
    "title": "Math Lesson",
    "description": "Algebra basics",
    "date": "2025-10-15T10:00:00.000Z",
    "startTime": "10:00",
    "endTime": "11:00",
    "type": "lesson",
    "priority": "high",
    "location": "Room 301",
    "isRecurring": false,
    "recurringPattern": null,
    "reminderTime": "2025-10-15T09:30:00.000Z",
    "createdAt": "2025-10-12T05:32:31.000Z",
    "updatedAt": "2025-10-12T05:32:31.000Z"
  }
}
```

#### 3. Update Event
```
PUT /api/calendar/events/:eventId
Authorization: Bearer <jwt_token>
```

#### 4. Delete Event
```
DELETE /api/calendar/events/:eventId
Authorization: Bearer <jwt_token>
```

#### 5. Get Events by Date Range
```
GET /api/calendar/events/range?startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer <jwt_token>
```

### Reminders

#### 1. Get Upcoming Reminders
```
GET /api/calendar/reminders
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "reminders": [
    {
      "_id": "68eb3d6f17b2f210b7473716",
      "userId": "68eb37c3a25304617d58e925",
      "eventId": "68eb3d6f17b2f210b7473715",
      "reminderTime": "2025-10-15T09:30:00.000Z",
      "type": "push",
      "message": "Reminder: Math Lesson",
      "isSent": false,
      "createdAt": "2025-10-12T05:32:31.000Z",
      "event": {
        "_id": "68eb3d6f17b2f210b7473715",
        "title": "Math Lesson",
        "description": "Algebra basics",
        "date": "2025-10-15T10:00:00.000Z",
        "startTime": "10:00",
        "endTime": "11:00",
        "type": "lesson",
        "priority": "high",
        "location": "Room 301"
      }
    }
  ]
}
```

#### 2. Mark Reminder as Sent
```
PUT /api/calendar/reminders/:reminderId/sent
Authorization: Bearer <jwt_token>
```

## Frontend Services

### CalendarService
Located in `src/services/calendar.js`

**Key Methods:**
- `getEvents(filters)` - Get events with optional filters
- `getEventsByRange(startDate, endDate)` - Get events in date range
- `createEvent(eventData)` - Create new event
- `updateEvent(eventId, eventData)` - Update existing event
- `deleteEvent(eventId)` - Delete event
- `getUpcomingReminders()` - Get upcoming reminders
- `validateEventData(eventData)` - Validate event data
- `formatEventData(eventData)` - Format data for API

### NotificationService
Located in `src/services/notificationService.js`

**Key Methods:**
- `checkUpcomingReminders()` - Check and show reminder notifications
- `showReminderNotification(reminder)` - Show reminder alert
- `getTodaysEvents()` - Get today's events
- `getThisWeeksEvents()` - Get this week's events
- `checkEventsStartingSoon()` - Check events starting within 30 minutes
- `startReminderChecker()` - Start periodic reminder checking
- `getNotificationBadgeCount()` - Get unread notification count

## Event Types and Colors

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| lesson | 📚 | #3b82f6 | Teaching sessions |
| assignment | 📝 | #f59e0b | Homework assignments |
| exam | 📋 | #ef4444 | Tests and examinations |
| meeting | 👥 | #10b981 | Meetings and conferences |
| event | 🎉 | #8b5cf6 | Special events |
| deadline | ⏰ | #dc2626 | Important deadlines |
| reminder | 🔔 | #6b7280 | General reminders |

## Priority Levels

| Priority | Description |
|----------|-------------|
| low | Non-urgent events |
| medium | Normal priority events |
| high | Important/urgent events |

## Usage Examples

### Creating an Event
```javascript
import { CalendarService } from '../services/calendar';

const eventData = {
  title: 'Math Lesson',
  description: 'Algebra basics',
  date: '2025-10-15T10:00:00.000Z',
  startTime: '10:00',
  endTime: '11:00',
  type: 'lesson',
  priority: 'high',
  location: 'Room 301',
  reminderTime: '2025-10-15T09:30:00.000Z'
};

const response = await CalendarService.createEvent(eventData);
console.log('Event created:', response.event);
```

### Getting Today's Events
```javascript
import { NotificationService } from '../services/notificationService';

const todaysEvents = await NotificationService.getTodaysEvents();
console.log('Today\'s events:', todaysEvents);
```

### Starting Reminder Checker
```javascript
import { NotificationService } from '../services/notificationService';

// Start checking for reminders every 5 minutes
const reminderInterval = NotificationService.startReminderChecker();

// Stop the checker when needed
NotificationService.stopReminderChecker(reminderInterval);
```

## Testing

### Backend Testing
```bash
# Test health endpoint
curl http://localhost:9000/health

# Test event creation (requires JWT token)
curl -X POST http://localhost:9000/api/calendar/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"title":"Test Event","date":"2025-10-15T10:00:00.000Z","type":"lesson"}'

# Test getting events
curl -X GET http://localhost:9000/api/calendar/events \
  -H "Authorization: Bearer <jwt_token>"
```

## Security Features
- **JWT Authentication**: All endpoints require valid JWT tokens
- **User Isolation**: Users can only access their own events
- **Input Validation**: Comprehensive validation for all inputs
- **Error Handling**: Proper error responses without sensitive data

## Performance Optimizations
- **Database Indexes**: Optimized queries with proper indexing
- **Date Range Queries**: Efficient filtering by date ranges
- **Pagination Support**: Ready for pagination implementation
- **Caching**: Local storage caching for notifications

## Future Enhancements
- **Push Notifications**: Real push notifications via FCM/APNS
- **Email Reminders**: Email notification support
- **SMS Reminders**: SMS notification support
- **Recurring Events**: Advanced recurring pattern support
- **Event Sharing**: Share events between users
- **Calendar Sync**: Sync with external calendar services
- **Bulk Operations**: Bulk create/update/delete operations
