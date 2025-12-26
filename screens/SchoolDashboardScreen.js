import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import ResponsiveScreen from '../components/ResponsiveScreen';

export default function SchoolDashboardScreen({ route, navigation }) {
    const { school, role } = route.params;
    const { user, profile } = useAuth();
    const { colors, isDarkMode } = useTheme();
    const [allSchools, setAllSchools] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const [unreadCount, setUnreadCount] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);

    const fetchAllSchools = async () => {
        if (!user) return;
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
                        province,
                        avatar_url
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            setAllSchools(data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
        }
    };

    const fetchMyGroups = async () => {
        if (!user || !school.id) return;
        try {
            // Step 1: Get all group IDs where I am a member
            const { data: memberData, error: memberError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            if (memberError) throw memberError;

            if (!memberData || memberData.length === 0) {
                setMyGroups([]);
                return;
            }

            const groupIds = memberData.map(m => m.group_id);

            // Step 2: Get details for these groups, filtering by the current school
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('*')
                .in('id', groupIds)
                .eq('school_id', school.id)
                .order('created_at', { ascending: false });

            if (groupsError) throw groupsError;

            setMyGroups(groupsData || []);
        } catch (error) {
            console.error('Error fetching dashboard groups:', error);
            setErrorMsg(error.message || 'Error loading groups');
        }
    };

    const fetchDashboardStats = async () => {
        if (!user || !school.id) return;
        try {
            // 1. Get Unread Count
            const { data: allAnnouncements, error: annError } = await supabase
                .from('announcements')
                .select('id')
                .eq('school_id', school.id);

            if (annError) throw annError;

            // Get reads for this user
            const { data: reads, error: readsError } = await supabase
                .from('announcement_reads')
                .select('announcement_id')
                .eq('user_id', user.id);

            if (readsError) throw readsError;

            const readIds = new Set(reads?.map(r => r.announcement_id));
            const unread = allAnnouncements?.filter(a => !readIds.has(a.id)).length || 0;
            setUnreadCount(unread);

            // 2. Get Recent Activity (Latest 3 announcements)
            const { data: recent, error: recentError } = await supabase
                .from('announcements')
                .select('id, title, created_at, content')
                .eq('school_id', school.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (recentError) throw recentError;
            setRecentActivity(recent || []);

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardStats();
            fetchMyGroups();
            fetchAllSchools();
        }, [user, school.id])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchDashboardStats(),
            fetchMyGroups(),
            fetchAllSchools()
        ]);
        setRefreshing(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveScreen maxWidth={800}>
                {/* School Switcher - Pinned to Top */}
                {allSchools.length > 1 && (
                    <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                        <View style={styles.switcherSection}>
                            <Text style={[styles.switcherLabel, { color: colors.textMuted }]}>SWITCH SCHOOL</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {allSchools.map((item) => {
                                    const isActive = item.schools.id === school.id;
                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[
                                                styles.schoolChip,
                                                { backgroundColor: colors.surface, borderColor: colors.border },
                                                isActive && { backgroundColor: isDarkMode ? 'rgba(99, 179, 237, 0.15)' : 'rgba(74, 144, 217, 0.1)' }
                                            ]}
                                            onPress={() => {
                                                if (!isActive) {
                                                    navigation.getParent()?.replace('SchoolTabs', { school: item.schools, role: item.role });
                                                }
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[
                                                styles.schoolChipIcon,
                                                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                                                isActive && { backgroundColor: isDarkMode ? 'rgba(99, 179, 237, 0.2)' : 'rgba(74, 144, 217, 0.15)' }
                                            ]}>
                                                {item.schools.avatar_url ? (
                                                    <Image
                                                        source={{ uri: item.schools.avatar_url }}
                                                        style={{ width: 32, height: 32, borderRadius: 10 }}
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name="school"
                                                        size={18}
                                                        color={isActive ? "#4a90d9" : "#a0aec0"}
                                                    />
                                                )}
                                            </View>
                                            <View style={{ marginRight: 8 }}>
                                                <Text style={[
                                                    styles.schoolChipName,
                                                    { color: colors.text },
                                                    isActive && { color: colors.primary }
                                                ]}>
                                                    {item.schools.name}
                                                </Text>
                                                <Text style={[styles.schoolChipRole, { color: colors.textMuted }]}>{item.role}</Text>
                                            </View>

                                            {isActive && (
                                                <Ionicons name="checkmark-circle" size={20} color="#4a90d9" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>
                )}

                <ScrollView
                    style={[styles.scrollView, { backgroundColor: colors.background }]}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                >

                    {/* School Header */}
                    <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.welcomeGreeting, { color: colors.primary }]}>Welcome, {profile?.full_name || 'User'}</Text>
                        <Text style={[styles.schoolName, { color: colors.text }]}>{school.name}</Text>
                        <Text style={[styles.schoolAddress, { color: colors.textMuted }]}>{school.address}, {school.province}</Text>
                        <Text style={[styles.dashboardBadgeText, { color: colors.primary }]}>{role.toUpperCase()} DASHBOARD</Text>
                    </View>

                    {/* Quick Stats */}
                    <View style={[styles.statsCard, { backgroundColor: isDarkMode ? 'rgba(99, 179, 237, 0.1)' : 'rgba(74, 144, 217, 0.1)', borderColor: isDarkMode ? 'rgba(99, 179, 237, 0.2)' : 'rgba(74, 144, 217, 0.2)' }]}>
                        <View style={[styles.statsIcon, { backgroundColor: isDarkMode ? 'rgba(99, 179, 237, 0.15)' : 'rgba(74, 144, 217, 0.15)' }]}>
                            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.statsLabel, { color: colors.primary }]}>Quick Stats</Text>
                            <Text style={[styles.statsText, { color: colors.text }]}>
                                You have <Text style={[styles.statsHighlight, { color: colors.primary }]}>{unreadCount}</Text> unread announcement{unreadCount !== 1 ? 's' : ''}.
                            </Text>
                        </View>
                    </View>

                    {/* My Groups */}
                    <View style={[styles.groupsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardIconContainer, { backgroundColor: isDarkMode ? 'rgba(108, 92, 231, 0.2)' : 'rgba(108, 92, 231, 0.15)' }]}>
                                <Ionicons name="people-outline" size={24} color="#6c5ce7" />
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>My Groups</Text>
                        </View>

                        {errorMsg ? (
                            <Text style={{ color: '#e53e3e', fontStyle: 'italic', marginVertical: 8 }}>{errorMsg}</Text>
                        ) : myGroups.length === 0 ? (
                            <Text style={styles.emptyText}>You haven't joined any groups yet.</Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsList}>
                                {myGroups.map((group) => (
                                    <TouchableOpacity
                                        key={group.id}
                                        style={[styles.groupItem, { backgroundColor: isDarkMode ? '#2d3748' : '#ffffff' }]}
                                        onPress={() => navigation.navigate('GroupChat', { group, schoolId: school.id })}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.groupIcon}>
                                            <Ionicons name="chatbubbles" size={20} color="#ffffff" />
                                        </View>
                                        <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={2}>{group.name}</Text>
                                        <View style={styles.arrowIcon}>
                                            <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* Recent Activity */}
                    <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.activityTitle, { color: colors.text }]}>Recent Activity</Text>

                        {recentActivity.length === 0 ? (
                            <View style={styles.emptyActivity}>
                                <Ionicons name="time-outline" size={32} color={colors.textMuted} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No recent activity to show.</Text>
                            </View>
                        ) : (
                            <View>
                                {recentActivity.map((item, index) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.activityItem,
                                            index !== recentActivity.length - 1 && [styles.activityItemBorder, { borderBottomColor: colors.border }]
                                        ]}
                                        onPress={() => navigation.navigate('Announcements')}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.activityIcon, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)' }]}>
                                            <Ionicons name="megaphone-outline" size={20} color="#f59e0b" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.activityItemTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                                            <Text style={[styles.activityItemContent, { color: colors.textMuted }]} numberOfLines={2}>{item.content}</Text>
                                        </View>
                                        <Text style={[styles.activityItemDate, { color: colors.textMuted }]}>{formatDate(item.created_at)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
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
    switcherSection: {
        marginBottom: 20,
    },
    switcherLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#718096',
        letterSpacing: 1,
        marginBottom: 10,
    },
    schoolChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 16,
        padding: 12,
        marginRight: 12,
        minWidth: 160,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    schoolChipActive: {
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        borderColor: 'rgba(74, 144, 217, 0.3)',
    },
    schoolChipIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(163, 177, 198, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    schoolChipIconActive: {
        backgroundColor: 'rgba(74, 144, 217, 0.15)',
    },
    schoolChipName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4a5568',
    },
    schoolChipNameActive: {
        color: '#4a90d9',
    },
    schoolChipRole: {
        fontSize: 11,
        color: '#718096',
        textTransform: 'capitalize',
    },
    headerCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    welcomeGreeting: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4a90d9',
        marginBottom: 8,
    },
    schoolName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2d3748',
    },
    schoolAddress: {
        fontSize: 15,
        color: '#718096',
        marginTop: 4,
    },
    dashboardBadgeText: {
        color: '#4a90d9',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 12,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 217, 0.2)',
    },
    statsIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(74, 144, 217, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    statsLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4a90d9',
        marginBottom: 4,
    },
    statsText: {
        fontSize: 14,
        color: '#4a5568',
    },
    statsHighlight: {
        fontWeight: '700',
        color: '#4a90d9',
    },
    activityCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    activityTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 16,
    },
    emptyActivity: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        color: '#718096',
        fontStyle: 'italic',
        marginTop: 8,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    activityItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(163, 177, 198, 0.2)',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    activityItemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3748',
    },
    activityItemContent: {
        fontSize: 13,
        color: '#718096',
        marginTop: 2,
    },
    activityItemDate: {
        fontSize: 11,
        color: '#a0aec0',
        marginLeft: 8,
    },
    groupsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(108, 92, 231, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3748',
    },
    groupsList: {
        flexDirection: 'row',
    },
    groupItem: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginRight: 12,
        width: 140,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    groupIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#6c5ce7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    groupName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 8,
        height: 40,
    },
    arrowIcon: {
        alignItems: 'flex-end',
    },
});
