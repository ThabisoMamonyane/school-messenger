import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function MySchoolsScreen({ navigation }) {
    const { user } = useAuth();
    const [mySchools, setMySchools] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMySchools = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('school_members')
                .select(`
                    id,
                    role,
                    schools (
                        id,
                        name,
                        address,
                        province,
                        avatar_url
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            setMySchools(data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
            Alert.alert('Error', 'Failed to load schools');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMySchools();
        }, [user])
    );

    const handleLeaveSchool = (schoolId, schoolName) => {
        Alert.alert(
            'Leave School',
            `Are you sure you want to leave ${schoolName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('school_members')
                                .delete()
                                .eq('user_id', user.id)
                                .eq('school_id', schoolId);

                            if (error) throw error;
                            Alert.alert('Success', `You have left ${schoolName}`);
                            fetchMySchools();

                            if (mySchools.length <= 1) {
                                navigation.navigate('FindSchools');
                            }
                        } catch (error) {
                            console.error('Error leaving school:', error);
                            Alert.alert('Error', 'Failed to leave school');
                        }
                    }
                }
            ]
        );
    };

    if (loading && mySchools.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#4a90d9" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Schools</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('FindSchools')}
                        style={styles.addButton}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.addButtonText}>Add School</Text>
                    </TouchableOpacity>
                </View>

                {mySchools.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="school-outline" size={56} color="#a3b1c6" />
                        </View>
                        <Text style={styles.emptyText}>
                            You haven't joined any schools yet.
                        </Text>
                        <TouchableOpacity
                            style={styles.findButton}
                            onPress={() => navigation.navigate('FindSchools')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.findButtonText}>Find a School</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {mySchools.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.schoolCard}
                                onPress={() => navigation.getParent()?.replace('SchoolTabs', { school: item.schools, role: item.role })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.schoolHeader}>
                                    <View style={styles.schoolIcon}>
                                        {item.schools.avatar_url ? (
                                            <Image
                                                source={{ uri: item.schools.avatar_url }}
                                                style={{ width: 48, height: 48, borderRadius: 14 }}
                                            />
                                        ) : (
                                            <Ionicons name="school" size={24} color="#4a90d9" />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.schoolName}>{item.schools.name}</Text>
                                        <Text style={styles.schoolAddress}>{item.schools.address}</Text>
                                        <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardFooter}>
                                    <TouchableOpacity
                                        onPress={() => handleLeaveSchool(item.schools.id, item.schools.name)}
                                        style={styles.leaveButton}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="log-out-outline" size={16} color="#ff6b6b" />
                                        <Text style={styles.leaveButtonText}>Leave School</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8eef5',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#2d3748',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4a90d9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: 6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(163, 177, 198, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        color: '#718096',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    findButton: {
        backgroundColor: '#4a90d9',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    findButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
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
    schoolHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    schoolIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(74, 144, 217, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    schoolName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2d3748',
    },
    schoolAddress: {
        fontSize: 14,
        color: '#718096',
        marginTop: 2,
    },
    roleText: {
        color: '#4a90d9',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 8,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(163, 177, 198, 0.2)',
        marginTop: 12,
        paddingTop: 12,
        alignItems: 'flex-end',
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.2)',
    },
    leaveButtonText: {
        color: '#ff6b6b',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
});
