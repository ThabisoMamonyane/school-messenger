import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export default function ManageGroupsScreen({ navigation, route }) {
    const { schoolId, schoolName } = route.params;
    const { user } = useAuth();
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
            style={styles.groupCard}
            onPress={() => navigation.navigate('GroupChat', { group: item, schoolId })}
            activeOpacity={0.7}
        >
            <View style={styles.groupIcon}>
                <Ionicons name="chatbubbles-outline" size={24} color="#00b894" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>{item.name}</Text>
                {item.description && (
                    <Text style={styles.groupDescription} numberOfLines={1}>{item.description}</Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a3b1c6" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonIcon}>
                    <Ionicons name="chevron-back" size={28} color="#4a90d9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Groups</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButtonSmall}>
                    <Ionicons name="add" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.schoolLabel}>{schoolName}</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#4a90d9" style={{ marginTop: 40 }} />
                ) : groups.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="chatbubbles-outline" size={48} color="#a3b1c6" />
                        </View>
                        <Text style={styles.emptyText}>No groups yet.</Text>
                        <Text style={styles.emptyHint}>Create your first group to start messaging</Text>
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

            {/* Create Group Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Create Group</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelLink}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ gap: 16 }}>
                        <View>
                            <Text style={styles.label}>Group Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Grade 10 Parents"
                                placeholderTextColor="#a0aec0"
                                value={groupName}
                                onChangeText={setGroupName}
                            />
                        </View>

                        <View>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="What's this group for?"
                                placeholderTextColor="#a0aec0"
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
    backButtonIcon: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2d3748',
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
        color: '#718096',
        marginBottom: 16,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    groupIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 184, 148, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d3748',
    },
    groupDescription: {
        fontSize: 13,
        color: '#718096',
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
        backgroundColor: 'rgba(163, 177, 198, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#718096',
    },
    emptyHint: {
        fontSize: 14,
        color: '#a0aec0',
        marginTop: 4,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#e8eef5',
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
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    submitButton: {
        backgroundColor: '#00b894',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#00a381',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
});
