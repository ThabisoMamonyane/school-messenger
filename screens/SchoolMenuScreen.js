import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResponsiveScreen from '../components/ResponsiveScreen';

export default function SchoolMenuScreen({ navigation, route }) {
    const { school, role } = route.params || {};
    const { signOut } = useAuth();
    const { isDarkMode, toggleTheme, colors } = useTheme();

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

    const { deleteAccount } = useAuth();

    const handleDeleteAccount = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.')) {
                performDelete();
            }
        } else {
            Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: performDelete
                    }
                ]
            );
        }
    };

    const performDelete = async () => {
        try {
            await deleteAccount();
        } catch (error) {
            console.error('Error deleting account:', error);
            Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
        }
    };

    const MenuItem = ({ icon, iconColor, iconBg, title, onPress, danger, trailing }) => (
        <TouchableOpacity
            style={[
                styles.menuItem,
                { backgroundColor: colors.surface, borderColor: colors.border },
                danger && styles.menuItemDanger
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress && !trailing}
        >
            <View style={[styles.menuIconContainer, { backgroundColor: iconBg || (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') }]}>
                <MaterialCommunityIcons name={icon} size={22} color={iconColor || colors.text} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.text }, danger && styles.menuItemTextDanger]}>{title}</Text>
            {trailing ? trailing : (
                <MaterialCommunityIcons name="chevron-right" size={20} color={danger ? "#ff6b6b" : colors.textMuted} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ResponsiveScreen maxWidth={800}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity onPress={handleSwitchSchool} style={styles.headerBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color="#4a90d9" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Menu</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >

                    {/* Admin/Staff Options */}
                    {role !== 'parent' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>SCHOOL MANAGEMENT</Text>

                            <MenuItem
                                icon="account-group-outline"
                                iconColor="#4a90d9"
                                iconBg="rgba(74, 144, 217, 0.15)"
                                title="Manage Staff"
                                onPress={() => navigation.navigate('ManageStaff', { schoolId: school.id, schoolName: school.name })}
                            />

                            <MenuItem
                                icon="cog-outline"
                                iconColor="#6c5ce7"
                                iconBg="rgba(108, 92, 231, 0.15)"
                                title="School Settings"
                                onPress={() => navigation.navigate('Profile', { school, role })}
                            />

                            <MenuItem
                                icon="bookshelf"
                                iconColor="#00b894"
                                iconBg="rgba(0, 184, 148, 0.15)"
                                title="Manage Groups"
                                onPress={() => navigation.navigate('ManageGroups', { schoolId: school.id, schoolName: school.name })}
                            />

                            <View style={styles.divider} />

                            <MenuItem
                                icon="plus-circle-outline"
                                iconColor="#4a90d9"
                                iconBg="rgba(74, 144, 217, 0.1)"
                                title="Register a School"
                                onPress={() => navigation.navigate('CreateSchool')}
                            />
                        </View>
                    )}

                    {/* Support & Settings */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES</Text>
                        <MenuItem
                            icon={isDarkMode ? "weather-night" : "white-balance-sunny"}
                            iconColor={isDarkMode ? "#ffd43b" : "#f59e0b"}
                            title="Dark Mode"
                            trailing={
                                <Switch
                                    value={isDarkMode}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: '#d1dbe8', true: 'rgba(74, 144, 217, 0.5)' }}
                                    thumbColor={isDarkMode ? '#4a90d9' : '#f4f3f4'}
                                />
                            }
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SUPPORT</Text>
                        <MenuItem
                            icon="swap-horizontal"
                            iconColor="#4a90d9"
                            iconBg="rgba(74, 144, 217, 0.15)"
                            title="Switch School"
                            onPress={handleSwitchSchool}
                        />
                        <MenuItem
                            icon="help-circle-outline"
                            iconColor="#6c5ce7"
                            title="Technical Support"
                            onPress={() => navigation.navigate('TechnicalSupport', { schoolId: school.id })}
                        />
                        <MenuItem
                            icon="shield-check-outline"
                            iconColor="#00b894"
                            title="Privacy Policy"
                            onPress={() => navigation.navigate('PrivacyPolicy')}
                        />
                        <MenuItem
                            icon="logout"
                            iconColor="#ff6b6b"
                            title="Sign Out"
                            onPress={handleSignOut}
                            danger
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DANGER ZONE</Text>
                        <MenuItem
                            icon="trash-can-outline"
                            iconColor="#ff6b6b"
                            title="Delete Account"
                            onPress={handleDeleteAccount}
                            danger
                        />
                    </View>
                </ScrollView>
            </ResponsiveScreen>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerBtn: { padding: 4 },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#718096',
        letterSpacing: 0.5,
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
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
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
        backgroundColor: 'rgba(163, 177, 198, 0.2)',
        marginVertical: 16,
        marginHorizontal: 8,
    },
});
