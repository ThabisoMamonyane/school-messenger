import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function SchoolMenuScreen({ navigation, route }) {
    const { school, role } = route.params || {};
    const { signOut } = useAuth();
    const { expoPushToken } = usePushNotifications(); // Get current token

    const handleSwitchSchool = () => {
        navigation.getParent().navigate('Home', { stayOnScreen: true });
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    const testLocalNotification = async () => {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "🔔 Test Production Notification",
                    body: "If you see this, the device channel is working!",
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.MAX,
                },
                trigger: null, // show immediately
            });
            Alert.alert('Sent', 'A local notification was sent.');
        } catch (error) {
            Alert.alert('Error', 'Failed to schedule local notification: ' + error.message);
        }
    };

    const showPushToken = () => {
        if (expoPushToken) {
            Alert.alert(
                'Production Push Token',
                expoPushToken,
                [
                    { text: 'OK' },
                    {
                        text: 'Copy',
                        onPress: () => {
                            console.log('Token:', expoPushToken);
                        }
                    }
                ]
            );
        } else {
            Alert.alert('No Token', 'This device does not have a push token yet. (Is permission granted?)');
        }
    };

    const MenuItem = ({ icon, iconColor, iconBg, title, onPress, danger }) => (
        <TouchableOpacity
            style={[styles.menuItem, danger && styles.menuItemDanger]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIconContainer, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <Text style={[styles.menuItemText, danger && styles.menuItemTextDanger]}>{title}</Text>
            <Ionicons name="chevron-forward" size={20} color={danger ? "#ff6b6b" : "#a3b1c6"} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <TouchableOpacity
                    onPress={handleSwitchSchool}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#4a90d9" />
                    <Text style={styles.backText}>Switch School</Text>
                </TouchableOpacity>

                {/* Admin/Staff Options */}
                {role !== 'parent' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>SCHOOL MANAGEMENT</Text>

                        <MenuItem
                            icon="people-outline"
                            iconColor="#4a90d9"
                            iconBg="rgba(74, 144, 217, 0.15)"
                            title="Manage Staff"
                            onPress={() => navigation.navigate('ManageStaff', { schoolId: school.id, schoolName: school.name })}
                        />

                        <MenuItem
                            icon="settings-outline"
                            iconColor="#6c5ce7"
                            iconBg="rgba(108, 92, 231, 0.15)"
                            title="School Settings"
                            onPress={() => navigation.navigate('Profile', { school, role })}
                        />

                        <MenuItem
                            icon="library-outline"
                            iconColor="#00b894"
                            iconBg="rgba(0, 184, 148, 0.15)"
                            title="Manage Groups"
                            onPress={() => navigation.navigate('ManageGroups', { schoolId: school.id, schoolName: school.name })}
                        />

                        <View style={styles.divider} />

                        <MenuItem
                            icon="add-circle-outline"
                            iconColor="#4a90d9"
                            iconBg="rgba(74, 144, 217, 0.1)"
                            title="Register a School"
                            onPress={() => navigation.navigate('CreateSchool')}
                        />
                    </View>
                )}

                {/* Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SUPPORT</Text>
                    <MenuItem
                        icon="help-circle-outline"
                        iconColor="#6c5ce7"
                        iconBg="rgba(108, 92, 231, 0.15)"
                        title="Technical Support"
                        onPress={() => navigation.navigate('TechnicalSupport')}
                    />
                </View>

                {/* DEBUG SECTION (TEMPORARY FOR DIAGNOSTICS) */}
                <View style={{ marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#f56565' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#f56565', marginBottom: 8, textTransform: 'uppercase' }}>Diagnostics</Text>

                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={testLocalNotification}>
                        <View style={[styles.menuIconContainer, { backgroundColor: '#fed7e2' }]}>
                            <Ionicons name="notifications" size={22} color="#d53f8c" />
                        </View>
                        <Text style={styles.menuItemText}>Test Local Notification</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={showPushToken}>
                        <View style={[styles.menuIconContainer, { backgroundColor: '#bee3f8' }]}>
                            <Ionicons name="code" size={22} color="#3182ce" />
                        </View>
                        <Text style={styles.menuItemText}>Show Production Token</Text>
                    </TouchableOpacity>
                </View>

                {/* Sign Out */}
                <View style={styles.section}>
                    <MenuItem
                        icon="log-out-outline"
                        iconColor="#ff6b6b"
                        iconBg="rgba(255, 107, 107, 0.15)"
                        title="Sign Out"
                        onPress={handleSignOut}
                        danger
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8eef5',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backText: {
        color: '#4a90d9',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#718096',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    menuItemDanger: {
        backgroundColor: 'rgba(255, 107, 107, 0.08)',
        borderColor: 'rgba(255, 107, 107, 0.2)',
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3748',
    },
    menuItemTextDanger: {
        color: '#ff6b6b',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(163, 177, 198, 0.3)',
        marginVertical: 16,
    },
});
