
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB connection
const uri = "mongodb+srv://NewUser:veesha2025@educare.fa1yvuh.mongodb.net/?retryWrites=true&w=majority&appName=EduCare";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Database connection
let db;
let usersCollection;
let eventsCollection;
let remindersCollection;
let childrenCollection;
let classroomsCollection;
let lessonsCollection;
let quizzesCollection;
let studentProgressCollection;
let messagesCollection;
let parentStudentCollection;

async function connectToDatabase() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    
    db = client.db("educare");
    usersCollection = db.collection("users");
    eventsCollection = db.collection("events");
    remindersCollection = db.collection("reminders");
    childrenCollection = db.collection("children");
    classroomsCollection = db.collection("classrooms");
    lessonsCollection = db.collection("lessons");
    quizzesCollection = db.collection("quizzes");
    studentProgressCollection = db.collection("studentProgress");
    messagesCollection = db.collection("messages");
    parentStudentCollection = db.collection("parentStudent");
    
    // Create indexes for better performance
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await eventsCollection.createIndex({ userId: 1, date: 1 });
    await eventsCollection.createIndex({ userId: 1, type: 1 });
    await remindersCollection.createIndex({ userId: 1, eventId: 1 });
    await remindersCollection.createIndex({ reminderTime: 1 });
    await childrenCollection.createIndex({ parentId: 1 });
    await childrenCollection.createIndex({ studentId: 1 }, { unique: true });
    await classroomsCollection.createIndex({ teacherId: 1 });
    await classroomsCollection.createIndex({ name: 1, teacherId: 1 }, { unique: true });
    await lessonsCollection.createIndex({ teacherId: 1 });
    await lessonsCollection.createIndex({ classroomId: 1 });
    await quizzesCollection.createIndex({ teacherId: 1 });
    await quizzesCollection.createIndex({ lessonId: 1 });
    // Drop existing conflicting indexes first
    try {
      await studentProgressCollection.dropIndex('studentId_1_lessonId_1');
      console.log('Dropped existing studentId_1_lessonId_1 index');
    } catch (e) {
      console.log('Index studentId_1_lessonId_1 does not exist, skipping drop');
    }
    
    try {
      await studentProgressCollection.dropIndex('studentId_1_quizId_1');
      console.log('Dropped existing studentId_1_quizId_1 index');
    } catch (e) {
      console.log('Index studentId_1_quizId_1 does not exist, skipping drop');
    }
    
    // Create indexes with partial filters to avoid conflicts
    await studentProgressCollection.createIndex(
      { studentId: 1, lessonId: 1 }, 
      { 
        unique: true,
        partialFilterExpression: { lessonId: { $exists: true } }
      }
    );
    await studentProgressCollection.createIndex(
      { studentId: 1, quizId: 1 }, 
      { 
        unique: true,
        partialFilterExpression: { quizId: { $exists: true } }
      }
    );
    await messagesCollection.createIndex({ senderId: 1, recipientId: 1, createdAt: -1 });
    await messagesCollection.createIndex({ recipientId: 1, read: 1 });
    await messagesCollection.createIndex({ createdAt: -1 });
    await parentStudentCollection.createIndex({ parentId: 1, studentId: 1 }, { unique: true });
    await parentStudentCollection.createIndex({ parentId: 1 });
    await parentStudentCollection.createIndex({ studentId: 1 });
    console.log("Database indexes created successfully!");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }),
  body('role').isIn(['teacher', 'parent', 'student']),
  body('phone').optional().isString(),
  body('schoolId').optional().isString(),
  body('childId').optional().isString(),
  body('studentType').optional().custom((value, { req }) => {
    // Only validate studentType if role is student
    if (req.body.role === 'student') {
      if (!value || !['normal', 'special'].includes(value)) {
        throw new Error('Student type must be normal or special for students');
      }
    }
    return true;
  })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
];

