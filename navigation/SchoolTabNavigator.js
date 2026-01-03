import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';

import SchoolDashboardScreen from '../screens/SchoolDashboardScreen';
import PageTransition from '../components/PageTransition';

import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import SchoolProfileScreen from '../screens/SchoolProfileScreen';
import SchoolMenuScreen from '../screens/SchoolMenuScreen';
import MySchoolsScreen from '../screens/MySchoolsScreen';

const Tab = createBottomTabNavigator();

export default function SchoolTabNavigator({ route }) {
    const { school, role } = route.params;
    const isParent = role === 'parent';
    const { user } = useAuth();
    const { colors, isDarkMode } = useTheme();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .rpc('get_unread_announcements_count', {
                    p_school_id: school.id,
                    p_user_id: user.id
                });

            if (error) {
                console.error('Error fetching unread count:', error);
                return;
            }

            const finalCount = data || 0;
            setUnreadCount(finalCount);

            // Sync with App Icon Badge
            Notifications.setBadgeCountAsync(finalCount);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchUnreadCount();
        }
    }, [isFocused, school.id]);
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                unmountOnBlur: true,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
                    } else if (route.name === 'Announcements') {
                        iconName = focused ? 'bullhorn' : 'bullhorn-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'school' : 'school-outline';
                    } else if (route.name === 'Menu') {
                        iconName = focused ? 'menu' : 'menu';
                    } else if (route.name === 'Schools') {
                        iconName = focused ? 'book-open-page-variant' : 'book-open-page-variant-outline';
                    }

                    return (
                        <View style={focused ? [styles.iconContainerActive, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 144, 217, 0.12)' }] : styles.iconContainer}>
                            <MaterialCommunityIcons name={iconName} size={24} color={color} />
                        </View>
                    );
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: Platform.OS === 'ios' ? 0 : 8,
                },
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: isDarkMode
                        ? (Platform.OS === 'ios' ? 'rgba(26, 32, 44, 0.85)' : '#1a202c')
                        : (Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)'),
                    borderTopWidth: 0,
                    elevation: 0,
                    height: Platform.OS === 'ios' ? (60 + insets.bottom) : (60 + insets.bottom),
                    paddingTop: 8,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    paddingHorizontal: 8,
                    shadowColor: isDarkMode ? '#000000' : '#a3b1c6',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: isDarkMode ? 0.3 : 0.15,
                    shadowRadius: 12,
                },
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView
                            tint={isDarkMode ? "dark" : "light"}
                            intensity={80}
                            style={StyleSheet.absoluteFill}
                        />
                    ) : null
                ),
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="Dashboard"
                initialParams={{ school, role }}
            >
                {props => <PageTransition><SchoolDashboardScreen {...props} /></PageTransition>}
            </Tab.Screen>
            <Tab.Screen
                name="Announcements"
                initialParams={{ school, role }}
                options={{
                    tabBarBadge: unreadCount > 0 ? unreadCount : null,
                    tabBarBadgeStyle: { backgroundColor: '#e53e3e', fontSize: 10, height: 16, minWidth: 16 },
                }}
            >
                {props => <PageTransition><AnnouncementsScreen {...props} /></PageTransition>}
            </Tab.Screen>
            <Tab.Screen
                name="Profile"
                initialParams={{ school, role }}
            >
                {props => <PageTransition><SchoolProfileScreen {...props} /></PageTransition>}
            </Tab.Screen>

            {/* Only show Schools tab for parents */}
            {isParent && (
                <Tab.Screen
                    name="Schools"
                    initialParams={{ school, role }}
                >
                    {props => <PageTransition><MySchoolsScreen {...props} /></PageTransition>}
                </Tab.Screen>
            )}

            <Tab.Screen
                name="Menu"
                initialParams={{ school, role }}
            >
                {props => <PageTransition><SchoolMenuScreen {...props} /></PageTransition>}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 30,
    },
    iconContainerActive: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 30,
        borderRadius: 12,
    },
});
