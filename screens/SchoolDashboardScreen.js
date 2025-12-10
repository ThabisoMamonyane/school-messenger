import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function SchoolDashboardScreen({ route, navigation }) {
    const { school, role } = route.params;
    const { user } = useAuth();
    const [allSchools, setAllSchools] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [loading, setLoading] = useState(false);
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



    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* School Switcher - Pinned to Top */}
            {allSchools.length > 1 && (
                <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                    <View style={styles.switcherSection}>
                        <Text style={styles.switcherLabel}>SWITCH SCHOOL</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {allSchools.map((item) => {
                                const isActive = item.schools.id === school.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.schoolChip,
                                            isActive && styles.schoolChipActive
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
                                            isActive && styles.schoolChipIconActive
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
                                                isActive && styles.schoolChipNameActive
                                            ]}>
                                                {item.schools.name}
                                            </Text>
                                            <Text style={styles.schoolChipRole}>{item.role}</Text>
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
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >

                {/* School Header */}
                <View style={styles.headerCard}>
                    <Text style={styles.schoolName}>{school.name}</Text>
                    <Text style={styles.schoolAddress}>{school.address}, {school.province}</Text>
                    <Text style={styles.dashboardBadgeText}>{role.toUpperCase()} DASHBOARD</Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsCard}>
                    <View style={styles.statsIcon}>
                        <Ionicons name="notifications-outline" size={24} color="#4a90d9" />
                    </View>
                    <View>
                        <Text style={styles.statsLabel}>Quick Stats</Text>
                        <Text style={styles.statsText}>
                            You have <Text style={styles.statsHighlight}>{unreadCount}</Text> unread announcement{unreadCount !== 1 ? 's' : ''}.
                        </Text>
                    </View>
                </View>

                {/* My Groups */}
                <View style={styles.groupsCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="people-outline" size={24} color="#6c5ce7" />
                        </View>
                        <Text style={styles.cardTitle}>My Groups</Text>
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
                                    style={styles.groupItem}
                                    onPress={() => navigation.navigate('GroupChat', { group, schoolId: school.id })}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.groupIcon}>
                                        <Ionicons name="chatbubbles" size={20} color="#ffffff" />
                                    </View>
                                    <Text style={styles.groupName} numberOfLines={2}>{group.name}</Text>
                                    <View style={styles.arrowIcon}>
                                        <Ionicons name="arrow-forward" size={14} color="#a3b1c6" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Recent Activity */}
                <View style={styles.activityCard}>
                    <Text style={styles.activityTitle}>Recent Activity</Text>

                    {recentActivity.length === 0 ? (
                        <View style={styles.emptyActivity}>
                            <Ionicons name="time-outline" size={32} color="#a3b1c6" />
                            <Text style={styles.emptyText}>No recent activity to show.</Text>
                        </View>
                    ) : (
                        <View>
                            {recentActivity.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.activityItem,
                                        index !== recentActivity.length - 1 && styles.activityItemBorder
                                    ]}
                                    onPress={() => navigation.navigate('Announcements')}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.activityIcon}>
                                        <Ionicons name="megaphone-outline" size={20} color="#f59e0b" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.activityItemTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.activityItemContent} numberOfLines={2}>{item.content}</Text>
                                    </View>
                                    <Text style={styles.activityItemDate}>{formatDate(item.created_at)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
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
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
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
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
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
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
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
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
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
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
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
