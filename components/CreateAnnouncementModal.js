import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert, Switch, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export default function CreateAnnouncementModal({ visible, onClose, schoolId, onCreated }) {
    const { user } = useAuth();
    const { colors, isDarkMode } = useTheme();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [sendPush, setSendPush] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(false);

    const categories = ['News', 'Academic', 'Sport', 'Letters', 'Homework', 'General'];

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setAttachment(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleCreate = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            let attachmentUrl = null;
            let attachmentName = null;

            if (attachment) {
                const fileExt = attachment.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${schoolId}/${fileName}`;

                let fileBody;

                if (Platform.OS === 'web') {
                    // On web, fetch the blob directly from the URI
                    const response = await fetch(attachment.uri);
                    fileBody = await response.blob();
                } else {
                    // On mobile, read as base64 and decode to ArrayBuffer
                    const base64 = await FileSystem.readAsStringAsync(attachment.uri, {
                        encoding: 'base64',
                    });
                    fileBody = decode(base64);
                }

                const { error: uploadError } = await supabase.storage
                    .from('announcement-attachments')
                    .upload(filePath, fileBody, {
                        contentType: attachment.mimeType || 'application/octet-stream',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Storage upload error:', uploadError);
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }

                const { data: urlData } = supabase.storage
                    .from('announcement-attachments')
                    .getPublicUrl(filePath);

                attachmentUrl = urlData.publicUrl;
                attachmentName = attachment.name;
            }

            const { data, error } = await supabase
                .from('announcements')
                .insert({
                    school_id: schoolId,
                    author_id: user.id,
                    title: title.trim(),
                    content: content.trim(),
                    category,
                    attachment_url: attachmentUrl,
                    attachment_name: attachmentName,
                    sent_via_push: sendPush
                })
                .select()
                .single();

            if (error) throw error;

            if (sendPush) {
                // Fetch tokens for all school members
                const { data: members, error: membersError } = await supabase
                    .from('school_members')
                    .select(`
                        user_id,
                        users:user_id (
                            id
                        )
                    `)
                    .eq('school_id', schoolId);

                if (!membersError && members) {
                    const userIds = members.map(m => m.user_id);
                    // Fetch tokens from profiles
                    const { data: tokensData } = await supabase
                        .from('profiles')
                        .select('expo_push_token')
                        .in('id', userIds)
                        .not('expo_push_token', 'is', null);

                    if (tokensData && tokensData.length > 0) {
                        const pushTokens = tokensData.map(t => t.expo_push_token);

                        // Send Push Notifications via Expo API
                        const messages = pushTokens.map(token => ({
                            to: token,
                            sound: 'default',
                            title: `📢 ${title}`,
                            body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                            data: { announcementId: data.id },
                            badge: 1,
                            channelId: 'default', // Critical for Android sound/vibration
                            priority: 'high',     // Critical for Android heads-up display
                        }));

                        // Chunking for safety (Expo limits)
                        const chunks = [];
                        for (let i = 0; i < messages.length; i += 100) {
                            chunks.push(messages.slice(i, i + 100));
                        }

                        for (const chunk of chunks) {
                            try {
                                await fetch('https://exp.host/--/api/v2/push/send', {
                                    method: 'POST',
                                    headers: {
                                        'Accept': 'application/json',
                                        'Accept-encoding': 'gzip, deflate',
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(chunk),
                                });
                            } catch (pushError) {
                                console.error('Error sending push chunk:', pushError);
                            }
                        }
                    }
                }
            }

            Alert.alert('Success', 'Announcement created successfully');
            resetForm();
            onCreated?.();
            onClose();
        } catch (error) {
            console.error('Error creating announcement:', error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setCategory('General');
        setSendPush(false);
        setAttachment(null);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Create Announcement</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.cancelLink, { color: colors.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <View style={{ gap: 16 }}>
                        <View>
                            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                                placeholder="Announcement title..."
                                placeholderTextColor={colors.textMuted}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View>
                            <Text style={[styles.label, { color: colors.text }]}>Content *</Text>
                            <TextInput
                                style={[styles.textArea, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                                placeholder="Write your announcement here..."
                                placeholderTextColor={colors.textMuted}
                                value={content}
                                onChangeText={setContent}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View>
                            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                            <View style={styles.categoryGrid}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryChip,
                                            { backgroundColor: colors.surface, borderColor: colors.border },
                                            category === cat && [styles.categoryChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                                        ]}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            { color: colors.textLight },
                                            category === cat && styles.categoryChipTextActive
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View>
                            <Text style={[styles.label, { color: colors.text }]}>Attachment</Text>
                            {attachment ? (
                                <View style={[styles.attachmentPreview, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(74, 144, 217, 0.1)', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(74, 144, 217, 0.2)' }]}>
                                    <Ionicons name="document-outline" size={20} color={colors.primary} />
                                    <Text style={[styles.attachmentText, { color: colors.textLight }]} numberOfLines={1}>{attachment.name}</Text>
                                    <TouchableOpacity onPress={() => setAttachment(null)}>
                                        <Ionicons name="close-circle" size={22} color="#ff6b6b" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.uploadButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(74, 144, 217, 0.05)', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(74, 144, 217, 0.3)' }]}
                                    onPress={pickDocument}
                                >
                                    <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                                    <Text style={[styles.uploadButtonText, { color: colors.primary }]}>Tap to attach a file</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={[styles.pushRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.pushTitle, { color: colors.text }]}>Send Push Notification</Text>
                                <Text style={[styles.pushHint, { color: colors.textMuted }]}>Notify all school members immediately</Text>
                            </View>
                            <Switch
                                value={sendPush}
                                onValueChange={setSendPush}
                                trackColor={{ false: isDarkMode ? '#2d3748' : '#d1dbe8', true: 'rgba(74, 144, 217, 0.5)' }}
                                thumbColor={sendPush ? colors.primary : (isDarkMode ? '#4a5568' : '#f4f3f4')}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleCreate}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Create Announcement</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2d3748',
    },
    cancelLink: {
        color: '#4a90d9',
        fontSize: 16,
        fontWeight: '600',
    },
    label: {
        color: '#2d3748',
        fontWeight: '600',
        marginBottom: 8,
        fontSize: 14,
    },
    input: {
        backgroundColor: '#d1dbe8',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#2d3748',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    textArea: {
        backgroundColor: '#d1dbe8',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#2d3748',
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(163, 177, 198, 0.3)',
    },
    categoryChipActive: {
        backgroundColor: '#4a90d9',
        borderColor: '#4a90d9',
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
    },
    categoryChipTextActive: {
        color: '#ffffff',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(74, 144, 217, 0.3)',
        borderRadius: 16,
        paddingVertical: 20,
    },
    uploadButtonText: {
        color: '#4a90d9',
        fontWeight: '600',
        marginLeft: 8,
    },
    attachmentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 217, 0.2)',
    },
    attachmentText: {
        flex: 1,
        marginLeft: 10,
        color: '#4a5568',
        fontSize: 14,
    },
    pushRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    pushTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3748',
    },
    pushHint: {
        fontSize: 12,
        color: '#718096',
        marginTop: 2,
    },
    submitButton: {
        backgroundColor: '#4a90d9',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
});
