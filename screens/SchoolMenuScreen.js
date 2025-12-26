import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
            disabled={!onPress}
        >
            <View style={[styles.menuIconContainer, { backgroundColor: iconBg || (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') }]}>
                <Ionicons name={icon} size={22} color={iconColor || colors.text} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.text }, danger && styles.menuItemTextDanger]}>{title}</Text>
            {trailing ? trailing : (
                <Ionicons name="chevron-forward" size={20} color={danger ? "#ff6b6b" : colors.textMuted} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveScreen maxWidth={800}>
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

                    {/* Support & Settings */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES</Text>
                        <MenuItem
                            icon={isDarkMode ? "moon" : "sunny-outline"}
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
                            icon="help-circle-outline"
                            iconColor="#6c5ce7"
                            title="Technical Support"
                            onPress={() => navigation.navigate('TechnicalSupport', { schoolId: school.id })}
                        />
                        <MenuItem
                            icon="shield-checkmark-outline"
                            iconColor="#00b894"
                            title="Privacy Policy"
                            onPress={() => navigation.navigate('PrivacyPolicy')}
                        />
                        <MenuItem
                            icon="log-out-outline"
                            iconColor="#ff6b6b"
                            title="Sign Out"
                            onPress={handleSignOut}
                            danger
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DANGER ZONE</Text>
                        <MenuItem
                            icon="trash-outline"
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
