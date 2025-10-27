# EduCare - Educational Learning Management System

A comprehensive React Native educational app built with Expo, featuring role-based dashboards for teachers, parents, and students with special needs support.

## 🎓 Features

### **Role-Based Authentication**
- **Teacher**: School ID verification, lesson planning tools
- **Parent**: Child ID linking, progress monitoring
- **Student**: Normal or Special Needs support options

### **Teacher Dashboard**
- Quick actions: Create Plan, View Progress, Messages, Schedule
- Real-time notifications for assignments and parent messages
- Upcoming lessons with time and topic details
- Class management tools

### **Parent Dashboard**
- Child profile with photo and progress tracking
- Reminders for therapy, homework, and exams
- Message teacher functionality
- Calendar view of upcoming tasks
- Progress percentage with visual indicators

### **Student Dashboard**
- **Normal Students**: Assignments, leaderboard, badges, points system
- **Special Needs Students**: Audio-guided activities, visual cards, star/smiley feedback
- Gamified learning with achievements and progress tracking
- Interactive assignment management

### **Educational Design**
- **Green Color Palette**: Calm, eye-friendly colors for extended use
- **Accessibility Features**: Large text, audio guidance, visual feedback
- **Modern UI**: Clean typography, card-based layout, gradient backgrounds
- **Role-based Colors**: Purple for teachers, blue for parents, green for students

## 📱 App Flow

1. **Splash Screen** → EduCare branding with educational theme
2. **Onboarding** → Role-specific introductions (Teachers, Parents, Students)
3. **Authentication** → Role selection with appropriate form fields
4. **Dashboard** → Role-based interface with relevant features

## 🎨 Design System

### Colors
- **Primary**: Emerald Green (#10B981) - Calm and educational
- **Secondary**: Green variations for depth
- **Accent**: Amber (#F59E0B) for highlights and achievements
- **Role Colors**: Purple (Teachers), Blue (Parents), Green (Students)

### Typography
- Clear, sans-serif fonts for readability
- Proper hierarchy with headings and body text
- Accessible font sizes for all users

### Components
- Card-based layouts for organization
- Gradient backgrounds for visual appeal
- Progress bars and badges for gamification
- Interactive buttons with proper feedback

## 🚀 Getting Started

### Prerequisites
1. **Install Expo CLI globally:**
   ```bash
   npm install -g @expo/cli
   ```

2. **Install Expo Go app on your phone:**
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open with Expo Go:**
   - Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)
   - The app will load directly on your device!

## 📁 Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   │   ├── dashboards/     # Role-based dashboards
│   │   │   ├── TeacherDashboard.js
│   │   │   ├── ParentDashboard.js
│   │   │   └── StudentDashboard.js
│   │   ├── SplashScreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── AuthScreen.js
│   │   └── Dashboard.js
│   ├── styles/            # Global styles and themes
│   │   └── theme.js       # Green educational color palette
│   ├── utils/             # Utility functions
│   └── constants/         # App constants
├── App.js                 # Main app entry point with navigation
├── app.json              # Expo configuration
└── package.json          # Dependencies and scripts
```

## 🎯 Key Features by Role

### Teachers
- Create and manage lesson plans
- Track student progress
- Communicate with parents
- View class schedules
- Monitor assignment submissions

### Parents
- Monitor child's academic progress
- Receive reminders for important events
- Message teachers directly
- View upcoming tasks and assignments
- Track therapy and special needs support

### Students (Normal)
- View assignments with due dates
- Track points and achievements
- Compete on leaderboards
- Earn badges for accomplishments
- Monitor personal progress

### Students (Special Needs)
- Access audio-guided lessons
- Visual progress tracking with stars/smileys
- Simplified interface design
- Specialized learning activities
- Enhanced accessibility features

## 🔧 Technical Details

### Dependencies
- **Expo SDK 54**: Latest stable version
- **React Navigation**: Screen navigation
- **Expo Linear Gradient**: Beautiful gradient backgrounds
- **React Native Gesture Handler**: Touch interactions
- **React Native Safe Area Context**: Proper screen handling

### Development
- **Hot Reloading**: Instant updates during development
- **Cross-Platform**: Works on iOS and Android
- **Expo Go Compatible**: No complex setup required
- **Modern React**: Uses latest React patterns and hooks

## 📄 License

This project is open source and available under the MIT License.

---

**EduCare** - Empowering Education for All 🌟📚