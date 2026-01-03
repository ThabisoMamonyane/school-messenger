import React, { useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert, Modal, TextInput, Animated, Easing, Linking } from 'react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import ResponsiveScreen from '../components/ResponsiveScreen';

import CreateAnnouncementModal from '../components/CreateAnnouncementModal';

export default function AnnouncementsScreen({ route, navigation }) {
    const { school, role } = route.params;
    const { user } = useAuth();
    const { colors, isDarkMode } = useTheme();

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState('All');

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);

    // Animation for new items
    const scrollY = useRef(new Animated.Value(0)).current;

    const canPost = role === 'admin' || role === 'communications_officer';

    // Get unique categories
    const categories = ['All', ...new Set(announcements.map(a => a.category).filter(Boolean))];

    // Filter announcements
    const filteredAnnouncements = selectedCategory === 'All'
        ? announcements
        : announcements.filter(a => a.category === selectedCategory);

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select(`
                    id,
                    title,
                    content,
                    created_at,
                    attachment_url,
                    attachment_name,
                    category,
                    profiles:author_id (full_name, email)
                `)
                .eq('school_id', school.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);

        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async () => {
        try {
            await supabase.rpc('mark_announcements_read', {
                p_school_id: school.id,
                p_user_id: user.id
            });
        } catch (error) {
            console.error('Error marking announcements as read:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAnnouncements();
            markAsRead();

            // Realtime subscription
            const subscription = supabase
                .channel('announcements_channel')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements', filter: `school_id=eq.${school.id}` }, (payload) => {
                    // Refresh fully to get author details/attachments correctly
                    fetchAnnouncements();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }, [school.id])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnnouncements();
    };

    const renderItem = ({ item, index }) => {
        return <AnnouncementItem item={item} index={index} colors={colors} isDarkMode={isDarkMode} />;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ResponsiveScreen maxWidth={800}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color="#4a90d9" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Announcements</Text>
                    {canPost ? (
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.headerBtn}>
                            <LinearGradient
                                colors={['#4a90d9', '#5486E9']}
                                style={styles.addBtnGradient}
                            >
                                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>

                {/* Category Filter */}
                <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
                    <FlatList
                        horizontal
                        data={categories}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContent}
                        keyExtractor={item => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setSelectedCategory(item)}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedCategory === item ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                                        borderColor: selectedCategory === item ? colors.primary : 'transparent'
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: selectedCategory === item ? '#fff' : colors.text }
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                <FlatList
                    data={filteredAnnouncements}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="bullhorn-outline" size={64} color={colors.textMuted} style={{ opacity: 0.5 }} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No announcements yet.</Text>
                            </View>
                        )
                    }
                />

                {/* Post Modal */}
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

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const AnnouncementItem = ({ item, index, colors, isDarkMode }) => {
    const [expanded, setExpanded] = useState(false);

    const handleOpenAttachment = useCallback(async () => {
        if (item.attachment_url) {
            try {
                const supported = await Linking.canOpenURL(item.attachment_url);
                if (supported) {
                    await Linking.openURL(item.attachment_url);
                } else {
                    Alert.alert('Error', 'Cannot open this attachment');
                }
            } catch (error) {
                console.error('Error opening URL:', error);
                Alert.alert('Error', 'Failed to open attachment');
            }
        }
    }, [item.attachment_url]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setExpanded(!expanded)}
            style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: index % 3 === 0 ? '#4a90d9' : index % 3 === 1 ? '#6c5ce7' : '#00b894' }]}
        >
            <View style={styles.cardHeader}>
                <View style={styles.authorContainer}>
                    <View style={[styles.authorIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(74,144,217,0.1)' }]}>
                        <MaterialCommunityIcons name="account" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.authorText, { color: colors.textMuted }]}>
                        {item.profiles?.full_name || 'School Admin'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.attachment_url && (
                        <MaterialCommunityIcons name="paperclip" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                    )}
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDate(item.created_at)}</Text>
                </View>
            </View>

            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>

            {expanded && (
                <View style={{ marginTop: 8 }}>
                    <Text style={[styles.cardContent, { color: colors.textMuted }]}>{item.content}</Text>
                    {item.attachment_url && (
                        <TouchableOpacity
                            style={[styles.attachmentBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f9ff', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#e0f2fe' }]}
                            onPress={handleOpenAttachment}
                        >
                            <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
                            <Text style={[styles.attachmentBtnText, { color: colors.primary }]}>
                                {item.attachment_name || 'View Attachment'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {!expanded && (
                <View style={{ alignItems: 'center', marginTop: 4 }}>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} style={{ opacity: 0.5 }} />
                </View>
            )}
        </TouchableOpacity>
    );
};

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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerBtn: {
        padding: 4,
    },
    addBtnGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    authorText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 11,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    cardContent: {
        fontSize: 15,
        lineHeight: 22,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '60%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    textArea: {
        minHeight: 150,
    },
    postButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: "#4a90d9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    postButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    attachmentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
    },
    attachmentBtnText: {
        marginLeft: 8,
        fontWeight: '600',
        fontSize: 14,
    },
    filterContainer: {
        paddingVertical: 10,
    },
    filterContent: {
        paddingHorizontal: 16,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
