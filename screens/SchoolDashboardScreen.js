import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    const [imageError, setImageError] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);
    const [totalAnnouncements, setTotalAnnouncements] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);

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
            setTotalAnnouncements(allAnnouncements?.length || 0);

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

    const fetchUpcomingEvents = async () => {
        if (!school.id) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('school_events')
                .select('*')
                .eq('school_id', school.id)
                .gte('event_date', today)
                .order('event_date', { ascending: true })
                .limit(5);

            if (error) throw error;
            setUpcomingEvents(data || []);
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardStats();
            fetchMyGroups();
            fetchAllSchools();
            fetchUpcomingEvents();
        }, [user, school.id])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchDashboardStats(),
            fetchMyGroups(),
            fetchAllSchools(),
            fetchUpcomingEvents()
        ]);
        setRefreshing(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ResponsiveScreen maxWidth={800}>
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                >
                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <View style={styles.headerProfile}>
                            {school.avatar_url && !imageError ? (
                                <Image
                                    source={{ uri: school.avatar_url }}
                                    style={styles.headerAvatar}
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <View style={[styles.headerAvatar, { backgroundColor: isDarkMode ? colors.surface : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }]}>
                                    <MaterialCommunityIcons name="school-outline" size={24} color={colors.primary} />
                                </View>
                            )}
                            <View>
                                <Text style={[styles.headerGreeting, { color: colors.text }]}>Hello, {profile?.full_name?.split(' ')[0] || 'User'}</Text>
                                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{role} @ {school.name}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.notificationButton, { backgroundColor: colors.surface }]}
                            onPress={() => navigation.navigate('Announcements')}
                        >
                            <MaterialCommunityIcons name="bell-badge-outline" size={24} color={colors.text} />
                            {unreadCount > 0 && <View style={styles.notificationDot} />}
                        </TouchableOpacity>
                    </View>

                    {/* School Switcher */}
                    {allSchools.length > 1 && (
                        <View style={styles.schoolSwitcherContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schoolSwitcherContent}>
                                {allSchools.map((member) => (
                                    <TouchableOpacity
                                        key={member.id}
                                        style={[
                                            styles.schoolSwitcherItem,
                                            { backgroundColor: colors.surface, borderColor: colors.border },
                                            member.schools.id === school.id && styles.schoolSwitcherItemActive
                                        ]}
                                        onPress={() => {
                                            if (member.schools.id !== school.id) {
                                                navigation.getParent()?.replace('SchoolTabs', { school: member.schools, role: member.role });
                                            }
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Image
                                            source={{ uri: member.schools.avatar_url || 'https://via.placeholder.com/40' }}
                                            style={styles.schoolSwitcherAvatar}
                                        />
                                        <Text style={[
                                            styles.schoolSwitcherName,
                                            { color: colors.textMuted },
                                            member.schools.id === school.id && styles.schoolSwitcherNameActive
                                        ]}>
                                            {member.schools.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Banner Section */}
                    <LinearGradient
                        colors={['#89CFF0', '#4A90D9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bannerContainer}
                    >
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerTitle}>{school.name}</Text>
                            <Text style={styles.bannerText}>
                                Welcome to your digital dashboard. Access your courses, events, and announcements in one place.
                            </Text>
                            <TouchableOpacity
                                style={styles.bannerButton}
                                onPress={() => navigation.navigate('SchoolProfile', { school, role })}
                            >
                                <Text style={styles.bannerButtonText}>View Profile</Text>
                                <MaterialCommunityIcons name="chevron-right" size={16} color="#4A90D9" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.bannerIconContainer}>
                            <MaterialCommunityIcons name="trophy-award" size={80} color="rgba(255,255,255,0.3)" />
                        </View>
                    </LinearGradient>

                    {/* Stats Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dashboard Stats</Text>
                        <TouchableOpacity onPress={onRefresh}>
                            <Text style={[styles.seeAllText, { color: colors.textMuted }]}>Refresh</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsRow}>
                        {/* Announcements Card (Unread Only) */}
                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: colors.surface }]}
                            onPress={() => navigation.navigate('Announcements')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.statRing, { borderColor: '#8B5CF6' }]}>
                                <View style={[styles.statRingInner, { backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#F3E8FF' }]}>
                                    <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#8B5CF6" />
                                </View>
                            </View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{unreadCount}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>Announcements</Text>
                        </TouchableOpacity>

                        {/* Upcoming Events Card */}
                        <TouchableOpacity
                            style={[styles.statCard, { backgroundColor: colors.surface }]}
                            onPress={() => navigation.navigate('SchoolCalendar', { school })}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.statRing, { borderColor: '#4A90D9' }]}>
                                <View style={[styles.statRingInner, { backgroundColor: isDarkMode ? 'rgba(74, 144, 217, 0.2)' : '#EBF8FF' }]}>
                                    <MaterialCommunityIcons name="calendar-check-outline" size={24} color="#4A90D9" />
                                </View>
                            </View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{upcomingEvents.length}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>Calendar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* My Groups Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Groups</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ManageGroups', { schoolId: school.id, schoolName: school.name, role: role })}>
                            <Text style={[styles.seeAllText, { color: colors.textMuted }]}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {myGroups.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No groups joined yet</Text>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsList}>
                            {myGroups.map((group, index) => {
                                // Rotate gradients for a dynamic look
                                const gradients = [
                                    ['#A78BFA', '#8B5CF6'], // Purple
                                    ['#FBBF24', '#F59E0B'], // Amber
                                    ['#34D399', '#10B981'], // Emerald
                                    ['#60A5FA', '#3B82F6'], // Blue
                                ];
                                const gradient = gradients[index % gradients.length];

                                return (
                                    <TouchableOpacity
                                        key={group.id}
                                        onPress={() => navigation.navigate('GroupChat', { group, schoolId: school.id })}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={gradient}
                                            style={styles.groupCard}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <View style={styles.groupIconBg}>
                                                <MaterialCommunityIcons name="account-group-outline" size={20} color={gradient[1]} />
                                            </View>
                                            <Text style={styles.groupCardTitle} numberOfLines={2}>{group.name}</Text>
                                            <Text style={styles.groupCardSubtitle}>
                                                <MaterialCommunityIcons name="account-outline" size={14} color="rgba(255,255,255,0.8)" /> Member
                                            </Text>

                                            <View style={styles.groupArrow}>
                                                <MaterialCommunityIcons name="arrow-right-circle" size={32} color="rgba(255,255,255,0.9)" />
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Recent Activity List */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
                            <Text style={[styles.seeAllText, { color: colors.textMuted }]}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.activityList, { backgroundColor: colors.surface }]}>
                        {recentActivity.length === 0 ? (
                            <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>No recent activity</Text>
                        ) : (
                            recentActivity.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.activityItem}
                                    onPress={() => navigation.navigate('Announcements')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.activityIconContainer, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.2)' : '#E0F2FE' }]}>
                                        <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#0EA5E9" />
                                    </View>
                                    <View style={styles.activityContent}>
                                        <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                                        <Text style={[styles.activitySubtitle, { color: colors.textMuted }]}>{formatDate(item.created_at)}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.activityActionBtn}>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {/* School Switcher (Re-added at bottom or accessible via header if needed, keeping simple matching design for now) */}

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
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    headerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: '#e2e8f0'
    },
    headerGreeting: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    bannerContainer: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 160,
    },
    bannerContent: {
        zIndex: 2,
        flex: 1,
        paddingRight: 60,
    },
    bannerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    bannerText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 16,
        lineHeight: 18,
    },
    bannerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    bannerButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4A90D9',
        marginRight: 4,
    },
    bannerIconContainer: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        zIndex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    seeAllText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statRing: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statRingInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    groupsList: {
        marginBottom: 32,
        overflow: 'visible',
    },
    groupCard: {
        width: 160,
        height: 180,
        borderRadius: 24,
        padding: 20,
        marginRight: 16,
        justifyContent: 'space-between',
    },
    groupIconBg: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 12,
    },
    groupCardSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    groupArrow: {
        alignItems: 'flex-end',
        marginTop: 12,
    },
    emptyState: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 32,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    activityList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 8,
        marginBottom: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 8,
    },
    activityIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    activitySubtitle: {
        fontSize: 12,
        color: '#94A3B8',
    },
    activityActionBtn: {
        padding: 8,
    },
    schoolSwitcherContainer: {
        marginBottom: 20,
    },
    schoolSwitcherContent: {
        paddingRight: 10,
    },
    schoolSwitcherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 24,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    schoolSwitcherItemActive: {
        backgroundColor: '#4A90D9',
        borderColor: '#4A90D9',
    },
    schoolSwitcherAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
        backgroundColor: '#F1F5F9'
    },
    schoolSwitcherName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    schoolSwitcherNameActive: {
        color: '#FFFFFF',
    },
});
