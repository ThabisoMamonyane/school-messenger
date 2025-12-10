import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, TextInput, ActivityIndicator, Image, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function SchoolProfileScreen({ route, navigation }) {
    const { school: initialSchool, role } = route.params || {};
    const [school, setSchool] = useState(initialSchool || {});
    const [editing, setEditing] = useState(false);
    const [editedSchool, setEditedSchool] = useState(initialSchool || {});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    const canEdit = role === 'admin';

    useFocusEffect(
        useCallback(() => {
            const fetchSchoolData = async () => {
                if (!initialSchool?.id) return;
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('schools')
                        .select('*')
                        .eq('id', initialSchool.id)
                        .single();

                    if (error) throw error;
                    if (data) {
                        setSchool(data);
                        setEditedSchool(data);
                    }
                } catch (error) {
                    console.error('Error fetching school data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchSchoolData();
        }, [initialSchool?.id])
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('schools')
                .update({
                    name: editedSchool.name,
                    address: editedSchool.address,
                    province: editedSchool.province,
                    contact_info: editedSchool.contact_info,
                    avatar_url: editedSchool.avatar_url
                })
                .eq('id', school.id)
                .select();

            if (error) throw error;
            setSchool(editedSchool);
            setEditing(false);
            Alert.alert('Success', 'School profile updated successfully');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to save school profile');
        } finally {
            setSaving(false);
        }
    };

    const openMaps = () => {
        const query = `${school.address}, ${school.province}`;
        const url = Platform.select({
            ios: `maps:0,0?q=${query}`,
            android: `geo:0,0?q=${query}`,
        });
        Linking.openURL(url);
    };

    const callPhone = () => {
        if (school.contact_info?.phone) {
            Linking.openURL(`tel:${school.contact_info.phone}`);
        }
    };

    const openWebsite = () => {
        if (school.contact_info?.website) {
            Linking.openURL(school.contact_info.website);
        }
    };

    const handleAvatarUpload = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please allow access to your photo library.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const image = result.assets[0];
                const fileExt = image.uri.split('.').pop();
                const fileName = `${school.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const base64 = await FileSystem.readAsStringAsync(image.uri, {
                    encoding: 'base64',
                });

                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const { error: uploadError } = await supabase.storage
                    .from('school-avatars')
                    .upload(filePath, bytes.buffer, {
                        contentType: `image/${fileExt}`,
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('school-avatars')
                    .getPublicUrl(filePath);

                setEditedSchool({ ...editedSchool, avatar_url: publicUrl });
                Alert.alert('Success', 'School logo uploaded. Remember to save your changes.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to upload school logo: ' + (error.message || 'Unknown error'));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#4a90d9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>School Profile</Text>
                {canEdit && !editing && (
                    <TouchableOpacity onPress={() => setEditing(true)}>
                        <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                )}
                {editing && (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => {
                            setEditedSchool(school);
                            setEditing(false);
                        }}>
                            <Text style={styles.cancelLink}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            {saving ? (
                                <ActivityIndicator size="small" color="#4a90d9" />
                            ) : (
                                <Text style={styles.saveLink}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* School Header with Avatar */}
                <View style={styles.avatarSection}>
                    <View style={{ position: 'relative' }}>
                        {(editedSchool.avatar_url || school.avatar_url) ? (
                            <Image
                                source={{ uri: editing ? editedSchool.avatar_url : school.avatar_url }}
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="school-outline" size={56} color="#4a90d9" />
                            </View>
                        )}
                        {editing && (
                            <TouchableOpacity style={styles.cameraButton} onPress={handleAvatarUpload}>
                                <Ionicons name="camera" size={18} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={{ marginTop: 16, width: '100%' }}>
                        {editing ? (
                            <TextInput
                                style={styles.schoolNameInput}
                                value={editedSchool.name}
                                onChangeText={(text) => setEditedSchool({ ...editedSchool, name: text })}
                                placeholder="School Name"
                                placeholderTextColor="#a0aec0"
                            />
                        ) : (
                            <Text style={styles.schoolName}>{school.name}</Text>
                        )}
                    </View>
                </View>

                {/* Description */}
                {(editing || school.contact_info?.description) && (
                    <View style={styles.section}>
                        <View style={styles.card}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <Ionicons name="information-circle-outline" size={20} color="#4a90d9" style={{ marginRight: 8 }} />
                                <Text style={styles.cardLabel}>About</Text>
                            </View>
                            {editing ? (
                                <TextInput
                                    style={styles.textArea}
                                    value={editedSchool.contact_info?.description || ''}
                                    onChangeText={(text) => setEditedSchool({
                                        ...editedSchool,
                                        contact_info: { ...editedSchool.contact_info, description: text }
                                    })}
                                    placeholder="School Description"
                                    placeholderTextColor="#a0aec0"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            ) : (
                                <Text style={styles.cardText}>{school.contact_info?.description}</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Info Cards */}
                <View style={styles.section}>
                    {/* Address */}
                    <TouchableOpacity
                        style={styles.infoCard}
                        onPress={editing ? null : openMaps}
                        disabled={editing}
                        activeOpacity={0.7}
                    >
                        <View style={styles.infoIcon}>
                            <Ionicons name="location-outline" size={22} color="#4a90d9" />
                        </View>
                        <View style={{ flex: 1 }}>
                            {editing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={editedSchool.address}
                                    onChangeText={(text) => setEditedSchool({ ...editedSchool, address: text })}
                                    placeholder="Address"
                                    placeholderTextColor="#a0aec0"
                                />
                            ) : (
                                <Text style={styles.infoText}>{school.address}</Text>
                            )}
                        </View>
                        {!editing && <Ionicons name="chevron-forward" size={20} color="#a3b1c6" />}
                    </TouchableOpacity>

                    {/* Province */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="map-outline" size={22} color="#4a90d9" />
                        </View>
                        <View style={{ flex: 1 }}>
                            {editing ? (
                                <TextInput
                                    style={styles.infoInput}
                                    value={editedSchool.province}
                                    onChangeText={(text) => setEditedSchool({ ...editedSchool, province: text })}
                                    placeholder="Province"
                                    placeholderTextColor="#a0aec0"
                                />
                            ) : (
                                <Text style={styles.infoText}>{school.province}</Text>
                            )}
                        </View>
                    </View>

                    {/* Phone */}
                    {(editing || school.contact_info?.phone) && (
                        <TouchableOpacity
                            style={styles.infoCard}
                            onPress={editing ? null : callPhone}
                            disabled={editing}
                            activeOpacity={0.7}
                        >
                            <View style={styles.infoIcon}>
                                <Ionicons name="call-outline" size={22} color="#4a90d9" />
                            </View>
                            <View style={{ flex: 1 }}>
                                {editing ? (
                                    <TextInput
                                        style={styles.infoInput}
                                        value={editedSchool.contact_info?.phone || ''}
                                        onChangeText={(text) => setEditedSchool({
                                            ...editedSchool,
                                            contact_info: { ...editedSchool.contact_info, phone: text }
                                        })}
                                        placeholder="Phone Number"
                                        placeholderTextColor="#a0aec0"
                                        keyboardType="phone-pad"
                                    />
                                ) : (
                                    <Text style={styles.infoText}>{school.contact_info?.phone}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Website */}
                    {(editing || school.contact_info?.website) && (
                        <TouchableOpacity
                            style={styles.infoCard}
                            onPress={editing ? null : openWebsite}
                            disabled={editing}
                            activeOpacity={0.7}
                        >
                            <View style={styles.infoIcon}>
                                <Ionicons name="globe-outline" size={22} color="#4a90d9" />
                            </View>
                            <View style={{ flex: 1 }}>
                                {editing ? (
                                    <TextInput
                                        style={styles.infoInput}
                                        value={editedSchool.contact_info?.website || ''}
                                        onChangeText={(text) => setEditedSchool({
                                            ...editedSchool,
                                            contact_info: { ...editedSchool.contact_info, website: text }
                                        })}
                                        placeholder="Website"
                                        placeholderTextColor="#a0aec0"
                                        keyboardType="url"
                                        autoCapitalize="none"
                                    />
                                ) : (
                                    <Text style={styles.infoText}>{school.contact_info?.website}</Text>
                                )}
                            </View>
                            {!editing && <Ionicons name="chevron-forward" size={20} color="#a3b1c6" />}
                        </TouchableOpacity>
                    )}

                    {/* Email */}
                    {(editing || school.contact_info?.email) && (
                        <View style={styles.infoCard}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="mail-outline" size={22} color="#4a90d9" />
                            </View>
                            <View style={{ flex: 1 }}>
                                {editing ? (
                                    <TextInput
                                        style={styles.infoInput}
                                        value={editedSchool.contact_info?.email || ''}
                                        onChangeText={(text) => setEditedSchool({
                                            ...editedSchool,
                                            contact_info: { ...editedSchool.contact_info, email: text }
                                        })}
                                        placeholder="Email"
                                        placeholderTextColor="#a0aec0"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                ) : (
                                    <Text style={styles.infoText}>{school.contact_info?.email}</Text>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* Get Directions Button - inside ScrollView so it scrolls */}
                {!editing && (
                    <View style={styles.directionsContainer}>
                        <TouchableOpacity style={styles.directionsButton} onPress={openMaps} activeOpacity={0.8}>
                            <Ionicons name="navigate-circle-outline" size={24} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.directionsButtonText}>Get Directions</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bottom padding for tab bar */}
                <View style={{ height: 100 }} />
            </ScrollView>
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
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#2d3748',
        marginLeft: 8,
    },
    editLink: {
        color: '#4a90d9',
        fontWeight: '600',
        fontSize: 16,
    },
    cancelLink: {
        color: '#718096',
        fontWeight: '600',
        fontSize: 16,
    },
    saveLink: {
        color: '#4a90d9',
        fontWeight: '600',
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 24,
        backgroundColor: '#d1dbe8',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 24,
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 217, 0.2)',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4a90d9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#e8eef5',
    },
    schoolName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2d3748',
        textAlign: 'center',
    },
    schoolNameInput: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2d3748',
        textAlign: 'center',
        backgroundColor: '#d1dbe8',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    cardLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2d3748',
    },
    cardText: {
        fontSize: 14,
        color: '#4a5568',
        lineHeight: 22,
    },
    textArea: {
        backgroundColor: '#d1dbe8',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#2d3748',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    infoCard: {
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
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(74, 144, 217, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    infoText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3748',
    },
    infoInput: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3748',
        backgroundColor: '#d1dbe8',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    directionsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4a90d9',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    directionsButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 17,
    },
});
