import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation, route }) {
    const { signOut, user, profile, passwordResetPending } = useAuth();
    const [mySchools, setMySchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isParent, setIsParent] = useState(false);

    // Handle password reset navigation
    useEffect(() => {
        if (passwordResetPending) {
            navigation.navigate('UpdatePassword');
        }
    }, [passwordResetPending]);

    // Check if we should stay on this screen (e.g. after "Switch School")
    const stayOnScreen = route.params?.stayOnScreen;

    const fetchMySchools = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('school_members')
                .select(`
                    id,
                    role,
                    schools (
                        id,
                        name,
                        address,
                        province
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            const schools = data || [];
            setMySchools(schools);

            // Determine if user is a parent (all roles are 'parent' or no schools)
            const hasStaffRole = schools.some(item =>
                item.role === 'admin' ||
                item.role === 'teacher' ||
                item.role === 'communications_officer'
            );
            setIsParent(!hasStaffRole);

            // Auto-navigate if user has schools and we're not explicitly staying
            if (schools.length > 0 && !stayOnScreen && !passwordResetPending) {
                // Navigate to the first school
                const firstSchool = schools[0];
                navigation.reset({
                    index: 0,
                    routes: [{
                        name: 'SchoolTabs',
                        params: { school: firstSchool.schools, role: firstSchool.role }
                    }],
                });
            }

        } catch (error) {
            console.error('Error fetching schools:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchMySchools();
        }, [user, stayOnScreen])
    );

    const handleLeaveSchool = (schoolMemberId, schoolName) => {
        Alert.alert(
            'Leave School',
            `Are you sure you want to leave ${schoolName}? You can rejoin anytime.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Optimistically remove from UI
                            setMySchools(prev => prev.filter(item => item.id !== schoolMemberId));

                            const { error } = await supabase
                                .from('school_members')
                                .delete()
                                .eq('id', schoolMemberId);

                            if (error) throw error;

                            Alert.alert('Success', `You have left ${schoolName}`);

                            // Wait a moment then refetch to ensure consistency
                            setTimeout(() => {
                                fetchMySchools();
                            }, 500);
                        } catch (error) {
                            console.error('Error leaving school:', error);
                            Alert.alert('Error', error.message);
                            // Refetch on error to restore correct state
                            fetchMySchools();
                        }
                    }
                }
            ]
        );
    };

    const renderSchoolItem = ({ item }) => (
        <View style={styles.schoolCard}>
            <TouchableOpacity
                onPress={() => navigation.navigate('SchoolTabs', { school: item.schools, role: item.role })}
                activeOpacity={0.7}
            >
                <View style={styles.schoolCardInner}>
                    <View style={styles.schoolIcon}>
                        <Ionicons name="school-outline" size={24} color="#4a90d9" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.schoolName}>{item.schools.name}</Text>
                        <Text style={styles.schoolAddress}>{item.schools.address}</Text>
                        <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#a3b1c6" />
                </View>
            </TouchableOpacity>

            {/* Show leave button for parents only */}
            {item.role === 'parent' && (
                <TouchableOpacity
                    style={styles.leaveButton}
                    onPress={() => handleLeaveSchool(item.id, item.schools.name)}
                >
                    <Text style={styles.leaveButtonText}>Leave School</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // If auto-navigating, show loading
    if (loading && !stayOnScreen && mySchools.length > 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#4a90d9" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome!</Text>
                        <Text style={styles.userName}>{profile?.full_name || user?.email}</Text>
                    </View>
                    {isParent && (
                        <View style={styles.parentBadge}>
                            <Text style={styles.parentBadgeText}>Parent Account</Text>
                        </View>
                    )}
                </View>

                {/* My Schools Section */}
                <View style={{ flex: 1, marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>My Schools</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#4a90d9" style={{ marginTop: 40 }} />
                    ) : mySchools.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="school-outline" size={48} color="#a3b1c6" />
                            </View>
                            <Text style={styles.emptyText}>
                                {isParent
                                    ? "You haven't joined any schools yet."
                                    : "You haven't joined any schools yet."}
                            </Text>
                            {isParent && (
                                <Text style={styles.emptyHint}>
                                    Tap "Find Schools" below to get started!
                                </Text>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={mySchools}
                            renderItem={renderSchoolItem}
                            keyExtractor={item => item.schools.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    {/* Admin Dashboard Button - Only visible to App Admins */}
                    {profile?.is_app_admin && (
                        <TouchableOpacity
                            style={styles.adminButton}
                            onPress={() => navigation.navigate('AdminDashboard')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="settings-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={styles.adminButtonText}>Admin Dashboard</Text>
                        </TouchableOpacity>
                    )}

                    {/* Find Schools - For Parents */}
                    {isParent && (
                        <TouchableOpacity
                            style={styles.findButton}
                            onPress={() => navigation.navigate('FindSchools')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="search-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={styles.findButtonText}>Find Schools</Text>
                        </TouchableOpacity>
                    )}

                    {/* Register School - For Parents to create a new school */}
                    {isParent && (
                        <TouchableOpacity
                            style={styles.registerSchoolButton}
                            onPress={() => navigation.navigate('CreateSchool')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={styles.registerSchoolButtonText}>Register a School</Text>
                        </TouchableOpacity>
                    )}

                    {/* Technical Support - Always visible */}
                    <TouchableOpacity
                        style={styles.supportButton}
                        onPress={() => navigation.navigate('TechnicalSupport')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="help-circle-outline" size={20} color="#6c5ce7" style={{ marginRight: 8 }} />
                        <Text style={styles.supportButtonText}>Technical Support</Text>
                    </TouchableOpacity>

                    {/* Sign Out - Only show if no schools (otherwise it's in the menu) */}
                    {mySchools.length === 0 && (
                        <TouchableOpacity
                            style={styles.signOutButton}
                            onPress={signOut}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#ff6b6b" style={{ marginRight: 8 }} />
                            <Text style={styles.signOutButtonText}>Sign Out</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8eef5',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2d3748',
    },
    userName: {
        fontSize: 16,
        color: '#4a5568',
        marginTop: 4,
    },
    parentBadge: {
        backgroundColor: 'rgba(0, 184, 148, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 184, 148, 0.3)',
    },
    parentBadgeText: {
        color: '#00b894',
        fontSize: 12,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 16,
    },
    schoolCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    schoolCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    schoolIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(74, 144, 217, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    schoolName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2d3748',
    },
    schoolAddress: {
        fontSize: 14,
        color: '#718096',
        marginTop: 2,
    },
    roleText: {
        color: '#4a90d9',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 6,
    },
    leaveButton: {
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.2)',
    },
    leaveButtonText: {
        color: '#ff6b6b',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 60,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(163, 177, 198, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        color: '#718096',
        fontStyle: 'italic',
        marginBottom: 8,
        fontSize: 15,
    },
    emptyHint: {
        color: '#a0aec0',
        fontSize: 14,
    },
    actionsContainer: {
        paddingBottom: 20,
    },
    adminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6c5ce7',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#5b4cdb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    adminButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    findButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00b894',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#00a381',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    findButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    registerSchoolButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4a90d9',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    registerSchoolButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(108, 92, 231, 0.3)',
    },
    supportButtonText: {
        color: '#6c5ce7',
        fontWeight: '700',
        fontSize: 16,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    signOutButtonText: {
        color: '#ff6b6b',
        fontWeight: '700',
        fontSize: 16,
    },
});
