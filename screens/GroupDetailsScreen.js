import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export default function GroupDetailsScreen({ navigation, route }) {
    const { group, schoolId } = route.params;
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [searching, setSearching] = useState(false);

    // Check if current user is an admin of this group (or the creator)
    const isGroupAdmin = group.created_by === user.id || members.some(m => m.user_id === user.id && m.role === 'admin');

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    *,
                    profile:user_id (
                        id,
                        full_name,
                        email,
                        avatar_url
                    )
                `)
                .eq('group_id', group.id)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            Alert.alert('Error', 'Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMembers();
        }, [group.id])
    );

    const handleAddMember = async () => {
        if (!searchEmail.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        setSearching(true);
        try {
            const { data: profiles, error: searchError } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('email', searchEmail.toLowerCase().trim())
                .single();

            if (searchError || !profiles) {
                Alert.alert('Not Found', 'No user found with that email address');
                setSearching(false);
                return;
            }

            const { data: schoolMember } = await supabase
                .from('school_members')
                .select('id')
                .eq('school_id', schoolId)
                .eq('user_id', profiles.id)
                .single();

            if (!schoolMember) {
                Alert.alert('Error', 'This user is not a member of the school');
                setSearching(false);
                return;
            }

            const { error: insertError } = await supabase
                .from('group_members')
                .insert([
                    {
                        group_id: group.id,
                        user_id: profiles.id,
                        role: 'member'
                    }
                ]);

            if (insertError) {
                if (insertError.code === '23505') {
                    Alert.alert('Already Added', 'This user is already in the group');
                } else {
                    throw insertError;
                }
            } else {
                Alert.alert('Success', `${profiles.full_name} has been added to the group`);
                setSearchEmail('');
                setModalVisible(false);
                fetchMembers();
            }
        } catch (error) {
            console.error('Error adding member:', error);
            Alert.alert('Error', error.message);
        } finally {
            setSearching(false);
        }
    };

    const handleRemoveMember = async (memberId, memberName) => {
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${memberName} from this group?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('group_members')
                                .delete()
                                .eq('id', memberId);

                            if (error) throw error;
                            Alert.alert('Success', 'Member removed');
                            fetchMembers();
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const renderMemberItem = ({ item }) => (
        <View style={styles.memberCard}>
            <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                    {item.profile?.full_name?.charAt(0) || '?'}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>
                    {item.profile?.full_name || 'Unknown User'}
                </Text>
                <Text style={styles.memberEmail}>{item.profile?.email}</Text>
                <Text style={[styles.roleText, item.role === 'admin' && styles.roleTextAdmin]}>
                    {item.role.toUpperCase()}
                </Text>
            </View>
            {(isGroupAdmin && item.role !== 'admin') && (
                <TouchableOpacity
                    onPress={() => handleRemoveMember(item.id, item.profile?.full_name)}
                    style={styles.removeButton}
                >
                    <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#4a90d9" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.headerSection}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        {group.description && (
                            <Text style={styles.groupDescription}>{group.description}</Text>
                        )}
                    </View>
                    {isGroupAdmin && (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={18} color="#ffffff" />
                            <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.sectionTitle}>
                    Members ({members.length})
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#4a90d9" style={{ marginTop: 40 }} />
                ) : members.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="people-outline" size={48} color="#a3b1c6" />
                        </View>
                        <Text style={styles.emptyText}>No members yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={members}
                        renderItem={renderMemberItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Add Member Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Member</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelLink}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ gap: 16 }}>
                        <View>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="user@example.com"
                                placeholderTextColor="#a0aec0"
                                value={searchEmail}
                                onChangeText={setSearchEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.inputHint}>
                                Enter the email of a school member to add them to this group
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleAddMember}
                            disabled={searching}
                            activeOpacity={0.8}
                        >
                            {searching ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Add Member</Text>
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
    content: {
        flex: 1,
        padding: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backText: {
        color: '#4a90d9',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 4,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    groupName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2d3748',
    },
    groupDescription: {
        fontSize: 15,
        color: '#718096',
        marginTop: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4a90d9',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#718096',
        marginBottom: 12,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(74, 144, 217, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    memberAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4a90d9',
    },
    memberName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d3748',
    },
    memberEmail: {
        fontSize: 13,
        color: '#718096',
        marginTop: 2,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#718096',
        marginTop: 6,
    },
    roleTextAdmin: {
        color: '#6c5ce7',
    },
    removeButton: {
        marginLeft: 8,
    },
    removeButtonText: {
        color: '#ff6b6b',
        fontWeight: '600',
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
    inputHint: {
        color: '#718096',
        fontSize: 13,
        marginTop: 8,
    },
    submitButton: {
        backgroundColor: '#4a90d9',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#3a7bc8',
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
