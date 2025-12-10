import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

import SchoolDashboardScreen from '../screens/SchoolDashboardScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import SchoolProfileScreen from '../screens/SchoolProfileScreen';
import SchoolMenuScreen from '../screens/SchoolMenuScreen';
import MySchoolsScreen from '../screens/MySchoolsScreen';

const Tab = createBottomTabNavigator();

export default function SchoolTabNavigator({ route }) {
    const { school, role } = route.params;
    const isParent = role === 'parent';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Announcements') {
                        iconName = focused ? 'megaphone' : 'megaphone-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'school' : 'school-outline';
                    } else if (route.name === 'Menu') {
                        iconName = focused ? 'menu' : 'menu-outline';
                    } else if (route.name === 'Schools') {
                        iconName = focused ? 'albums' : 'albums-outline';
                    }

                    return (
                        <View style={focused ? styles.iconContainerActive : styles.iconContainer}>
                            <Ionicons name={iconName} size={22} color={color} />
                        </View>
                    );
                },
                tabBarActiveTintColor: '#4a90d9',
                tabBarInactiveTintColor: '#718096',
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: Platform.OS === 'ios' ? 0 : 8,
                },
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: Platform.OS === 'ios' ? 85 : 70,
                    paddingTop: 8,
                    paddingHorizontal: 8,
                    shadowColor: '#a3b1c6',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                },
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView
                            tint="light"
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
                component={SchoolDashboardScreen}
                initialParams={{ school, role }}
            />
            <Tab.Screen
                name="Announcements"
                component={AnnouncementsScreen}
                initialParams={{ school, role }}
            />
            <Tab.Screen
                name="Profile"
                component={SchoolProfileScreen}
                initialParams={{ school, role }}
            />

            {/* Only show Schools tab for parents */}
            {isParent && (
                <Tab.Screen
                    name="Schools"
                    component={MySchoolsScreen}
                    initialParams={{ school, role }}
                />
            )}

            <Tab.Screen
                name="Menu"
                component={SchoolMenuScreen}
                initialParams={{ school, role }}
            />
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
        backgroundColor: 'rgba(74, 144, 217, 0.12)',
        borderRadius: 12,
    },
});