// Calendar validation middleware
const validateEvent = [
  body('title').isLength({ min: 1 }).trim(),
  body('description').optional().isString(),
  body('date').isISO8601(),
  body('startTime').optional().isString(),
  body('endTime').optional().isString(),
  body('type').isIn(['lesson', 'assignment', 'exam', 'meeting', 'event', 'deadline', 'reminder']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('location').optional().isString(),
  body('isRecurring').optional().isBoolean(),
  body('recurringPattern').optional().isString(),
  body('reminderTime').optional().isISO8601()
];

const validateReminder = [
  body('eventId').isMongoId(),
  body('reminderTime').isISO8601(),
  body('type').isIn(['push', 'email', 'sms']),
  body('message').optional().isString()
];

// Lesson validation middleware
const validateLesson = [
  body('title').isLength({ min: 1 }).trim(),
  body('description').optional().isString(),
  body('content').isLength({ min: 1 }),
  body('classroomId').isMongoId(),
  body('subject').optional().isString(),
  body('grade').optional().isString(),
  body('duration').optional().isInt({ min: 1 }),
  body('attachments').optional().isArray()
];

// Quiz validation middleware
const validateQuiz = [
  body('title').isLength({ min: 1 }).trim(),
  body('description').optional().isString(),
  body('lessonId').optional().isMongoId(),
  body('questions').isArray({ min: 1 }),
  body('questions.*.question').isLength({ min: 1 }),
  body('questions.*.options').isArray({ min: 2 }),
  body('questions.*.correctIndex').isInt({ min: 0 }),
  body('timeLimit').optional().isInt({ min: 1 }),
  body('maxAttempts').optional().isInt({ min: 1 })
];

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Register route
app.post('/api/auth/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password, name, role, phone, schoolId, childId, studentType } = req.body;

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user object
    const userData = {
      email,
      password: hashedPassword,
      name,
      role,
      phone: phone || '',
      schoolId: schoolId || '',
      childId: childId || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Only add studentType for students
    if (role === 'student') {
      userData.studentType = studentType || 'normal';
    }

    // Insert user into database
    const result = await usersCollection.insertOne(userData);
    
    // Create parent-student association if parent is registering with childId
    if (role === 'parent' && childId) {
      try {
        await parentStudentCollection.insertOne({
          parentId: result.insertedId,
          studentId: new ObjectId(childId),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error creating parent-student association:', error);
        // Don't fail registration if association fails
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertedId, 
        email, 
        role,
        name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      id: result.insertedId,
      email,
      name,
      role,
      phone: userData.phone,
      schoolId: userData.schoolId,
      childId: userData.childId,
      token
    };

    // Only include studentType if it exists
    if (userData.studentType) {
      userResponse.studentType = userData.studentType;
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route
app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      schoolId: user.schoolId,
      childId: user.childId,
      studentType: user.studentType,
      token
    };

    res.json({
      message: 'Login successful',
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile (public route - returns all users)
app.get('/api/auth/profile', async (req, res) => {
  try {
    const users = await usersCollection.find(
      {},
      { projection: { password: 0 } }
    ).toArray();
    
    res.json({ users });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile (public route - updates by email)
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { email, name, phone, schoolId, childId, studentType } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (schoolId) updateData.schoolId = schoolId;
    if (childId) updateData.childId = childId;
    if (studentType) updateData.studentType = studentType;
    
    const result = await usersCollection.updateOne(
      { email: email },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Calendar API Routes

// Get all events for a user
app.get('/api/calendar/events', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, type, userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required' });
    }
    
    let query = { userId };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add type filter if provided
    if (type) {
      query.type = type;
    }
    
    const events = await eventsCollection.find(query).sort({ date: 1 }).toArray();
    
    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new event
app.post('/api/calendar/events', authenticateToken, validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      title,
      description,
      date,
      startTime,
      endTime,
      type,
      priority,
      location,
      isRecurring,
      recurringPattern,
      reminderTime,
      userId
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Validate and create event object
    let eventDate;
    try {
      eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
    } catch (dateError) {
      console.error('Date parsing error:', dateError);
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const eventData = {
      userId,
      title: title.trim(),
      description: description?.trim() || '',
      date: eventDate,
      startTime: startTime || null,
      endTime: endTime || null,
      type: type || 'event',
      priority: priority || 'medium',
      location: location?.trim() || '',
      isRecurring: isRecurring || false,
      recurringPattern: recurringPattern || null,
      reminderTime: reminderTime ? new Date(reminderTime) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert event into database
    const result = await eventsCollection.insertOne(eventData);
    
    // Create reminder if reminderTime is provided
    if (reminderTime) {
      const reminderData = {
        userId,
        eventId: result.insertedId,
        reminderTime: new Date(reminderTime),
        type: 'push',
        message: `Reminder: ${title}`,
        isSent: false,
        createdAt: new Date()
      };
      
      await remindersCollection.insertOne(reminderData);
    }

    // Return event data
    const eventResponse = {
      id: result.insertedId,
      ...eventData
    };

    res.status(201).json({
      message: 'Event created successfully',
      event: eventResponse
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update an event
app.put('/api/calendar/events/:eventId', authenticateToken, validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { eventId } = req.params;
    const userId = req.user.userId;
    
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      type,
      priority,
      location,
      isRecurring,
      recurringPattern,
      reminderTime
    } = req.body;

    // Check if event exists and belongs to user
    const existingEvent = await eventsCollection.findOne({ 
      _id: eventId, 
      userId 
    });
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update event
    const updateData = {
      title,
      description: description || '',
      date: new Date(date),
      startTime: startTime || null,
      endTime: endTime || null,
      type,
      priority: priority || 'medium',
      location: location || '',
      isRecurring: isRecurring || false,
      recurringPattern: recurringPattern || null,
      reminderTime: reminderTime ? new Date(reminderTime) : null,
      updatedAt: new Date()
    };

    const result = await eventsCollection.updateOne(
      { _id: eventId, userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update or create reminder
    if (reminderTime) {
      const reminderData = {
        userId,
        eventId: eventId,
        reminderTime: new Date(reminderTime),
        type: 'push',
        message: `Reminder: ${title}`,
        isSent: false,
        updatedAt: new Date()
      };
      
      await remindersCollection.updateOne(
        { eventId: eventId, userId },
        { $set: reminderData },
        { upsert: true }
      );
    } else {
      // Remove reminder if no reminderTime provided
      await remindersCollection.deleteOne({ eventId: eventId, userId });
    }

    res.json({ message: 'Event updated successfully' });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete an event
app.delete('/api/calendar/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // Check if event exists and belongs to user
    const existingEvent = await eventsCollection.findOne({ 
      _id: eventId, 
      userId 
    });
    
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete event
    const result = await eventsCollection.deleteOne({ 
      _id: eventId, 
      userId 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete associated reminders
    await remindersCollection.deleteMany({ eventId: eventId, userId });

    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get upcoming reminders
app.get('/api/calendar/reminders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    
    // Get reminders that are due soon (next 24 hours)
    const upcomingReminders = await remindersCollection.find({
      userId,
      reminderTime: { $gte: now, $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      isSent: false
    }).sort({ reminderTime: 1 }).toArray();

    // Populate event details for each reminder
    const remindersWithEvents = await Promise.all(
      upcomingReminders.map(async (reminder) => {
        const event = await eventsCollection.findOne({ _id: reminder.eventId });
        return {
          ...reminder,
          event: event
        };
      })
    );

    res.json({ reminders: remindersWithEvents });

  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark reminder as sent
app.put('/api/calendar/reminders/:reminderId/sent', authenticateToken, async (req, res) => {
  try {
    const { reminderId } = req.params;
    const userId = req.user.userId;

    const result = await remindersCollection.updateOne(
      { _id: reminderId, userId },
      { $set: { isSent: true, sentAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder marked as sent' });

  } catch (error) {
    console.error('Mark reminder sent error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get events by date range (for calendar view)
app.get('/api/calendar/events/range', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, classroomId } = req.query;
    const userId = req.user.userId;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    let query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // If classroomId is provided, get events for all students in that classroom
    if (classroomId) {
      // Get all students in the classroom
      const students = await usersCollection.find({ 
        classroomId: new ObjectId(classroomId),
        role: 'student',
        isActive: true 
      }).toArray();
      
      const studentIds = students.map(student => student._id);
      query.userId = { $in: studentIds };
    } else {
      // Get events for the current user
      query.userId = userId;
    }

    const events = await eventsCollection.find(query).sort({ date: 1, startTime: 1 }).toArray();

    res.json({ events });

  } catch (error) {
    console.error('Get events by range error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create reminder for students in a classroom
app.post('/api/calendar/reminders/classroom', authenticateToken, async (req, res) => {
  try {
    const { classroomId, title, description, date, startTime, endTime, type, priority } = req.body;
    const teacherId = req.user.userId;

    if (!classroomId || !title || !date) {
      return res.status(400).json({ message: 'Classroom ID, title, and date are required' });
    }

    // Verify the teacher owns this classroom
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId),
      teacherId: new ObjectId(teacherId)
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or access denied' });
    }

    // Get all students in the classroom
    const students = await usersCollection.find({ 
      classroomId: new ObjectId(classroomId),
      role: 'student',
      isActive: true 
    }).toArray();

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in this classroom' });
    }

    // Create events for each student
    const events = students.map(student => ({
      userId: student._id,
      title,
      description: description || '',
      date: new Date(date),
      startTime: startTime || null,
      endTime: endTime || null,
      type: type || 'reminder',
      priority: priority || 'medium',
      location: '',
      isRecurring: false,
      recurringPattern: null,
      reminderTime: null,
      createdBy: teacherId,
      classroomId: new ObjectId(classroomId),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const result = await eventsCollection.insertMany(events);

    res.status(201).json({
      message: `Reminder created for ${students.length} students`,
      eventsCreated: result.insertedCount,
      eventIds: result.insertedIds
    });

  } catch (error) {
    console.error('Create classroom reminder error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Children Management API Routes

// Get all children for a parent
app.get('/api/children', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'parent') {
      return res.status(403).json({ message: 'Only parents can access children data' });
    }
    
    const children = await childrenCollection.find({ parentId: userId }).toArray();
    
    res.json({ children });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a new child manually
app.post('/api/children', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'parent') {
      return res.status(403).json({ message: 'Only parents can add children' });
    }
    
    const { studentId, name, grade, teacher } = req.body;
    
    if (!studentId || !name) {
      return res.status(400).json({ message: 'Student ID and name are required' });
    }
    
    // Check if child already exists
    const existingChild = await childrenCollection.findOne({ studentId });
    if (existingChild) {
      return res.status(400).json({ message: 'Child with this Student ID already exists' });
    }
    
    const childData = {
      parentId: userId,
      studentId,
      name,
      grade: grade || '',
      teacher: teacher || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await childrenCollection.insertOne(childData);
    
    res.status(201).json({
      message: 'Child added successfully',
      child: {
        id: result.insertedId,
        ...childData
      }
    });
    
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update child information
app.put('/api/children/:childId', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'parent') {
      return res.status(403).json({ message: 'Only parents can update children' });
    }
    
    const { name, grade, teacher } = req.body;
    
    // Check if child exists and belongs to parent
    const existingChild = await childrenCollection.findOne({ 
      _id: childId, 
      parentId: userId 
    });
    
    if (!existingChild) {
      return res.status(404).json({ message: 'Child not found' });
    }
    
    const updateData = {
      name: name || existingChild.name,
      grade: grade || existingChild.grade,
      teacher: teacher || existingChild.teacher,
      updatedAt: new Date()
    };
    
    const result = await childrenCollection.updateOne(
      { _id: childId, parentId: userId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Child not found' });
    }
    
    res.json({ message: 'Child updated successfully' });
    
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove child
app.delete('/api/children/:childId', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'parent') {
      return res.status(403).json({ message: 'Only parents can remove children' });
    }
    
    const result = await childrenCollection.deleteOne({ 
      _id: childId, 
      parentId: userId 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Child not found' });
    }
    
    res.json({ message: 'Child removed successfully' });
    
  } catch (error) {
    console.error('Remove child error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get child details
app.get('/api/children/:childId', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'parent') {
      return res.status(403).json({ message: 'Only parents can access child details' });
    }
    
    const child = await childrenCollection.findOne({ 
      _id: childId, 
      parentId: userId 
    });
    
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }
    
    // Get child's events/activities (you can expand this)
    const childEvents = await eventsCollection.find({
      userId: child.studentId
    }).sort({ date: 1 }).toArray();
    
    res.json({ 
      child,
      events: childEvents
    });
    
  } catch (error) {
    console.error('Get child details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Classroom Management API Routes

// Get all classrooms for a teacher
app.get('/api/classrooms', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access classroom data' });
    }
    
    const classrooms = await classroomsCollection.find({ teacherId: new ObjectId(userId) }).toArray();
    
    // Get student count for each classroom
    for (let classroom of classrooms) {
      const studentCount = await childrenCollection.countDocuments({ 
        classroomId: classroom._id 
      });
      classroom.studentCount = studentCount;
    }
    
    res.json({ classrooms });
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new classroom
app.post('/api/classrooms', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create classrooms' });
    }
    
    const { name, description, grade, subject } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Classroom name is required' });
    }
    
    // Check if classroom with same name already exists for this teacher
    const existingClassroom = await classroomsCollection.findOne({ 
      name: name.trim(), 
      teacherId: new ObjectId(userId) 
    });
    if (existingClassroom) {
      return res.status(400).json({ message: 'Classroom with this name already exists' });
    }
    
    const classroomData = {
      teacherId: new ObjectId(userId),
      name: name.trim(),
      description: description || '',
      grade: grade || '',
      subject: subject || '',
      studentCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await classroomsCollection.insertOne(classroomData);
    
    res.status(201).json({
      message: 'Classroom created successfully',
      classroom: {
        id: result.insertedId,
        ...classroomData
      }
    });
    
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update classroom information
app.put('/api/classrooms/:classroomId', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update classrooms' });
    }
    
    const { name, description, grade, subject } = req.body;
    
    // Check if classroom exists and belongs to teacher
    const existingClassroom = await classroomsCollection.findOne({ 
      _id: classroomId, 
      teacherId: userId 
    });
    
    if (!existingClassroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    const updateData = {
      name: name || existingClassroom.name,
      description: description || existingClassroom.description,
      grade: grade || existingClassroom.grade,
      subject: subject || existingClassroom.subject,
      updatedAt: new Date()
    };
    
    const result = await classroomsCollection.updateOne(
      { _id: classroomId, teacherId: userId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    res.json({ message: 'Classroom updated successfully' });
    
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete classroom
app.delete('/api/classrooms/:classroomId', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete classrooms' });
    }
    
    // Remove classroom assignment from all students
    await childrenCollection.updateMany(
      { classroomId: classroomId },
      { $unset: { classroomId: 1 } }
    );
    
    const result = await classroomsCollection.deleteOne({ 
      _id: classroomId, 
      teacherId: userId 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    res.json({ message: 'Classroom deleted successfully' });
    
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all students (for teacher to assign to classrooms)
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access student data' });
    }
    
    const students = await childrenCollection.find({ isActive: true }).toArray();
    
    // Get classroom information for each student
    for (let student of students) {
      if (student.classroomId) {
        const classroom = await classroomsCollection.findOne({ _id: student.classroomId });
        student.classroom = classroom ? {
          name: classroom.name,
          grade: classroom.grade,
          subject: classroom.subject
        } : null;
      } else {
        student.classroom = null;
      }
    }
    
    res.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Assign student to classroom
app.post('/api/classrooms/:classroomId/students/:studentId', authenticateToken, async (req, res) => {
  try {
    const { classroomId, studentId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can assign students' });
    }
    
    // Check if classroom exists and belongs to teacher
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId), 
      teacherId: new ObjectId(userId) 
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    // Check if student exists
    const student = await childrenCollection.findOne({ _id: new ObjectId(studentId) });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Assign student to classroom
    const result = await childrenCollection.updateOne(
      { _id: new ObjectId(studentId) },
      { 
        $set: { 
          classroomId: new ObjectId(classroomId),
          teacher: classroom.name,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Student assigned to classroom successfully' });
    
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove student from classroom
app.delete('/api/classrooms/:classroomId/students/:studentId', authenticateToken, async (req, res) => {
  try {
    const { classroomId, studentId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can remove students' });
    }
    
    // Check if classroom exists and belongs to teacher
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId), 
      teacherId: new ObjectId(userId) 
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    // Remove student from classroom
    const result = await childrenCollection.updateOne(
      { _id: new ObjectId(studentId), classroomId: new ObjectId(classroomId) },
      { 
        $unset: { 
          classroomId: 1,
          teacher: 1
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found in this classroom' });
    }
    
    res.json({ message: 'Student removed from classroom successfully' });
    
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get students in a specific classroom
app.get('/api/classrooms/:classroomId/students', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access classroom students' });
    }
    
    // Check if classroom exists and belongs to teacher
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId), 
      teacherId: new ObjectId(userId) 
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    const students = await childrenCollection.find({ 
      classroomId: new ObjectId(classroomId),
      isActive: true 
    }).toArray();
    
    res.json({ 
      classroom,
      students 
    });
    
  } catch (error) {
    console.error('Get classroom students error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users (for admin/teacher view)
app.get('/api/users', async (req, res) => {
  try {
    const users = await usersCollection.find({ 
      isActive: true 
    }).toArray();
    
    // Remove sensitive information
    const safeUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentType: user.studentType,
      createdAt: user.createdAt,
      isActive: user.isActive
    }));
    
    res.json({ users: safeUsers });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all students (users with student role)
app.get('/api/users/students', async (req, res) => {
  try {
    const students = await usersCollection.find({ 
      role: 'student',
      isActive: true 
    }).toArray();
    
    // Remove sensitive information
    const safeStudents = students.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      studentType: student.studentType,
      createdAt: student.createdAt,
      isActive: student.isActive
    }));
    
    res.json({ students: safeStudents });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== USER-BASED CLASSROOM MANAGEMENT ====================

// Assign registered user (student) to classroom
app.post('/api/classrooms/:classroomId/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { classroomId, userId } = req.params;
    const teacherId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can assign students' });
    }
    
    // Check if classroom exists and belongs to teacher
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId), 
      teacherId: new ObjectId(teacherId) 
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    // Check if user exists and is a student
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(userId),
      role: 'student',
      isActive: true 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if user is already assigned to a classroom
    const existingAssignment = await usersCollection.findOne({
      _id: new ObjectId(userId),
      classroomId: { $exists: true }
    });
    
    if (existingAssignment) {
      return res.status(400).json({ message: 'Student is already assigned to a classroom' });
    }
    
    // Assign user to classroom
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          classroomId: new ObjectId(classroomId),
          teacherId: new ObjectId(teacherId),
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Update classroom student count
    await classroomsCollection.updateOne(
      { _id: new ObjectId(classroomId) },
      { $inc: { studentCount: 1 } }
    );
    
    res.json({ message: 'Student assigned to classroom successfully' });
    
  } catch (error) {
    console.error('Assign user to classroom error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove registered user (student) from classroom
app.delete('/api/classrooms/:classroomId/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { classroomId, userId } = req.params;
    const teacherId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can remove students' });
    }
    
    // Check if classroom exists and belongs to teacher
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId), 
      teacherId: new ObjectId(teacherId) 
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    // Remove user from classroom
    const result = await usersCollection.updateOne(
      { 
        _id: new ObjectId(userId), 
        classroomId: new ObjectId(classroomId) 
      },
      { 
        $unset: { 
          classroomId: 1,
          teacherId: 1
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found in this classroom' });
    }
    
    // Update classroom student count
    await classroomsCollection.updateOne(
      { _id: new ObjectId(classroomId) },
      { $inc: { studentCount: -1 } }
    );
    
    res.json({ message: 'Student removed from classroom successfully' });
    
  } catch (error) {
    console.error('Remove user from classroom error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get students in a specific classroom (using users collection)
app.get('/api/classrooms/:classroomId/users', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access classroom students' });
    }
    
    // Check if classroom exists and belongs to teacher
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId), 
      teacherId: new ObjectId(teacherId) 
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    const students = await usersCollection.find({ 
      classroomId: new ObjectId(classroomId),
      role: 'student',
      isActive: true 
    }).toArray();
    
    res.json({ 
      classroom,
      students 
    });
    
  } catch (error) {
    console.error('Get classroom users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== LESSON MANAGEMENT API ROUTES ====================

// Create a new lesson (Teacher only)
app.post('/api/lessons', authenticateToken, validateLesson, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create lessons' });
    }

    const {
      title,
      description,
      content,
      classroomId,
      subject,
      grade,
      duration,
      attachments
    } = req.body;

    // Verify the classroom belongs to the teacher
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId), 
      teacherId: new ObjectId(userId) 
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or access denied' });
    }

    const lessonData = {
      title,
      description,
      content,
      classroomId: new ObjectId(classroomId),
      teacherId: new ObjectId(userId),
      subject,
      grade,
      duration,
      attachments: attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const result = await lessonsCollection.insertOne(lessonData);
    
    res.status(201).json({
      message: 'Lesson created successfully',
      lessonId: result.insertedId,
      lesson: { ...lessonData, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all lessons for a teacher
app.get('/api/lessons', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access lesson data' });
    }

    const lessons = await lessonsCollection.find({ 
      teacherId: new ObjectId(userId),
      isActive: true 
    }).sort({ createdAt: -1 }).toArray();

    res.json({ lessons });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get lessons for a specific classroom (Teacher only)
app.get('/api/classrooms/:classroomId/lessons', authenticateToken, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access classroom lessons' });
    }

    // Verify the classroom belongs to the teacher
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId), 
      teacherId: new ObjectId(userId) 
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or access denied' });
    }

    const lessons = await lessonsCollection.find({ 
      classroomId: new ObjectId(classroomId),
      isActive: true 
    }).sort({ createdAt: -1 }).toArray();

    res.json({ lessons });
  } catch (error) {
    console.error('Get classroom lessons error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a lesson (Teacher only)
app.put('/api/lessons/:lessonId', authenticateToken, validateLesson, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can update lessons' });
    }

    const {
      title,
      description,
      content,
      classroomId,
      subject,
      grade,
      duration,
      attachments
    } = req.body;

    // Verify the lesson belongs to the teacher
    const existingLesson = await lessonsCollection.findOne({ 
      _id: new ObjectId(lessonId), 
      teacherId: new ObjectId(userId) 
    });

    if (!existingLesson) {
      return res.status(404).json({ message: 'Lesson not found or access denied' });
    }

    // Verify the classroom belongs to the teacher
    const classroom = await classroomsCollection.findOne({ 
      _id: new ObjectId(classroomId), 
      teacherId: new ObjectId(userId) 
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or access denied' });
    }

    const updateData = {
      title,
      description,
      content,
      classroomId: new ObjectId(classroomId),
      subject,
      grade,
      duration,
      attachments: attachments || [],
      updatedAt: new Date()
    };

    const result = await lessonsCollection.updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json({ message: 'Lesson updated successfully' });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a lesson (Teacher only)
app.delete('/api/lessons/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete lessons' });
    }

    // Verify the lesson belongs to the teacher
    const existingLesson = await lessonsCollection.findOne({ 
      _id: new ObjectId(lessonId), 
      teacherId: new ObjectId(userId) 
    });

    if (!existingLesson) {
      return res.status(404).json({ message: 'Lesson not found or access denied' });
    }

    // Soft delete by setting isActive to false
    const result = await lessonsCollection.updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== QUIZ MANAGEMENT API ROUTES ====================

// Create a new quiz (Teacher only)
app.post('/api/quizzes', authenticateToken, validateQuiz, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create quizzes' });
    }

    const {
      title,
      description,
      lessonId,
      questions,
      timeLimit,
      maxAttempts
    } = req.body;

    let classroomId = null;
    
    // If lessonId is provided, verify the lesson belongs to the teacher
    if (lessonId) {
      const lesson = await lessonsCollection.findOne({ 
        _id: new ObjectId(lessonId), 
        teacherId: new ObjectId(userId) 
      });

      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found or access denied' });
      }
      
      classroomId = lesson.classroomId;
    }

    const quizData = {
      title,
      description,
      lessonId: lessonId ? new ObjectId(lessonId) : null,
      classroomId: classroomId,
      teacherId: new ObjectId(userId),
      questions,
      timeLimit: timeLimit || null,
      maxAttempts: maxAttempts || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const result = await quizzesCollection.insertOne(quizData);
    
    res.status(201).json({
      message: 'Quiz created successfully',
      quizId: result.insertedId,
      quiz: { ...quizData, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all quizzes for a teacher
app.get('/api/quizzes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access quiz data' });
    }

    const quizzes = await quizzesCollection.find({ 
      teacherId: new ObjectId(userId),
      isActive: true 
    }).sort({ createdAt: -1 }).toArray();

    res.json({ quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get quizzes for a specific lesson (Teacher only)
app.get('/api/lessons/:lessonId/quizzes', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access lesson quizzes' });
    }

    // Verify the lesson belongs to the teacher
    const lesson = await lessonsCollection.findOne({ 
      _id: new ObjectId(lessonId), 
      teacherId: new ObjectId(userId) 
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found or access denied' });
    }

    const quizzes = await quizzesCollection.find({ 
      lessonId: new ObjectId(lessonId),
      isActive: true 
    }).sort({ createdAt: -1 }).toArray();

    res.json({ quizzes });
  } catch (error) {
    console.error('Get lesson quizzes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== STUDENT ACCESS API ROUTES ====================

// Get lessons for a student (Student only)
app.get('/api/student/lessons', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Only students can access this endpoint' });
    }

    // Get student's classroom from users collection
    const student = await usersCollection.findOne({ 
      _id: new ObjectId(userId),
      role: 'student',
      isActive: true
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.classroomId) {
      return res.status(404).json({ message: 'Student not assigned to any classroom' });
    }

    // Get lessons for the student's classroom
    const lessons = await lessonsCollection.find({ 
      classroomId: new ObjectId(student.classroomId),
      isActive: true 
    }).sort({ createdAt: -1 }).toArray();

    // Get student progress for each lesson
    const lessonsWithProgress = await Promise.all(lessons.map(async (lesson) => {
      const progress = await studentProgressCollection.findOne({
        studentId: new ObjectId(userId),
        lessonId: lesson._id
      });

      return {
        ...lesson,
        progress: progress ? {
          isCompleted: progress.isCompleted,
          completedAt: progress.completedAt,
          timeSpent: progress.timeSpent
        } : {
          isCompleted: false,
          completedAt: null,
          timeSpent: 0
        }
      };
    }));

    res.json({ lessons: lessonsWithProgress });
  } catch (error) {
    console.error('Get student lessons error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get quizzes for a student (Student only)
app.get('/api/student/quizzes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Only students can access this endpoint' });
    }

    // Get student's classroom from users collection
    const student = await usersCollection.findOne({ 
      _id: new ObjectId(userId),
      role: 'student',
      isActive: true
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.classroomId) {
      return res.status(404).json({ message: 'Student not assigned to any classroom' });
    }

    // Get quizzes for the student's classroom OR general quizzes (without classroomId)
    const quizzes = await quizzesCollection.find({ 
      $or: [
        { classroomId: new ObjectId(student.classroomId) },
        { classroomId: null }
      ],
      isActive: true 
    }).sort({ createdAt: -1 }).toArray();

    // Get student progress for each quiz
    const quizzesWithProgress = await Promise.all(quizzes.map(async (quiz) => {
      const progress = await studentProgressCollection.findOne({
        studentId: new ObjectId(userId),
        quizId: quiz._id
      });

      return {
        ...quiz,
        progress: progress ? {
          attempts: progress.attempts,
          bestScore: progress.bestScore,
          lastAttemptAt: progress.lastAttemptAt,
          isCompleted: progress.isCompleted
        } : {
          attempts: 0,
          bestScore: 0,
          lastAttemptAt: null,
          isCompleted: false
        }
      };
    }));

    res.json({ quizzes: quizzesWithProgress });
  } catch (error) {
    console.error('Get student quizzes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark lesson as completed (Student only)
app.post('/api/student/lessons/:lessonId/complete', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { timeSpent } = req.body;
    
    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Only students can complete lessons' });
    }

    // Verify the lesson exists and student has access
    const student = await usersCollection.findOne({ 
      _id: new ObjectId(userId),
      role: 'student',
      isActive: true
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.classroomId) {
      return res.status(404).json({ message: 'Student not assigned to any classroom' });
    }

    const lesson = await lessonsCollection.findOne({ 
      _id: new ObjectId(lessonId),
      classroomId: new ObjectId(student.classroomId),
      isActive: true 
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found or access denied' });
    }

    // Check if progress already exists
    const existingProgress = await studentProgressCollection.findOne({
      studentId: new ObjectId(userId),
      lessonId: new ObjectId(lessonId)
    });

    if (existingProgress) {
      // Update existing progress
      await studentProgressCollection.updateOne(
        { 
          studentId: new ObjectId(userId),
          lessonId: new ObjectId(lessonId)
        },
        { 
          $set: {
            isCompleted: true,
            completedAt: new Date(),
            timeSpent: timeSpent || 0,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Insert new progress record
      const progressData = {
        studentId: new ObjectId(userId),
        lessonId: new ObjectId(lessonId),
        isCompleted: true,
        completedAt: new Date(),
        timeSpent: timeSpent || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await studentProgressCollection.insertOne(progressData);
    }

    res.json({ message: 'Lesson marked as completed successfully' });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit quiz attempt (Student only)
app.post('/api/student/quizzes/:quizId/submit', authenticateToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { answers, timeSpent } = req.body;
    
    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Only students can submit quizzes' });
    }

    // Verify the quiz exists and student has access
    const student = await usersCollection.findOne({ 
      _id: new ObjectId(userId),
      role: 'student',
      isActive: true
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.classroomId) {
      return res.status(404).json({ message: 'Student not assigned to any classroom' });
    }

    const quiz = await quizzesCollection.findOne({ 
      _id: new ObjectId(quizId),
      $or: [
        { classroomId: new ObjectId(student.classroomId) },
        { classroomId: null }
      ],
      isActive: true 
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or access denied' });
    }

    // Check if student has exceeded max attempts
    const existingProgress = await studentProgressCollection.findOne({
      studentId: new ObjectId(userId),
      quizId: new ObjectId(quizId)
    });

    if (existingProgress && existingProgress.attempts >= quiz.maxAttempts) {
      return res.status(400).json({ message: 'Maximum attempts exceeded for this quiz' });
    }

    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctIndex) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const isPassed = score >= 70; // 70% passing grade

    // Update or create progress record
    const progressData = {
      studentId: new ObjectId(userId),
      quizId: new ObjectId(quizId),
      attempts: (existingProgress?.attempts || 0) + 1,
      bestScore: Math.max(existingProgress?.bestScore || 0, score),
      lastAttemptAt: new Date(),
      lastScore: score,
      isCompleted: isPassed,
      timeSpent: timeSpent || 0,
      updatedAt: new Date()
    };

    await studentProgressCollection.updateOne(
      { 
        studentId: new ObjectId(userId),
        quizId: new ObjectId(quizId)
      },
      { $set: progressData },
      { upsert: true }
    );

    res.json({ 
      message: 'Quiz submitted successfully',
      score,
      isPassed,
      correctAnswers,
      totalQuestions: quiz.questions.length
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get student progress summary
app.get('/api/student/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Only students can access progress data' });
    }

    // Get student's classroom from users collection
    const student = await usersCollection.findOne({ 
      _id: new ObjectId(userId),
      role: 'student',
      isActive: true
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!student.classroomId) {
      return res.status(404).json({ message: 'Student not assigned to any classroom' });
    }

    // Get total lessons and quizzes
    const totalLessons = await lessonsCollection.countDocuments({ 
      classroomId: new ObjectId(student.classroomId),
      isActive: true 
    });

    const totalQuizzes = await quizzesCollection.countDocuments({ 
      classroomId: new ObjectId(student.classroomId),
      isActive: true 
    });

    // Get completed lessons
    const completedLessons = await studentProgressCollection.countDocuments({
      studentId: new ObjectId(userId),
      lessonId: { $exists: true },
      isCompleted: true
    });

    // Get completed quizzes
    const completedQuizzes = await studentProgressCollection.countDocuments({
      studentId: new ObjectId(userId),
      quizId: { $exists: true },
      isCompleted: true
    });

    // Get average quiz score
    const quizProgress = await studentProgressCollection.find({
      studentId: new ObjectId(userId),
      quizId: { $exists: true },
      bestScore: { $exists: true }
    }).toArray();

    const averageScore = quizProgress.length > 0 
      ? Math.round(quizProgress.reduce((sum, p) => sum + p.bestScore, 0) / quizProgress.length)
      : 0;

    res.json({
      totalLessons,
      completedLessons,
      totalQuizzes,
      completedQuizzes,
      averageScore,
      progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== PARENT API ROUTES ====================

// Get parent's student data
app.get('/api/parent/student', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.userId;
    
    // Get parent's associated students
    const associations = await parentStudentCollection.find({ parentId: new ObjectId(parentId) }).toArray();
    
    if (associations.length === 0) {
      return res.json({ student: null, message: 'No student associated with this parent' });
    }
    
    // Get the first student (assuming one student per parent for now)
    const association = associations[0];
    const student = await usersCollection.findOne({ 
      _id: association.studentId,
      role: 'student',
      isActive: true 
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Associated student not found' });
    }
    
    res.json({ student });
  } catch (error) {
    console.error('Get parent student error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get parent's student progress
app.get('/api/parent/student/progress', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.userId;
    
    // Get parent's associated students
    const associations = await parentStudentCollection.find({ parentId: new ObjectId(parentId) }).toArray();
    
    if (associations.length === 0) {
      return res.json({ progress: [] });
    }
    
    const studentId = associations[0].studentId;
    
    // Get student progress
    const progress = await studentProgressCollection.find({ 
      studentId: studentId 
    }).sort({ createdAt: -1 }).toArray();
    
    res.json({ progress });
  } catch (error) {
    console.error('Get parent student progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get parent's student events
app.get('/api/parent/student/events', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { studentId: requestedStudentId } = req.query;
    
    // Get parent's associated students
    const associations = await parentStudentCollection.find({ parentId: new ObjectId(parentId) }).toArray();
    
    if (associations.length === 0) {
      return res.json({ events: [] });
    }
    
    // Use requested studentId if provided, otherwise use the first associated student
    let studentId;
    if (requestedStudentId) {
      // Verify the requested student is associated with this parent
      const isAssociated = associations.some(assoc => assoc.studentId.toString() === requestedStudentId);
      if (!isAssociated) {
        return res.status(403).json({ message: 'Access denied to this student' });
      }
      studentId = new ObjectId(requestedStudentId);
    } else {
      studentId = associations[0].studentId;
    }
    
    // Get student's classroom first
    const student = await usersCollection.findOne({ _id: studentId });
    if (!student || !student.classroomId) {
      return res.json({ events: [] });
    }
    
    // Get both student-specific events and classroom events
    const events = await eventsCollection.find({ 
      $or: [
        { userId: studentId }, // Student's personal events
        { classroomId: student.classroomId } // Classroom events
      ]
    }).sort({ date: 1 }).toArray();
    
    res.json({ events });
  } catch (error) {
    console.error('Get parent student events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get parent's student lessons
app.get('/api/parent/student/lessons', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.userId;
    
    // Get parent's associated students
    const associations = await parentStudentCollection.find({ parentId: new ObjectId(parentId) }).toArray();
    
    if (associations.length === 0) {
      return res.json({ lessons: [] });
    }
    
    const studentId = associations[0].studentId;
    
    // Get student's classroom first
    const student = await usersCollection.findOne({ _id: studentId });
    if (!student || !student.classroomId) {
      return res.json({ lessons: [] });
    }
    
    // Get lessons for student's classroom
    const lessons = await lessonsCollection.find({ 
      classroomId: new ObjectId(student.classroomId) 
    }).sort({ createdAt: -1 }).toArray();
    
    // Get student progress for each lesson
    const lessonsWithProgress = await Promise.all(lessons.map(async (lesson) => {
      const progress = await studentProgressCollection.findOne({
        studentId: studentId,
        lessonId: lesson._id
      });
      
      return {
        ...lesson,
        progress: progress ? {
          isCompleted: progress.isCompleted || false,
          completedAt: progress.completedAt,
          timeSpent: progress.timeSpent || 0,
          lastUpdated: progress.updatedAt
        } : {
          isCompleted: false,
          completedAt: null,
          timeSpent: 0,
          lastUpdated: null
        }
      };
    }));
    
    res.json({ lessons: lessonsWithProgress });
  } catch (error) {
    console.error('Get parent student lessons error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get parent's student quizzes
app.get('/api/parent/student/quizzes', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.userId;
    
    // Get parent's associated students
    const associations = await parentStudentCollection.find({ parentId: new ObjectId(parentId) }).toArray();
    
    if (associations.length === 0) {
      return res.json({ quizzes: [] });
    }
    
    const studentId = associations[0].studentId;
    
    // Get student's classroom first
    const student = await usersCollection.findOne({ _id: studentId });
    if (!student || !student.classroomId) {
      return res.json({ quizzes: [] });
    }
    
    // Get quizzes for student's classroom and general quizzes
    const quizzes = await quizzesCollection.find({ 
      $or: [
        { classroomId: new ObjectId(student.classroomId) },
        { classroomId: null }
      ]
    }).sort({ createdAt: -1 }).toArray();
    
    // Get student progress for each quiz
    const quizzesWithProgress = await Promise.all(quizzes.map(async (quiz) => {
      const progress = await studentProgressCollection.findOne({
        studentId: studentId,
        quizId: quiz._id
      });
      
      return {
        ...quiz,
        progress: progress ? {
          isCompleted: progress.isCompleted || false,
          bestScore: progress.bestScore || 0,
          lastScore: progress.lastScore || 0,
          attempts: progress.attempts || 0,
          lastAttemptAt: progress.lastAttemptAt,
          timeSpent: progress.timeSpent || 0,
          lastUpdated: progress.updatedAt
        } : {
          isCompleted: false,
          bestScore: 0,
          lastScore: 0,
          attempts: 0,
          lastAttemptAt: null,
          timeSpent: 0,
          lastUpdated: null
        }
      };
    }));
    
    res.json({ quizzes: quizzesWithProgress });
  } catch (error) {
    console.error('Get parent student quizzes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get teachers only for parent messaging
app.get('/api/parent/teachers', authenticateToken, async (req, res) => {
  try {
    const teachers = await usersCollection.find({ 
      role: 'teacher',
      isActive: true 
    }).toArray();
    
    res.json({ teachers });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add student to parent
app.post('/api/parent/students', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Verify student exists
    const student = await usersCollection.findOne({ 
      _id: new ObjectId(studentId),
      role: 'student',
      isActive: true 
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if association already exists
    const existingAssociation = await parentStudentCollection.findOne({
      parentId: new ObjectId(parentId),
      studentId: new ObjectId(studentId)
    });

    if (existingAssociation) {
      return res.status(400).json({ message: 'Student is already associated with this parent' });
    }

    // Create association
    const association = {
      parentId: new ObjectId(parentId),
      studentId: new ObjectId(studentId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await parentStudentCollection.insertOne(association);

    res.status(201).json({
      message: 'Student added successfully',
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentType: student.studentType
      }
    });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove student from parent
app.delete('/api/parent/students/:studentId', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.userId;
    const studentId = req.params.studentId;

    const result = await parentStudentCollection.deleteOne({
      parentId: new ObjectId(parentId),
      studentId: new ObjectId(studentId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Student association not found' });
    }

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all students for parent
app.get('/api/parent/students', authenticateToken, async (req, res) => {
  try {
    const parentId = req.user.userId;
    
    const associations = await parentStudentCollection.find({ 
      parentId: new ObjectId(parentId) 
    }).toArray();
    
    const studentIds = associations.map(assoc => assoc.studentId);
    const students = await usersCollection.find({ 
      _id: { $in: studentIds },
      role: 'student',
      isActive: true 
    }).toArray();
    
    res.json({ students });
  } catch (error) {
    console.error('Get parent students error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== GEMINI CHATBOT API ROUTES ====================

// Initialize chatbot session
app.post('/api/chatbot/initialize', authenticateToken, async (req, res) => {
  try {
    const { systemPrompt, userRole, studentType, preferences } = req.body;
    const userId = req.user.userId;
    
    console.log('Chatbot initialization request:', {
      userId,
      userRole,
      studentType,
      preferences
    });

    // Store chatbot session
    const sessionData = {
      userId: new ObjectId(userId),
      systemPrompt,
      userRole,
      studentType,
      preferences,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // For now, we'll simulate Gemini responses
    // In production, you would integrate with Google's Gemini API
    const response = {
      message: 'Chatbot initialized successfully',
      sessionId: `session_${userId}_${Date.now()}`,
      welcomeMessage: getWelcomeMessage(userRole, studentType),
      features: {
        voiceEnabled: preferences?.voiceEnabled || true,
        visualAids: preferences?.visualAids || true,
        simpleLanguage: preferences?.useSimpleLanguage || true,
        emojis: preferences?.includeEmojis || true
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Chatbot initialization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send message to chatbot
app.post('/api/chatbot/message', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.userId;
    
    console.log('Chatbot message request:', {
      userId,
      message,
      context
    });

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Simulate Gemini response (in production, call Gemini API)
    const response = await generateGeminiResponse(message, context);
    
    res.json({
      message: 'Chatbot response generated',
      response: response.text,
      suggestions: response.suggestions,
      visualAids: response.visualAids,
      voiceEnabled: response.voiceEnabled,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get learning suggestions
app.post('/api/chatbot/suggestions', authenticateToken, async (req, res) => {
  try {
    const { subject, difficulty, type } = req.body;
    
    const suggestions = generateLearningSuggestions(subject, difficulty, type);
    
    res.json({
      message: 'Learning suggestions generated',
      suggestions,
      subject,
      difficulty
    });
  } catch (error) {
    console.error('Learning suggestions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get encouragement message
app.post('/api/chatbot/encouragement', authenticateToken, async (req, res) => {
  try {
    const { achievement, type } = req.body;
    
    const encouragement = generateEncouragementMessage(achievement, type);
    
    res.json({
      message: 'Encouragement message generated',
      encouragement,
      achievement
    });
  } catch (error) {
    console.error('Encouragement message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper functions for Gemini simulation
function getWelcomeMessage(userRole, studentType) {
  const messages = {
    special: "🌟 Hi there! I'm your friendly learning buddy! 🤗 I'm here to help you learn and have fun! What would you like to explore today? ✨",
    normal: "👋 Hello! I'm your educational assistant! 😊 I'm here to help you with your studies and answer any questions you might have. How can I help you today? 📚",
    teacher: "👩‍🏫 Hello! I'm your AI teaching assistant! 🎓 I can help you create lesson plans, answer student questions, and provide teaching resources. What do you need help with? 📖"
  };
  
  return studentType === 'special' ? messages.special : messages[userRole] || messages.normal;
}

async function generateGeminiResponse(userMessage, context) {
  // Simulate Gemini AI response based on message content and context
  const lowerMessage = userMessage.toLowerCase();
  const studentType = context.studentType || 'normal';
  const useEmojis = context.preferences?.includeEmojis !== false;
  const useSimpleLanguage = context.preferences?.useSimpleLanguage !== false;
  
  let response = '';
  let suggestions = [];
  let visualAids = [];
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    response = useEmojis ? "👋 Hi there! 😊 How can I help you today? What would you like to learn about? 📚" : "Hello! How can I help you today? What would you like to learn about?";
    suggestions = ["Math help", "Reading practice", "Science questions", "Homework help"];
  }
  // Math help
  else if (lowerMessage.includes('math') || lowerMessage.includes('number') || lowerMessage.includes('add') || lowerMessage.includes('subtract')) {
    if (studentType === 'special') {
      response = useEmojis ? "🔢 Math is fun! 😊 Let's start with something easy! 📝 Do you want to count together? 1️⃣ 2️⃣ 3️⃣" : "Math is fun! Let's start with something easy! Do you want to count together? 1, 2, 3...";
      suggestions = ["Count to 10", "Simple addition", "Number games", "Take a break"];
    } else {
      response = useEmojis ? "📊 Great choice! Math can be really interesting! 🧮 What math topic would you like help with? ➕➖✖️➗" : "Great choice! Math can be really interesting! What math topic would you like help with?";
      suggestions = ["Addition & Subtraction", "Multiplication", "Fractions", "Word problems"];
    }
  }
  // Reading help
  else if (lowerMessage.includes('read') || lowerMessage.includes('book') || lowerMessage.includes('story')) {
    if (studentType === 'special') {
      response = useEmojis ? "📚 Reading is wonderful! 🌟 Let's find a fun story! 📖 Should we read together? I can help you with the words! 🤝" : "Reading is wonderful! Let's find a fun story! Should we read together? I can help you with the words!";
      suggestions = ["Picture books", "Simple stories", "Letter practice", "Story time"];
    } else {
      response = useEmojis ? "📖 Reading opens up amazing worlds! 🌍 What kind of story or book would you like to explore? 📚✨" : "Reading opens up amazing worlds! What kind of story or book would you like to explore?";
      suggestions = ["Fiction stories", "Non-fiction books", "Poetry", "Reading comprehension"];
    }
  }
  // Help requests
  else if (lowerMessage.includes('help') || lowerMessage.includes('confused') || lowerMessage.includes('don\'t understand')) {
    response = useEmojis ? "🤝 I'm here to help! 😊 Don't worry, everyone gets confused sometimes! 🤗 What part is tricky? Let's figure it out together! 💡" : "I'm here to help! Don't worry, everyone gets confused sometimes! What part is tricky? Let's figure it out together!";
    suggestions = ["Break it down", "Try a different way", "Take a break", "Ask teacher"];
  }
  // Encouragement requests
  else if (lowerMessage.includes('tired') || lowerMessage.includes('hard') || lowerMessage.includes('difficult')) {
    response = useEmojis ? "💪 You're doing great! 🌟 It's okay to feel tired sometimes! 😊 Take a deep breath! 🫁 You're stronger than you think! ⭐" : "You're doing great! It's okay to feel tired sometimes! Take a deep breath! You're stronger than you think!";
    suggestions = ["Take a break", "Try again later", "Ask for help", "Celebrate progress"];
  }
  // Default response
  else {
    if (studentType === 'special') {
      response = useEmojis ? "🤔 That's interesting! 😊 Can you tell me more about that? I want to understand and help you! 🤝✨" : "That's interesting! Can you tell me more about that? I want to understand and help you!";
    } else {
      response = useEmojis ? "🤔 That's a great question! 💭 Let me help you with that! What specific part would you like to know more about? 🔍" : "That's a great question! Let me help you with that! What specific part would you like to know more about?";
    }
    suggestions = ["Explain more", "Give examples", "Try practice", "Different topic"];
  }
  
  return {
    text: response,
    suggestions,
    visualAids: useEmojis ? ['emoji', 'color'] : [],
    voiceEnabled: true
  };
}

function generateLearningSuggestions(subject, difficulty, type) {
  const suggestions = {
    math: {
      beginner: [
        { title: "Count to 10", description: "Practice counting with fun games", emoji: "🔢" },
        { title: "Simple Addition", description: "Learn to add small numbers", emoji: "➕" },
        { title: "Number Recognition", description: "Identify numbers 1-20", emoji: "🔍" },
        { title: "Shapes", description: "Learn basic shapes", emoji: "🔷" }
      ],
      intermediate: [
        { title: "Multiplication Tables", description: "Practice times tables", emoji: "✖️" },
        { title: "Fractions", description: "Understand parts of whole", emoji: "🍕" },
        { title: "Word Problems", description: "Solve real-world math problems", emoji: "📝" },
        { title: "Geometry", description: "Learn about shapes and angles", emoji: "📐" }
      ]
    },
    reading: {
      beginner: [
        { title: "Letter Sounds", description: "Learn phonics and letter sounds", emoji: "🔤" },
        { title: "Sight Words", description: "Practice common words", emoji: "👁️" },
        { title: "Simple Stories", description: "Read easy picture books", emoji: "📖" },
        { title: "Rhyming Words", description: "Find words that sound alike", emoji: "🎵" }
      ],
      intermediate: [
        { title: "Reading Comprehension", description: "Understand what you read", emoji: "🧠" },
        { title: "Vocabulary Building", description: "Learn new words", emoji: "📚" },
        { title: "Creative Writing", description: "Write your own stories", emoji: "✍️" },
        { title: "Poetry", description: "Explore rhythm and rhyme", emoji: "🎭" }
      ]
    }
  };
  
  return suggestions[subject]?.[difficulty] || suggestions.math.beginner;
}

function generateEncouragementMessage(achievement, type) {
  const encouragements = {
    general: [
      "🌟 You're doing amazing! Keep up the great work! 🎉",
      "⭐ You're getting better every day! I'm proud of you! 👏",
      "💪 You can do this! I believe in you! 🌟",
      "🎯 You're making great progress! Keep going! 🚀"
    ],
    completed_task: [
      "🎉 Congratulations! You finished it! Well done! 🏆",
      "👏 Excellent work! You completed that perfectly! ⭐",
      "🌟 Fantastic! You did a great job! 🎊",
      "💫 Amazing! You should be proud of yourself! 🌈"
    ],
    improved: [
      "📈 Wow! You're getting so much better! 🌟",
      "🎯 Great improvement! You're learning so fast! 🚀",
      "💡 I can see you're understanding more! Well done! 👏",
      "🌟 You're making such good progress! Keep it up! ⭐"
    ]
  };
  
  const messages = encouragements[achievement] || encouragements.general;
  return messages[Math.floor(Math.random() * messages.length)];
}

// ==================== MESSAGING API ROUTES ====================

// Get all conversations for current user
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all unique conversations for this user
    const conversations = await messagesCollection.aggregate([
      {
        $match: {
          $or: [
            { senderId: new ObjectId(userId) },
            { recipientId: new ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', new ObjectId(userId)] },
              '$recipientId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipientId', new ObjectId(userId)] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            role: '$user.role'
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]).toArray();

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get messages between current user and another user
app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    const messages = await messagesCollection.find({
      $or: [
        {
          senderId: new ObjectId(currentUserId),
          recipientId: new ObjectId(otherUserId)
        },
        {
          senderId: new ObjectId(otherUserId),
          recipientId: new ObjectId(currentUserId)
        }
      ]
    }).sort({ createdAt: 1 }).toArray();

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send a message
app.post('/api/messages/send', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { recipientId, message, type = 'text' } = req.body;

    console.log('Send message request received:', {
      senderId,
      recipientId,
      message,
      type,
      body: req.body
    });

    if (!recipientId || !message) {
      console.log('Validation failed - missing recipientId or message:', { recipientId, message });
      return res.status(400).json({ message: 'Recipient ID and message are required' });
    }

    // Verify recipient exists
    const recipient = await usersCollection.findOne({ 
      _id: new ObjectId(recipientId),
      isActive: true 
    });

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const messageData = {
      senderId: new ObjectId(senderId),
      recipientId: new ObjectId(recipientId),
      message: message.trim(),
      type: type,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await messagesCollection.insertOne(messageData);

    // Get the created message with populated sender info
    const createdMessage = await messagesCollection.findOne({ _id: result.insertedId });

    res.status(201).json({
      message: 'Message sent successfully',
      data: createdMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark messages as read
app.put('/api/messages/read/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    const result = await messagesCollection.updateMany(
      {
        senderId: new ObjectId(otherUserId),
        recipientId: new ObjectId(currentUserId),
        read: false
      },
      {
        $set: { 
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.json({ 
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a message
app.delete('/api/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.userId;

    // Check if message exists and user is the sender
    const message = await messagesCollection.findOne({
      _id: new ObjectId(messageId),
      senderId: new ObjectId(userId)
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or access denied' });
    }

    const result = await messagesCollection.deleteOne({
      _id: new ObjectId(messageId),
      senderId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get unread message count
app.get('/api/messages/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadCount = await messagesCollection.countDocuments({
      recipientId: new ObjectId(userId),
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoints:`);
    console.log(`  POST /api/auth/register`);
    console.log(`  POST /api/auth/login`);
    console.log(`  GET  /api/auth/profile`);
    console.log(`  PUT  /api/auth/profile`);
    console.log(`  GET  /api/calendar/events`);
    console.log(`  POST /api/calendar/events`);
    console.log(`  PUT  /api/calendar/events/:id`);
    console.log(`  DELETE /api/calendar/events/:id`);
    console.log(`  GET  /api/calendar/reminders`);
    console.log(`  GET  /api/calendar/events/range`);
    console.log(`  GET  /api/children`);
    console.log(`  POST /api/children`);
    console.log(`  PUT  /api/children/:id`);
    console.log(`  DELETE /api/children/:id`);
    console.log(`  GET  /api/children/:id`);
    console.log(`  GET  /api/classrooms`);
    console.log(`  POST /api/classrooms`);
    console.log(`  PUT  /api/classrooms/:id`);
    console.log(`  DELETE /api/classrooms/:id`);
    console.log(`  GET  /api/students`);
    console.log(`  POST /api/classrooms/:id/students/:studentId`);
    console.log(`  DELETE /api/classrooms/:id/students/:studentId`);
    console.log(`  GET  /api/classrooms/:id/students`);
    console.log(`  GET  /api/users`);
    console.log(`  GET  /api/users/students`);
    console.log(`  POST /api/lessons`);
    console.log(`  GET  /api/lessons`);
    console.log(`  PUT  /api/lessons/:id`);
    console.log(`  DELETE /api/lessons/:id`);
    console.log(`  GET  /api/classrooms/:id/lessons`);
    console.log(`  POST /api/quizzes`);
    console.log(`  GET  /api/quizzes`);
    console.log(`  GET  /api/lessons/:id/quizzes`);
    console.log(`  GET  /api/student/lessons`);
    console.log(`  GET  /api/student/quizzes`);
    console.log(`  POST /api/student/lessons/:id/complete`);
    console.log(`  POST /api/student/quizzes/:id/submit`);
    console.log(`  GET  /api/student/progress`);
    console.log(`  GET  /api/parent/student`);
    console.log(`  GET  /api/parent/student/progress`);
    console.log(`  GET  /api/parent/student/events`);
    console.log(`  GET  /api/parent/student/lessons`);
    console.log(`  GET  /api/parent/student/quizzes`);
    console.log(`  GET  /api/parent/teachers`);
    console.log(`  POST /api/parent/students`);
    console.log(`  DELETE /api/parent/students/:studentId`);
    console.log(`  GET  /api/parent/students`);
    console.log(`  GET  /api/messages/conversations`);
    console.log(`  GET  /api/messages/:userId`);
    console.log(`  POST /api/messages/send`);
    console.log(`  PUT  /api/messages/read/:userId`);
    console.log(`  DELETE /api/messages/:messageId`);
    console.log(`  GET  /api/messages/unread-count`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await client.close();
  process.exit(0);
});
