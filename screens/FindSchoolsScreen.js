import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager, Image, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function FindSchoolsScreen({ navigation }) {
    const { user } = useAuth();
    const [schools, setSchools] = useState([]);
    const [filteredSchools, setFilteredSchools] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [joiningSchoolId, setJoiningSchoolId] = useState(null);
    const [mySchoolIds, setMySchoolIds] = useState([]);
    const [expandedSchoolId, setExpandedSchoolId] = useState(null);

    useEffect(() => {
        fetchSchools();
        fetchMySchools();
    }, []);

    useEffect(() => {
        filterSchools();
    }, [searchQuery, schools]);

    const fetchSchools = async () => {
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .eq('status', 'approved')
                .order('name');

            if (error) throw error;
            setSchools(data || []);
            setFilteredSchools(data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
            Alert.alert('Error', 'Failed to load schools');
        } finally {
            setLoading(false);
        }
    };

    const fetchMySchools = async () => {
        try {
            const { data, error } = await supabase
                .from('school_members')
                .select('school_id')
                .eq('user_id', user.id);

            if (error) throw error;
            setMySchoolIds(data.map(item => item.school_id));
        } catch (error) {
            console.error('Error fetching my schools:', error);
        }
    };

    const filterSchools = () => {
        if (!searchQuery.trim()) {
            setFilteredSchools(schools);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = schools.filter(school =>
            school.name.toLowerCase().includes(query) ||
            school.address?.toLowerCase().includes(query) ||
            school.province?.toLowerCase().includes(query)
        );
        setFilteredSchools(filtered);
    };

    const handleJoinSchool = async (schoolId, schoolName) => {
        setJoiningSchoolId(schoolId);
        try {
            const { error } = await supabase
                .from('school_members')
                .insert([
                    {
                        user_id: user.id,
                        school_id: schoolId,
                        role: 'parent'
                    }
                ]);

            if (error) {
                if (error.code === '23505') {
                    Alert.alert('Already Joined', 'You are already a member of this school');
                } else {
                    throw error;
                }
            } else {
                Alert.alert('Success', `You have joined ${schoolName}!`);
                setMySchoolIds([...mySchoolIds, schoolId]);
            }
        } catch (error) {
            console.error('Error joining school:', error);
            Alert.alert('Error', error.message);
        } finally {
            setJoiningSchoolId(null);
        }
    };

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSchoolId(expandedSchoolId === id ? null : id);
    };

    const renderSchoolItem = ({ item }) => {
        const isJoined = mySchoolIds.includes(item.id);
        const isJoining = joiningSchoolId === item.id;
        const isExpanded = expandedSchoolId === item.id;

        return (
            <TouchableOpacity
                style={styles.schoolCard}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.schoolHeader}>
                    {/* School Badge - Always visible */}
                    {item.avatar_url ? (
                        <Image
                            source={{ uri: item.avatar_url }}
                            style={styles.schoolBadge}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.schoolBadgePlaceholder}>
                            <Ionicons name="school" size={20} color="#4a90d9" />
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.schoolName}>{item.name}</Text>
                        <Text style={styles.schoolAddress}>{item.address}</Text>
                        <Text style={styles.schoolProvince}>{item.province}</Text>
                    </View>
                    {isJoined && (
                        <View style={styles.joinedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#00b894" />
                        </View>
                    )}
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#a3b1c6"
                    />
                </View>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.schoolDetails}>
                            {item.avatar_url ? (
                                <Image
                                    source={{ uri: item.avatar_url }}
                                    style={styles.schoolImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.schoolImagePlaceholder}>
                                    <Ionicons name="school-outline" size={32} color="#4a90d9" />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.schoolDescription}>
                                    {item.contact_info?.description || "No description available."}
                                </Text>
                                {item.contact_info?.email && (
                                    <View style={styles.emailRow}>
                                        <Ionicons name="mail-outline" size={14} color="#718096" style={{ marginRight: 4 }} />
                                        <Text style={styles.emailText}>{item.contact_info.email}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.joinButton, isJoined && styles.joinedButton]}
                            onPress={() => handleJoinSchool(item.id, item.name)}
                            disabled={isJoined || isJoining}
                            activeOpacity={0.8}
                        >
                            {isJoining ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    {isJoined && <Ionicons name="checkmark-circle-outline" size={18} color="#00b894" style={{ marginRight: 6 }} />}
                                    <Text style={[styles.joinButtonText, isJoined && styles.joinedButtonText]}>
                                        {isJoined ? 'Joined' : 'Join School'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#4a90d9" />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Text style={styles.title}>Find Schools</Text>
                        <Text style={styles.subtitle}>Search and join schools to stay connected</Text>
                    </View>

                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#718096" style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name, address, or province..."
                            placeholderTextColor="#a0aec0"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#a3b1c6" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#4a90d9" style={{ marginTop: 40 }} />
                    ) : filteredSchools.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="school-outline" size={48} color="#a3b1c6" />
                            </View>
                            <Text style={styles.emptyText}>No schools found</Text>
                            {searchQuery && (
                                <Text style={styles.emptyHint}>Try a different search term</Text>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={filteredSchools}
                            renderItem={renderSchoolItem}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
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
        marginBottom: 16,
    },
    backText: {
        color: '#4a90d9',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 4,
    },
    headerInfo: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2d3748',
    },
    subtitle: {
        fontSize: 15,
        color: '#718096',
        marginTop: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1dbe8',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        shadowColor: '#a3b1c6',
        shadowOffset: { width: -3, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
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
    schoolHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    schoolBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        marginRight: 14,
    },
    schoolBadgePlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(74, 144, 217, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    joinedBadge: {
        marginRight: 8,
    },
    schoolName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2d3748',
    },
    schoolAddress: {
        fontSize: 14,
        color: '#4a5568',
        marginTop: 4,
    },
    schoolProvince: {
        fontSize: 13,
        color: '#718096',
    },
    expandedContent: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(163, 177, 198, 0.2)',
    },
    schoolDetails: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    schoolImage: {
        width: 72,
        height: 72,
        borderRadius: 16,
        marginRight: 16,
    },
    schoolImagePlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 16,
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    schoolDescription: {
        fontSize: 14,
        color: '#4a5568',
        lineHeight: 20,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    emailText: {
        fontSize: 13,
        color: '#718096',
    },
    joinButton: {
        backgroundColor: '#4a90d9',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    joinedButton: {
        backgroundColor: 'rgba(0, 184, 148, 0.1)',
        shadowOpacity: 0,
        elevation: 0,
    },
    joinButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    joinedButtonText: {
        color: '#00b894',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
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
});
