# Required Dependencies for Adaptive Lesson Planning

The following dependencies need to be installed for the Adaptive Lesson Planning feature to work fully:

## Core Dependencies
```bash
npm install @react-native-async-storage/async-storage
npm install @react-native-netinfo/netinfo
npm install expo-document-picker
npm install expo-file-system
npm install expo-media-library
npm install expo-clipboard
```

## Optional Dependencies (for full functionality)
```bash
# For QR Code generation
npm install qrcode react-native-qr-generator

# For barcode scanning
npm install expo-barcode-scanner

# For voice-to-text (if available)
npm install react-native-voice
# OR
npm install expo-speech
```

## Current Implementation Status

✅ **Implemented with stubs:**
- 3-step lesson wizard interface
- Offline storage using AsyncStorage
- File picker integration
- QR code generation (stubbed)
- Voice dictation (stubbed)
- API integration layer
- Teacher dashboard integration

🔄 **Requires actual dependencies:**
- Network status detection (NetInfo)
- Real QR code generation
- Voice-to-text functionality
- File upload to server

## File Structure Created

```
src/
├── screens/teacher/
│   └── CreateLessonWizard.tsx     # Main wizard component
├── hooks/
│   └── useOfflineQueue.ts         # Offline storage hook
├── components/share/
│   └── LessonQRCodeSheet.tsx      # QR code display modal
├── api/
│   └── lessons.ts                 # API functions
└── screens/dashboards/
    └── TeacherDashboard.js        # Updated with Create Lesson action
```

## Usage

1. Teacher taps "Create Lesson" in Quick Actions
2. 3-step wizard opens:
   - Step 1: Basic info (title, subject, mode, objectives)
   - Step 2: Lesson steps (add/remove/reorder)
   - Step 3: Resources (file picker, notes, voice dictation)
3. Save offline or submit & sync
4. QR code generation for sharing
5. Drafts appear in dashboard

All UI follows existing theme without modifications.
