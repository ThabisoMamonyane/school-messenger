import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ResponsiveScreen from '../components/ResponsiveScreen';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function AnnouncementsScreen({ navigation, route }) {
    const { school, role } = route.params;
    const { user } = useAuth();
    const { colors, isDarkMode } = useTheme();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [readAnnouncementIds, setReadAnnouncementIds] = useState(new Set());
    const [expandedAnnouncementIds, setExpandedAnnouncementIds] = useState(new Set());

    const categories = ['All', 'News', 'Academic', 'Sport', 'Letters', 'Homework', 'General'];

    const fetchAnnouncements = async () => {
        try {
            const { data: announcementsData, error: announcementsError } = await supabase
                .from('announcements')
                .select(`
                    *,
                    author:author_id (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('school_id', school.id)
                .order('created_at', { ascending: false });

            if (announcementsError) throw announcementsError;

            const { data: readData, error: readError } = await supabase
                .from('announcement_reads')
                .select('announcement_id')
                .eq('user_id', user.id);

            if (readError) throw readError;

            setAnnouncements(announcementsData || []);
            setReadAnnouncementIds(new Set(readData.map(item => item.announcement_id)));
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Update App Badge when list or reads change
    useEffect(() => {
        if (Platform.OS === 'web') return;
        const unreadCount = announcements.length - readAnnouncementIds.size;
        Notifications.setBadgeCountAsync(unreadCount > 0 ? unreadCount : 0);
    }, [announcements, readAnnouncementIds]);

    useFocusEffect(
        useCallback(() => {
            fetchAnnouncements();

            // Realtime: Listen for new announcements
            const channel = supabase
                .channel(`school_announcements:${school.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'announcements',
                        filter: `school_id=eq.${school.id}`,
                    },
                    (payload) => {
                        console.log('New announcement received via realtime:', payload);
                        // Trigger fetch to get full details (with author)
                        fetchAnnouncements();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }, [school.id])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnnouncements();
    };

    const canCreate = ['admin', 'teacher', 'communications_officer'].includes(role);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now - date) / 1000;

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const markAsRead = async (announcementId) => {
        if (readAnnouncementIds.has(announcementId)) return;

        const newReadIds = new Set(readAnnouncementIds);
        newReadIds.add(announcementId);
        setReadAnnouncementIds(newReadIds);

        try {
            const { error } = await supabase
                .from('announcement_reads')
                .insert({
                    user_id: user.id,
                    announcement_id: announcementId
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error marking announcement as read:', error);
            const revertedIds = new Set(readAnnouncementIds);
            revertedIds.delete(announcementId);
            setReadAnnouncementIds(revertedIds);
        }
    };

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newExpandedIds = new Set(expandedAnnouncementIds);
        if (newExpandedIds.has(id)) {
            newExpandedIds.delete(id);
        } else {
            newExpandedIds.add(id);
            markAsRead(id);
        }
        setExpandedAnnouncementIds(newExpandedIds);
    };

    const getCategoryColor = (cat) => {
        const categoryThemes = {
            'News': { bg: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', text: isDarkMode ? '#ff8787' : '#ef4444' },
            'Academic': { bg: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', text: isDarkMode ? '#93c5fd' : '#3b82f6' },
            'Sport': { bg: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)', text: isDarkMode ? '#8ce99a' : '#22c55e' },
            'Letters': { bg: isDarkMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)', text: isDarkMode ? '#d8b4fe' : '#a855f7' },
            'Homework': { bg: isDarkMode ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)', text: isDarkMode ? '#ffc078' : '#f97316' },
            'General': { bg: isDarkMode ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)', text: isDarkMode ? '#cbd5e0' : '#6b7280' },
        };
        return categoryThemes[cat] || categoryThemes['General'];
    };

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveScreen maxWidth={800}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Announcements</Text>

                    {canCreate ? (
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={() => setModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={24} color="#ffffff" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 44 }} />
                    )}
                </View>

                {/* Category Filter */}
                <View style={[styles.filterContainer, { backgroundColor: colors.surfaceActive, borderBottomColor: colors.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.filterChip,
                                        { backgroundColor: colors.surface, borderColor: colors.border },
                                        selectedCategory === cat && [styles.filterChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                                    ]}
                                    onPress={() => setSelectedCategory(cat)}
                                >
                                    <Text style={[
                                        styles.filterChipText,
                                        { color: colors.textLight },
                                        selectedCategory === cat && styles.filterChipTextActive
                                    ]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <ScrollView
                    style={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {loading && !refreshing ? (
                        <ActivityIndicator size="large" color="#4a90d9" style={{ marginTop: 40 }} />
                    ) : announcements.filter(item =>
                        selectedCategory === 'All' || item.category === selectedCategory
                    ).length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="megaphone-outline" size={48} color="#a3b1c6" />
                            </View>
                            <Text style={styles.emptyText}>No announcements yet.</Text>
                        </View>
                    ) : (
                        announcements
                            .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
                            .map((item) => {
                                const isRead = readAnnouncementIds.has(item.id);
                                const isExpanded = expandedAnnouncementIds.has(item.id);
                                const catColor = getCategoryColor(item.category);

                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.announcementCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                        onPress={() => toggleExpand(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        {/* Indicator Bar */}
                                        <View style={[styles.indicator, { backgroundColor: isRead ? colors.primary : '#ff6b6b' }]} />

                                        <View style={{ flex: 1 }}>
                                            {/* Author Row - Only shown when expanded */}
                                            {isExpanded && (
                                                <View style={[styles.expandedAuthorRow, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(74, 144, 217, 0.05)' }]}>
                                                    <View style={[styles.avatarSmall, { backgroundColor: colors.backgroundDark }]}>
                                                        {item.author?.avatar_url ? (
                                                            <Image
                                                                source={{ uri: item.author.avatar_url }}
                                                                style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                                            />
                                                        ) : (
                                                            <Text style={{ fontSize: 14 }}>👤</Text>
                                                        )}
                                                    </View>
                                                    <Text style={[styles.authorNameSmall, { color: colors.textLight }]}>{item.author?.full_name || 'Unknown'}</Text>
                                                </View>
                                            )}

                                            <View style={styles.titleRow}>
                                                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={isExpanded ? undefined : 1}>
                                                    {item.title}
                                                </Text>
                                                {item.category && (
                                                    <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
                                                        <Text style={[styles.categoryText, { color: catColor.text }]}>
                                                            {item.category}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.metaRow}>
                                                <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(item.created_at)}</Text>
                                            </View>

                                            {isExpanded && (
                                                <View style={{ marginTop: 12 }}>
                                                    <Text style={[styles.contentText, { color: colors.textLight }]}>
                                                        {item.content}
                                                    </Text>

                                                    {item.attachment_url && (
                                                        <TouchableOpacity
                                                            style={[styles.attachmentButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(74, 144, 217, 0.1)', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(74, 144, 217, 0.2)' }]}
                                                            onPress={() => Linking.openURL(item.attachment_url)}
                                                        >
                                                            <Ionicons name="attach" size={22} color={colors.primary} style={{ marginRight: 8 }} />
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={[styles.attachmentName, { color: colors.primary }]}>
                                                                    {item.attachment_name || 'Attachment'}
                                                                </Text>
                                                                <Text style={[styles.attachmentHint, { color: colors.textMuted }]}>Tap to open</Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    )}

                                                    {item.sent_via_push && (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                                            <Text style={[styles.pushText, { color: colors.textMuted }]}>Sent via Push</Text>
                                                            <Ionicons name="notifications-outline" size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>

                <CreateAnnouncementModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    schoolId={school.id}
                    onCreated={fetchAnnouncements}
                />
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
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(163, 177, 198, 0.2)',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2d3748',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#4a90d9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(163, 177, 198, 0.2)',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(163, 177, 198, 0.3)',
    },
    filterChipActive: {
        backgroundColor: '#4a90d9',
        borderColor: '#4a90d9',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
    },
    filterChipTextActive: {
        color: '#ffffff',
    },
    listContainer: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
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
        fontSize: 16,
        color: '#718096',
    },
    announcementCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    indicator: {
        width: 5,
        borderRadius: 3,
        marginRight: 14,
        marginVertical: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(163, 177, 198, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    authorName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d3748',
    },
    expandedAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: 'rgba(74, 144, 217, 0.05)',
        padding: 8,
        borderRadius: 12,
    },
    avatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(163, 177, 198, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        overflow: 'hidden',
    },
    authorNameSmall: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4a5568',
    },
    timeText: {
        fontSize: 12,
        color: '#a0aec0',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#2d3748',
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
    },
    contentText: {
        fontSize: 14,
        color: '#4a5568',
        lineHeight: 20,
        marginBottom: 8,
    },
    attachmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 217, 0.2)',
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a90d9',
    },
    attachmentHint: {
        fontSize: 12,
        color: '#718096',
    },
    pushText: {
        fontSize: 12,
        color: '#a0aec0',
    },
});
