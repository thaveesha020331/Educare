import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar} from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import HealthTestScreen from './src/screens/HealthTestScreen';
import MainNavigator from './src/navigation/MainNavigator';
import CreateLessonWizard from './src/screens/teacher/CreateLessonWizard';
import CreateQuizWizard from './src/screens/teacher/CreateQuizWizard';
import ParentMessages from './src/screens/parent/ParentMessages';
import ChildrenManagementScreen from './src/screens/ChildrenManagementScreen';
import ClassroomManagementScreen from './src/screens/ClassroomManagementScreen';
import ClassroomDetailScreen from './src/screens/ClassroomDetailScreen';
import AddStudentToClassroomScreen from './src/screens/AddStudentToClassroomScreen';
import LessonDetailScreen from './src/screens/LessonDetailScreen';
import AccessibilitySettingsScreen from './src/screens/AccessibilitySettingsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ChatConversationScreen from './src/screens/ChatConversationScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import AddStudentScreen from './src/screens/AddStudentScreen';
import QuizTakingScreen from './src/screens/QuizTakingScreen.jsx';
// import './src/i18n'; // Initialize i18n - using stub implementation instead

const Stack = createStackNavigator();

const App = () => {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="HealthTest" component={HealthTestScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="CreateLessonWizard" component={CreateLessonWizard} />
          <Stack.Screen name="CreateQuizWizard" component={CreateQuizWizard} />
          <Stack.Screen name="ParentMessages" component={ParentMessages} />
          <Stack.Screen name="ChildrenManagement" component={ChildrenManagementScreen} />
          <Stack.Screen name="ClassroomManagement" component={ClassroomManagementScreen} />
          <Stack.Screen name="ClassroomDetail" component={ClassroomDetailScreen} />
          <Stack.Screen name="AddStudentToClassroom" component={AddStudentToClassroomScreen} />
          <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
          <Stack.Screen name="AccessibilitySettings" component={AccessibilitySettingsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="AddStudent" component={AddStudentScreen} />
          <Stack.Screen name="QuizTaking" component={QuizTakingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;