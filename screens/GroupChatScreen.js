import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ResponsiveScreen from '../components/ResponsiveScreen';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function GroupChatScreen({ navigation, route }) {
    const { group, schoolId } = route.params;
    const { user } = useAuth();
    const { colors, isDarkMode } = useTheme();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [attachment, setAttachment] = useState(null);
    const [uploading, setUploading] = useState(false);
    const flatListRef = useRef(null);
    const [memberMap, setMemberMap] = useState({});

    useEffect(() => {
        fetchMembers();
        fetchMessages();
        markAsRead();

        const channel = supabase
            .channel(`group_chat:${group.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `group_id=eq.${group.id}`,
                },
                (payload) => {
                    fetchNewMessage(payload.new.id);
                    // Optionally mark as read if user is validly "looking" at the screen,
                    // but usually only on explicit open or tap.
                    // For now, simple "enter screen" mark read is good. 
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [group.id]);

    const markAsRead = async () => {
        try {
            await supabase
                .from('group_members')
                .update({ last_read_at: new Date().toISOString() })
                .eq('group_id', group.id)
                .eq('user_id', user.id);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    user_id,
                    profile:user_id (
                        id,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('group_id', group.id);

            if (error) throw error;

            const map = {};
            data?.forEach(member => {
                if (member.profile) {
                    map[member.user_id] = member.profile;
                }
            });
            setMemberMap(map);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*') // Simplify selection, relying on memberMap for details
                .eq('group_id', group.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
            setLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
        } catch (error) {
            console.error('Error fetching messages:', error);
            Alert.alert('Error', 'Failed to load messages');
            setLoading(false);
        }
    };

    const fetchNewMessage = async (messageId) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('id', messageId)
                .single();

            if (error) throw error;

            setMessages((prev) => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Error fetching new message:', error);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const file = result.assets[0];
                if (file.size > 10 * 1024 * 1024) {
                    Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
                    return;
                }
                setAttachment(file);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const uploadFile = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${group.id}/${fileName}`;

            const base64 = await FileSystem.readAsStringAsync(file.uri, {
                encoding: 'base64',
            });

            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            const { data, error } = await supabase.storage
                .from('message-attachments')
                .upload(filePath, byteArray, {
                    contentType: file.mimeType || 'application/octet-stream',
                    upsert: false
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('message-attachments')
                .getPublicUrl(filePath);

            return { url: urlData.publicUrl, name: file.name };
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() && !attachment) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        const currentAttachment = attachment;
        setAttachment(null);

        try {
            let attachmentUrl = null;
            let attachmentName = null;

            if (currentAttachment) {
                setUploading(true);
                const uploadResult = await uploadFile(currentAttachment);
                attachmentUrl = uploadResult.url;
                attachmentName = uploadResult.name;
                setUploading(false);
            }

            const { error } = await supabase
                .from('messages')
                .insert({
                    group_id: group.id,
                    sender_id: user.id,
                    content: messageContent || null,
                    attachment_url: attachmentUrl,
                    attachment_name: attachmentName
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message');
            setNewMessage(messageContent);
            setAttachment(currentAttachment);
            setUploading(false);
        }
    };

    const isImageFile = (filename) => {
        if (!filename) return false;
        const ext = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
    };

    // Helper function to format date for separators
    const formatDateLabel = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Check if same day
        const isSameDay = (d1, d2) =>
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();

        if (isSameDay(date, today)) {
            return 'Today';
        } else if (isSameDay(date, yesterday)) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    // Helper to get just the date part (without time)
    const getDateKey = (dateString) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };

    const renderMessage = ({ item, index }) => {
        const isMe = item.sender_id === user.id;
        const hasAttachment = item.attachment_url;
        const isImage = hasAttachment && isImageFile(item.attachment_name);

        // Use memberMap to get sender details
        const senderProfile = memberMap[item.sender_id];
        const senderName = senderProfile?.full_name || 'Unknown User';
        const senderAvatar = senderProfile?.avatar_url;

        // Determine if we need to show a date separator
        const showDateSeparator = index === 0 ||
            getDateKey(item.created_at) !== getDateKey(messages[index - 1].created_at);

        return (
            <>
                {showDateSeparator && (
                    <View style={styles.dateSeparator}>
                        <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dateSeparatorText, {
                            color: colors.textMuted,
                            backgroundColor: colors.background
                        }]}>
                            {formatDateLabel(item.created_at)}
                        </Text>
                        <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border }]} />
                    </View>
                )}
                <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
                    {!isMe && (
                        <View style={[styles.avatar, { backgroundColor: isDarkMode ? 'rgba(74, 144, 217, 0.2)' : 'rgba(163, 177, 198, 0.3)' }]}>
                            {senderAvatar ? (
                                <Image source={{ uri: senderAvatar }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Text style={[styles.avatarText, { color: isDarkMode ? '#4a90d9' : '#718096' }]}>
                                    {senderName.charAt(0) || '?'}
                                </Text>
                            )}
                        </View>
                    )}
                    <View style={[
                        styles.messageBubble,
                        isMe ? styles.messageBubbleMe : [styles.messageBubbleOther, {
                            backgroundColor: isDarkMode ? '#2d3748' : 'rgba(255, 255, 255, 0.8)',
                            borderColor: colors.border
                        }]
                    ]}>
                        {!isMe && (
                            <Text style={[styles.senderName, { color: colors.textLight }]}>{senderName}</Text>
                        )}

                        {hasAttachment && (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(item.attachment_url)}
                                style={{ marginBottom: 6 }}
                            >
                                {isImage ? (
                                    <Image
                                        source={{ uri: item.attachment_url }}
                                        style={styles.attachmentImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[
                                        styles.attachmentFile,
                                        isMe ? styles.attachmentFileMe : {
                                            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(163, 177, 198, 0.2)'
                                        }
                                    ]}>
                                        <Ionicons name="document-outline" size={18} color={isMe ? 'white' : colors.textMuted} />
                                        <Text style={[
                                            styles.attachmentFileName,
                                            isMe ? styles.attachmentFileNameMe : { color: colors.text }
                                        ]} numberOfLines={1}>
                                            {item.attachment_name || 'Attachment'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        {item.content && (
                            <Text style={[
                                styles.messageText,
                                isMe ? styles.messageTextMe : { color: colors.text }
                            ]}>
                                {item.content}
                            </Text>
                        )}

                        <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : { color: colors.textLight }]}>
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            </>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <ResponsiveScreen maxWidth={800}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View style={[styles.header, {
                        backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.85)',
                        borderBottomColor: colors.border
                    }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                                <Ionicons name="chevron-back" size={28} color="#4a90d9" />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{group.name}</Text>
                                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{messages.length} messages</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('GroupDetails', { group, schoolId })}
                            style={{ padding: 6 }}
                        >
                            <Ionicons name="information-circle-outline" size={24} color="#4a90d9" />
                        </TouchableOpacity>
                    </View>

                    {/* Messages List */}
                    <View style={[styles.messagesContainer, { backgroundColor: colors.background }]}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#4a90d9" style={{ marginTop: 40 }} />
                        ) : (
                            <FlatList
                                ref={flatListRef}
                                data={messages}
                                renderItem={renderMessage}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                            />
                        )}
                    </View>

                    {/* Attachment Preview */}
                    {attachment && (
                        <View style={[styles.attachmentPreview, {
                            backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.8)',
                            borderTopColor: colors.border
                        }]}>
                            <Ionicons name="document-outline" size={20} color="#4a90d9" />
                            <Text style={[styles.attachmentPreviewText, { color: colors.text }]} numberOfLines={1}>{attachment.name}</Text>
                            <TouchableOpacity onPress={() => setAttachment(null)}>
                                <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Input Area */}
                    <View style={[styles.inputArea, {
                        backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                        borderTopColor: colors.border
                    }]}>
                        <TouchableOpacity onPress={pickDocument} style={{ marginRight: 8, padding: 6 }}>
                            <Ionicons name="attach" size={24} color="#4a90d9" />
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.textInput, {
                                backgroundColor: colors.input,
                                color: colors.text
                            }]}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textMuted}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={(!newMessage.trim() && !attachment) || uploading}
                            style={[
                                styles.sendButton,
                                { backgroundColor: (newMessage.trim() || attachment) && !uploading ? '#4a90d9' : (isDarkMode ? '#333' : 'rgba(163, 177, 198, 0.4)') },
                                ((newMessage.trim() || attachment) && !uploading) && styles.sendButtonActive
                            ]}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Ionicons name="send" size={18} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </ResponsiveScreen>
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
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(163, 177, 198, 0.2)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3748',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#718096',
    },
    messagesContainer: {
        flex: 1,
        backgroundColor: '#e8eef5',
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        justifyContent: 'flex-start',
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(163, 177, 198, 0.3)',
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#718096',
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    messageBubbleMe: {
        backgroundColor: '#4a90d9',
        borderTopRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(163, 177, 198, 0.2)',
    },
    senderName: {
        fontSize: 11,
        color: '#718096',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 15,
        color: '#2d3748',
    },
    messageTextMe: {
        color: '#ffffff',
    },
    messageTime: {
        fontSize: 10,
        color: '#a0aec0',
        marginTop: 4,
        textAlign: 'right',
    },
    messageTimeMe: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    attachmentImage: {
        width: 180,
        height: 180,
        borderRadius: 12,
    },
    attachmentFile: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(163, 177, 198, 0.2)',
        padding: 10,
        borderRadius: 10,
    },
    attachmentFileMe: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    attachmentFileName: {
        marginLeft: 8,
        fontSize: 13,
        color: '#4a5568',
    },
    attachmentFileNameMe: {
        color: '#ffffff',
    },
    attachmentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(163, 177, 198, 0.2)',
    },
    attachmentPreviewText: {
        flex: 1,
        marginLeft: 8,
        color: '#4a5568',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(163, 177, 198, 0.2)',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#d1dbe8',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#2d3748',
        marginRight: 10,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(163, 177, 198, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonActive: {
        backgroundColor: '#4a90d9',
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    dateSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        paddingHorizontal: 8,
    },
    dateSeparatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(163, 177, 198, 0.4)',
    },
    dateSeparatorText: {
        marginHorizontal: 12,
        fontSize: 12,
        fontWeight: '600',
        color: '#718096',
        backgroundColor: '#e8eef5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
});
