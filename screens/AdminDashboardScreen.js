import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function AdminDashboardScreen({ navigation }) {
    const [pendingSchools, setPendingSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPendingSchools();
    }, []);

    const fetchPendingSchools = async () => {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingSchools(data || []);
        } catch (error) {
            console.error('Error fetching pending schools:', error);
            Alert.alert('Error', 'Failed to load pending schools');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (schoolId) => {
        setProcessingId(schoolId);
        try {
            const { error } = await supabase
                .from('schools')
                .update({ status: 'approved' })
                .eq('id', schoolId);

            if (error) throw error;
            Alert.alert('Success', 'School approved successfully');
            fetchPendingSchools();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (schoolId) => {
        setProcessingId(schoolId);
        try {
            const { error } = await supabase
                .from('schools')
                .update({ status: 'rejected' })
                .eq('id', schoolId);

            if (error) throw error;
            Alert.alert('Rejected', 'School registration rejected');
            fetchPendingSchools();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const renderSchoolItem = ({ item }) => (
        <View style={styles.schoolCard}>
            <View style={styles.cardHeader}>
                <View style={styles.schoolIcon}>
                    <Ionicons name="school-outline" size={24} color="#6c5ce7" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.schoolName}>{item.name}</Text>
                    <Text style={styles.schoolAddress}>{item.address}, {item.province}</Text>
                </View>
            </View>

            <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Pending Approval</Text>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(item.id)}
                    disabled={processingId === item.id}
                    activeOpacity={0.8}
                >
                    <Ionicons name="close-circle-outline" size={18} color="#ff6b6b" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(item.id)}
                    disabled={processingId === item.id}
                    activeOpacity={0.8}
                >
                    {processingId === item.id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                            <Text style={styles.approveButtonText}>Approve</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#4a90d9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <View style={{ width: 32 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionIcon}>
                        <Ionicons name="time-outline" size={22} color="#6c5ce7" />
                    </View>
                    <Text style={styles.sectionTitle}>Pending School Requests</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#4a90d9" style={{ marginTop: 40 }} />
                ) : pendingSchools.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="checkmark-done-outline" size={48} color="#00b894" />
                        </View>
                        <Text style={styles.emptyTitle}>All caught up!</Text>
                        <Text style={styles.emptyText}>No pending school requests to review.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={pendingSchools}
                        renderItem={renderSchoolItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
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
    content: {
        flex: 1,
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(108, 92, 231, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3748',
    },
    schoolCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    schoolIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(108, 92, 231, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    schoolName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2d3748',
    },
    schoolAddress: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(253, 203, 110, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fdcb6e',
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d68910',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.2)',
    },
    rejectButtonText: {
        color: '#ff6b6b',
        fontWeight: '600',
        marginLeft: 6,
    },
    approveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00b894',
        paddingVertical: 12,
        borderRadius: 14,
        shadowColor: '#00a381',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    approveButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: 6,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 80,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 184, 148, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#718096',
    },
});
