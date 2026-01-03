import './global.css';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import CreateSchoolScreen from './screens/CreateSchoolScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import SchoolDashboardScreen from './screens/SchoolDashboardScreen';
import ManageStaffScreen from './screens/ManageStaffScreen';
import AnnouncementsScreen from './screens/AnnouncementsScreen';
import SchoolProfileScreen from './screens/SchoolProfileScreen';
import SchoolTabNavigator from './navigation/SchoolTabNavigator';
import ManageGroupsScreen from './screens/ManageGroupsScreen';
import GroupDetailsScreen from './screens/GroupDetailsScreen';
import FindSchoolsScreen from './screens/FindSchoolsScreen';
import TechnicalSupportScreen from './screens/TechnicalSupportScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import SchoolCalendarScreen from './screens/SchoolCalendarScreen';

import GroupChatScreen from './screens/GroupChatScreen';

const Stack = createNativeStackNavigator();

import * as Linking from 'expo-linking';
import UpdatePasswordScreen from './screens/UpdatePasswordScreen';

// ...

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'schoolmessenger://'],
  config: {
    screens: {
      UpdatePassword: 'reset-password',
      Login: 'login',
      // Add other screens if needed for deep linking
    },
  },
};

function AppContent() {
  const { session, loading } = useAuth();
  const { isDarkMode } = useTheme();

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {session ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreateSchool" component={CreateSchoolScreen} options={{ title: 'Register School' }} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="SchoolTabs" component={SchoolTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="ManageStaff" component={ManageStaffScreen} options={{ title: 'Manage Staff' }} />
            <Stack.Screen name="ManageGroups" component={ManageGroupsScreen} options={{ title: 'Manage Groups' }} />
            <Stack.Screen name="GroupChat" component={GroupChatScreen} options={{ title: 'Group Chat' }} />
            <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} options={{ title: 'Group Details' }} />
            <Stack.Screen name="FindSchools" component={FindSchoolsScreen} options={{ title: 'Find Schools' }} />
            <Stack.Screen name="TechnicalSupport" component={TechnicalSupportScreen} options={{ title: 'Technical Support' }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
            <Stack.Screen name="SchoolCalendar" component={SchoolCalendarScreen} options={{ title: 'School Calendar' }} />
            {/* Allow password update even when logged in (e.g. if link logs them in) */}
            <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} options={{ title: 'Update Password' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
