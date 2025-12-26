import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ResponsiveScreen from '../components/ResponsiveScreen';
import { useFocusEffect } from '@react-navigation/native';

export default function ManageGroupsScreen({ navigation, route }) {
    const { schoolId, schoolName } = route.params;
    const { user } = useAuth();
    const { colors, isDarkMode } = useTheme();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('school_id', schoolId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGroups(data || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
            Alert.alert('Error', 'Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchGroups();
        }, [schoolId])
    );

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        setCreating(true);
        try {
            const { data, error } = await supabase
                .from('groups')
                .insert([
                    {
                        school_id: schoolId,
                        name: groupName.trim(),
                        description: groupDescription.trim() || null,
                        created_by: user.id
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            await supabase.from('group_members').insert([
                { group_id: data.id, user_id: user.id, role: 'admin' }
            ]);

            Alert.alert('Success', 'Group created successfully');
            setModalVisible(false);
            setGroupName('');
            setGroupDescription('');
            fetchGroups();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setCreating(false);
        }
    };

    const renderGroupItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('GroupChat', { group: item, schoolId })}
            activeOpacity={0.7}
        >
            <View style={[styles.groupIcon, { backgroundColor: isDarkMode ? 'rgba(0, 184, 148, 0.1)' : 'rgba(0, 184, 148, 0.15)' }]}>
                <Ionicons name="chatbubbles-outline" size={24} color="#00b894" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
                {item.description && (
                    <Text style={[styles.groupDescription, { color: colors.textLight }]} numberOfLines={1}>{item.description}</Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ResponsiveScreen maxWidth={800}>
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonIcon}>
                        <Ionicons name="chevron-back" size={28} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Groups</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addButtonSmall, { backgroundColor: '#00b894' }]}>
                        <Ionicons name="add" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.schoolLabel, { color: colors.textLight }]}>{schoolName}</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                    ) : groups.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIcon, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(163, 177, 198, 0.2)' }]}>
                                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                            </View>
                            <Text style={[styles.emptyText, { color: colors.textLight }]}>No groups yet.</Text>
                            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Create your first group to start messaging</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={groups}
                            renderItem={renderGroupItem}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </View>
            </ResponsiveScreen>

            {/* Create Group Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Create Group</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={[styles.cancelLink, { color: colors.primary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ gap: 16 }}>
                        <View>
                            <Text style={[styles.label, { color: colors.text }]}>Group Name</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]}
                                placeholder="e.g. Grade 10 Parents"
                                placeholderTextColor={colors.textMuted}
                                value={groupName}
                                onChangeText={setGroupName}
                            />
                        </View>

                        <View>
                            <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.textArea, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]}
                                placeholder="What's this group for?"
                                placeholderTextColor={colors.textMuted}
                                value={groupDescription}
                                onChangeText={setGroupDescription}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleCreateGroup}
                            disabled={creating}
                            activeOpacity={0.8}
                        >
                            {creating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Create Group</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        borderBottomWidth: 1,
    },
    backButtonIcon: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    addButtonSmall: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#00b894',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00a381',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    schoolLabel: {
        fontSize: 14,
        marginBottom: 16,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
    },
    groupIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '700',
    },
    groupDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
    },
    emptyHint: {
        fontSize: 14,
        marginTop: 4,
    },
    modalContainer: {
        flex: 1,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    cancelLink: {
        fontSize: 16,
        fontWeight: '600',
    },
    label: {
        fontWeight: '600',
        marginBottom: 8,
        fontSize: 14,
    },
    input: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
    },
    submitButton: {
        backgroundColor: '#00b894',
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
