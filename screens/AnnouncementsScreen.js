import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function AnnouncementsScreen({ navigation, route }) {
    const { school, role } = route.params;
    const { user } = useAuth();
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

    useFocusEffect(
        useCallback(() => {
            fetchAnnouncements();
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
        const colors = {
            'News': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
            'Academic': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
            'Sport': { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
            'Letters': { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' },
            'Homework': { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316' },
            'General': { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' },
        };
        return colors[cat] || colors['General'];
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#4a90d9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Announcements</Text>

                {canCreate ? (
                    <TouchableOpacity
                        style={styles.addButton}
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
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.filterChip,
                                    selectedCategory === cat && styles.filterChipActive
                                ]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Text style={[
                                    styles.filterChipText,
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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4a90d9" />
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
                                    style={styles.announcementCard}
                                    onPress={() => toggleExpand(item.id)}
                                    activeOpacity={0.7}
                                >
                                    {/* Indicator Bar */}
                                    <View style={[styles.indicator, { backgroundColor: isRead ? '#4a90d9' : '#ff6b6b' }]} />

                                    <View style={{ flex: 1 }}>
                                        <View style={styles.cardHeader}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                <View style={styles.avatar}>
                                                    {item.author?.avatar_url ? (
                                                        <Image
                                                            source={{ uri: item.author.avatar_url }}
                                                            style={{ width: '100%', height: '100%', borderRadius: 24 }}
                                                        />
                                                    ) : (
                                                        <Text style={{ fontSize: 20 }}>👤</Text>
                                                    )}
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.authorName}>{item.author?.full_name || 'Unknown'}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
                                        </View>

                                        <View style={styles.titleRow}>
                                            <Text style={styles.cardTitle}>{item.title}</Text>
                                            {item.category && (
                                                <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
                                                    <Text style={[styles.categoryText, { color: catColor.text }]}>
                                                        {item.category}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text style={styles.contentText} numberOfLines={isExpanded ? undefined : 2}>
                                            {item.content}
                                        </Text>

                                        {isExpanded && (
                                            <View>
                                                {item.attachment_url && (
                                                    <TouchableOpacity
                                                        style={styles.attachmentButton}
                                                        onPress={() => Linking.openURL(item.attachment_url)}
                                                    >
                                                        <Ionicons name="attach" size={22} color="#4a90d9" style={{ marginRight: 8 }} />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.attachmentName}>
                                                                {item.attachment_name || 'Attachment'}
                                                            </Text>
                                                            <Text style={styles.attachmentHint}>Tap to open</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                )}

                                                {item.sent_via_push && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                                        <Text style={styles.pushText}>Sent via Push</Text>
                                                        <Ionicons name="notifications-outline" size={14} color="#a0aec0" style={{ marginLeft: 4 }} />
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8eef5',
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
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
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
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
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
    timeText: {
        fontSize: 12,
        color: '#a0aec0',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
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
