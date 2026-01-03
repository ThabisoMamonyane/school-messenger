import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import ResponsiveScreen from '../components/ResponsiveScreen';
import { useFocusEffect } from '@react-navigation/native';

export default function MySchoolsScreen({ navigation }) {
    const { user } = useAuth();
    const { colors, isDarkMode } = useTheme();
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
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ResponsiveScreen maxWidth={800}>
                {/* Header */}
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>My Schools</Text>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('FindSchools')}>
                        <MaterialCommunityIcons name="plus-circle-outline" size={28} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                    {/* Intro Section */}
                    <View style={styles.introSection}>
                        <Text style={[styles.introTitle, { color: colors.text }]}>Enrolled Schools</Text>
                        <Text style={[styles.introSubtitle, { color: colors.textMuted }]}>
                            Your personal learning space with all enrolled schools and communities.
                        </Text>

                        <View style={styles.pillsRow}>
                            <View style={styles.pill}>
                                <MaterialCommunityIcons name="school-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.pillText}>{mySchools.length} Schools</Text>
                            </View>
                            <View style={[styles.pill, { backgroundColor: isDarkMode ? colors.surface : '#E2E8F0' }]}>
                                <MaterialCommunityIcons name="bookshelf" size={18} color={colors.textMuted} />
                                <Text style={[styles.pillText, { color: colors.textMuted }]}>Active</Text>
                            </View>
                        </View>
                    </View>



                    {/* My Schools List */}
                    <View style={styles.listSection}>
                        <View style={styles.listHeader}>
                            <Text style={[styles.listTitle, { color: colors.text }]}>My Schools</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('FindSchools')}>
                                <Text style={[styles.seeAllText, { color: colors.textMuted }]}>Find More</Text>
                            </TouchableOpacity>
                        </View>

                        {mySchools.length === 0 ? (
                            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                                <MaterialCommunityIcons name="school-outline" size={48} color={colors.textMuted} />
                                <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>No schools joined yet.</Text>
                                <TouchableOpacity
                                    style={styles.findButton}
                                    onPress={() => navigation.navigate('FindSchools')}
                                >
                                    <Text style={styles.findButtonText}>Find a School</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                {mySchools.map((item, index) => {
                                    // Gradients for cards
                                    const gradients = [
                                        ['#E0C3FC', '#8EC5FC'], // Lavender
                                        ['#ffecd2', '#fcb69f'], // Melon
                                        ['#a1c4fd', '#c2e9fb'], // Light Blue
                                    ];
                                    const gradient = gradients[index % gradients.length];

                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={styles.cardContainer}
                                            onPress={() => navigation.navigate('Profile', { school: item.schools, role: item.role })}
                                            activeOpacity={0.9}
                                        >
                                            <LinearGradient
                                                colors={gradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.cardContent}
                                            >
                                                <View style={styles.cardRow}>
                                                    <View style={styles.cardIconContainer}>
                                                        {item.schools.avatar_url ? (
                                                            <Image
                                                                source={{ uri: item.schools.avatar_url }}
                                                                style={styles.cardAvatar}
                                                            />
                                                        ) : (
                                                            <MaterialCommunityIcons name="school-outline" size={24} color="#4A90D9" />
                                                        )}
                                                    </View>
                                                    <View style={styles.cardTextContainer}>
                                                        <Text style={[styles.cardSchoolName, { color: '#1E293B' }]}>{item.schools.name}</Text>
                                                        <Text style={[styles.cardRole, { color: '#475569' }]}>{item.role.toUpperCase()}</Text>

                                                        <View style={styles.cardStatsRow}>
                                                            <View style={styles.cardStat}>
                                                                <MaterialCommunityIcons name="map-marker-outline" size={14} color="#475569" />
                                                                <Text style={styles.cardStatText}>{item.schools.province}</Text>
                                                            </View>
                                                            <View style={[styles.cardStat, { marginLeft: 12 }]}>
                                                                <MaterialCommunityIcons name="account-group-outline" size={14} color="#475569" />
                                                                <Text style={styles.cardStatText}>Member</Text>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    <TouchableOpacity
                                                        style={styles.cardArrow}
                                                        onPress={() => navigation.navigate('Profile', { school: item.schools, role: item.role })}
                                                    >
                                                        <MaterialCommunityIcons name="chevron-right" size={20} color="#1E293B" />
                                                    </TouchableOpacity>
                                                </View>

                                                <TouchableOpacity
                                                    style={styles.leaveButtonAbs}
                                                    onPress={() => handleLeaveSchool(item.schools.id, item.schools.name)}
                                                >
                                                    <MaterialCommunityIcons name="logout" size={20} color="#475569" />
                                                </TouchableOpacity>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </ResponsiveScreen>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    headerBtn: {
        padding: 4,
    },
    introSection: {
        marginBottom: 32,
    },
    introTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
    },
    introSubtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 20,
    },
    pillsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A90D9',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 12,
    },
    pillLight: {
        backgroundColor: '#E2E8F0',
    },
    pillText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    pillTextLight: {
        color: '#475569',
        marginLeft: 6,
    },

    listSection: {
        marginBottom: 24,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    seeAllText: {
        fontSize: 13,
        color: '#64748B',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        color: '#94A3B8',
        marginTop: 12,
        marginBottom: 20,
    },
    findButton: {
        backgroundColor: '#4A90D9',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    findButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    cardContainer: {
        marginBottom: 16,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardContent: {
        borderRadius: 24,
        padding: 20,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardAvatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardSchoolName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    cardRole: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    cardStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardStat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardStatText: {
        fontSize: 11,
        color: '#475569',
        marginLeft: 4,
        fontWeight: '500',
    },
    cardArrow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    leaveButtonAbs: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
});
