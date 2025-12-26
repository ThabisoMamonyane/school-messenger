import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Modal, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import ResponsiveScreen from '../components/ResponsiveScreen';

export default function ManageStaffScreen({ navigation, route }) {
    const { schoolId, schoolName } = route.params;
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('teacher');
    const [adding, setAdding] = useState(false);

    const roles = [
        { value: 'teacher', label: 'Teacher' },
        { value: 'admin', label: 'Admin' },
        { value: 'support_staff', label: 'Support Staff' },
        { value: 'communications_officer', label: 'Communications Officer' }
    ];

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const { data, error } = await supabase
                .from('school_members')
                .select(`id, role, profiles ( id, full_name, email )`)
                .eq('school_id', schoolId)
                .neq('role', 'parent');

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            Alert.alert('Error', 'Failed to load staff members');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        setAdding(true);
        try {
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (userError || !userData) {
                Alert.alert('Error', 'User not found. They must have an account first.');
                return;
            }

            const { error } = await supabase
                .from('school_members')
                .insert([{ school_id: schoolId, user_id: userData.id, role }]);

            if (error) throw error;

            Alert.alert('Success', 'Staff member added');
            setModalVisible(false);
            setEmail('');
            setRole('teacher');
            fetchStaff();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveStaff = (memberId, memberName, memberRole) => {
        if (memberRole === 'admin') {
            Alert.alert('Cannot Remove', 'School admins cannot be removed.');
            return;
        }

        Alert.alert(
            'Remove Staff',
            `Are you sure you want to remove ${memberName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('school_members')
                                .delete()
                                .eq('id', memberId);

                            if (error) throw error;
                            fetchStaff();
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const renderStaffItem = ({ item }) => (
        <View style={styles.staffCard}>
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                    {item.profiles?.full_name?.charAt(0) || '?'}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.staffName}>{item.profiles?.full_name || 'Unknown'}</Text>
                <Text style={styles.staffEmail}>{item.profiles?.email}</Text>
                <Text style={styles.roleText}>{item.role.replace('_', ' ').toUpperCase()}</Text>
            </View>
            {item.role !== 'admin' && (
                <TouchableOpacity
                    onPress={() => handleRemoveStaff(item.id, item.profiles?.full_name, item.role)}
                    style={styles.removeButton}
                >
                    <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveScreen maxWidth={800}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonIcon}>
                        <Ionicons name="chevron-back" size={28} color="#4a90d9" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Manage Staff</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButtonSmall}>
                        <Ionicons name="add" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={styles.schoolLabel}>{schoolName}</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#4a90d9" style={{ marginTop: 40 }} />
                    ) : staff.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="people-outline" size={48} color="#a3b1c6" />
                            </View>
                            <Text style={styles.emptyText}>No staff members yet.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={staff}
                            renderItem={renderStaffItem}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </View>
            </ResponsiveScreen>

            {/* Add Staff Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Staff Member</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelLink}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ gap: 16 }}>
                        <View>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="staff@email.com"
                                placeholderTextColor="#a0aec0"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View>
                            <Text style={styles.label}>Role</Text>
                            <View style={styles.roleGrid}>
                                {roles.map((r) => (
                                    <TouchableOpacity
                                        key={r.value}
                                        style={[styles.roleOption, role === r.value && styles.roleOptionActive]}
                                        onPress={() => setRole(r.value)}
                                    >
                                        <Text style={[styles.roleOptionText, role === r.value && styles.roleOptionTextActive]}>
                                            {r.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleAddStaff}
                            disabled={adding}
                            activeOpacity={0.8}
                        >
                            {adding ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Add Staff Member</Text>
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
        backgroundColor: '#4a90d9',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3a7bc8',
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
    staffCard: {
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
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(74, 144, 217, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4a90d9',
    },
    staffName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d3748',
    },
    staffEmail: {
        fontSize: 13,
        color: '#718096',
        marginTop: 2,
    },
    roleText: {
        color: '#4a90d9',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 6,
    },
    removeButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
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
    roleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    roleOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(163, 177, 198, 0.3)',
    },
    roleOptionActive: {
        backgroundColor: '#4a90d9',
        borderColor: '#4a90d9',
    },
    roleOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
    },
    roleOptionTextActive: {
        color: '#ffffff',
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
