import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function AddMemberModal({ visible, onClose, schoolId, onAdd, title = "Add Members", excludeIds = [] }) {
    const { colors, isDarkMode } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState('All');

    const ROLES = ['All', 'Teacher', 'Parent', 'Student', 'Admin', 'Principal', 'Communications Officer'];

    useEffect(() => {
        if (visible) {
            fetchStaff();
            setSelectedUsers([]);
            setSearchQuery('');
            setSelectedRole('All');
        }
    }, [visible, schoolId]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            // Fetch school members who are not students? Or just all members?
            // User requested "staff registered in that school". Assuming 'staff' role check or just all members.
            // Usually "staff" implies 'teacher', 'admin', 'principal', etc.
            // But for groups, maybe they want to add anyone? The prompt said "list of staff registered in that school".
            // I will select all members for now, but display their roles.

            const { data, error } = await supabase
                .from('school_members')
                .select(`
                    user_id,
                    role,
                    profiles:user_id (
                        id,
                        full_name,
                        email,
                        avatar_url
                    )
                `)
                .eq('school_id', schoolId);

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (user) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const filteredStaff = staff.filter(member => {
        if (!member.profiles) return false;
        if (excludeIds.includes(member.user_id)) return false;

        // Role Filter
        if (selectedRole !== 'All' && member.role?.toLowerCase() !== selectedRole.toLowerCase().replace(' ', '_')) {
            // Handle 'Communications Officer' -> 'communications_officer' mapping if needed, 
            // or just use loose matching. The DB roles are likely snake_case or lowercase.
            // Let's normalize:
            const dbRole = member.role?.toLowerCase();
            const filterRole = selectedRole.toLowerCase().replace(' ', '_');
            if (dbRole !== filterRole) return false;
        }

        const query = searchQuery.toLowerCase();
        return (
            member.profiles.full_name?.toLowerCase().includes(query) ||
            member.profiles.email?.toLowerCase().includes(query)
        );
    });

    const handleAdd = () => {
        onAdd(selectedUsers);
        onClose();
    };

    const renderItem = ({ item }) => {
        const isSelected = selectedUsers.some(u => u.id === item.profiles.id);

        return (
            <TouchableOpacity
                style={[styles.memberCard, {
                    backgroundColor: isSelected ? (isDarkMode ? 'rgba(74, 144, 217, 0.2)' : '#e3f2fd') : colors.surface,
                    borderColor: isSelected ? colors.primary : 'transparent',
                    borderWidth: 1
                }]}
                onPress={() => toggleSelection(item.profiles)}
            >
                <View style={[styles.avatar, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f2f5' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {item.profiles.full_name?.charAt(0) || '?'}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{item.profiles.full_name}</Text>
                    <Text style={[styles.email, { color: colors.textMuted }]}>{item.profiles.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{item.role.replace('_', ' ')}</Text>
                    </View>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
            </TouchableOpacity>
        );
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
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { backgroundColor: colors.input, color: colors.text }]}
                        placeholder="Search by name or email"
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={{ marginBottom: 16 }}>
                    <FlatList
                        data={ROLES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setSelectedRole(item)}
                                style={[
                                    styles.filterChip,
                                    selectedRole === item && { backgroundColor: colors.primary },
                                    { borderColor: colors.border }
                                ]}
                            >
                                <Text style={[
                                    styles.filterText,
                                    selectedRole === item ? { color: '#fff' } : { color: colors.text }
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ gap: 8 }}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={filteredStaff}
                        renderItem={renderItem}
                        keyExtractor={item => item.user_id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                {searchQuery ? 'No matches found' : 'No staff found'}
                            </Text>
                        }
                    />
                )}

                <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: isDarkMode ? colors.background : 'rgba(255,255,255,0.95)' }]}>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: selectedUsers.length > 0 ? colors.primary : (isDarkMode ? '#333' : '#e0e0e0') }]}
                        disabled={selectedUsers.length === 0}
                        onPress={handleAdd}
                    >
                        <Text style={[styles.addButtonText, { color: selectedUsers.length > 0 ? '#fff' : colors.textMuted }]}>
                            Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    cancel: {
        fontSize: 16,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        paddingLeft: 40,
        paddingRight: 16,
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 80,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    email: {
        fontSize: 13,
        marginBottom: 4,
    },
    roleBadge: {
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    roleText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
    },
    addButton: {
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 4,
        backgroundColor: 'transparent',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
