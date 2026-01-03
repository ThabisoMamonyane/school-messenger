import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ResponsiveScreen from '../components/ResponsiveScreen';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export default function CreateSchoolScreen({ navigation }) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [province, setProvince] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoUri, setLogoUri] = useState(null);
    const [logoUrl, setLogoUrl] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const handleLogoUpload = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please allow access to your photo library to upload a school logo.');
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
                setLogoUri(image.uri);
                setUploadingLogo(true);

                try {
                    const fileExt = image.uri.split('.').pop();
                    const fileName = `pending-${user.id}-${Date.now()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    let fileBody;
                    if (Platform.OS === 'web') {
                        const response = await fetch(image.uri);
                        fileBody = await response.blob();
                    } else {
                        const base64 = await FileSystem.readAsStringAsync(image.uri, {
                            encoding: 'base64',
                        });
                        fileBody = decode(base64);
                    }

                    const { error: uploadError } = await supabase.storage
                        .from('school-avatars')
                        .upload(filePath, fileBody, {
                            contentType: `image/${fileExt}`,
                            upsert: true
                        });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('school-avatars')
                        .getPublicUrl(filePath);

                    setLogoUrl(publicUrl);
                    Alert.alert('Success', 'School logo uploaded successfully!');
                } catch (error) {
                    console.error('Error uploading logo:', error);
                    Alert.alert('Error', 'Failed to upload school logo: ' + (error.message || 'Unknown error'));
                    setLogoUri(null);
                } finally {
                    setUploadingLogo(false);
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image: ' + (error.message || 'Unknown error'));
        }
    };

    const handleSubmit = async () => {
        if (!name || !address || !province || !contactEmail) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('schools')
                .insert([
                    {
                        name,
                        address,
                        province,
                        contact_info: { email: contactEmail, phone: phoneNumber, website: website, description },
                        owner_id: user.id,
                        status: 'pending',
                        avatar_url: logoUrl
                    }
                ])
                .select();

            if (error) throw error;

            Alert.alert('Success', 'School registration request submitted! An admin will review it shortly.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ResponsiveScreen maxWidth={600}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
                    style={{ flex: 1 }}
                >
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color="#4a90d9" />
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>

                        <View style={styles.headerSection}>
                            <Text style={styles.title}>Register Your School</Text>
                            <Text style={styles.subtitle}>
                                Fill out the details below to begin the registration process.
                            </Text>
                        </View>

                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={styles.label}>School Name*</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter school name"
                                    placeholderTextColor="#a0aec0"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View>
                                <Text style={styles.label}>Address*</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter school address"
                                    placeholderTextColor="#a0aec0"
                                    value={address}
                                    onChangeText={setAddress}
                                />
                            </View>

                            <View>
                                <Text style={styles.label}>Province/State*</Text>
                                <View style={styles.selectInput}>
                                    <TextInput
                                        style={{ flex: 1, fontSize: 16, color: '#2d3748' }}
                                        placeholder="Select Province/State"
                                        placeholderTextColor="#a0aec0"
                                        value={province}
                                        onChangeText={setProvince}
                                    />
                                    <Ionicons name="chevron-down" size={20} color="#a3b1c6" />
                                </View>
                            </View>

                            <View>
                                <Text style={styles.label}>Contact Email*</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="admin@school.com"
                                    placeholderTextColor="#a0aec0"
                                    value={contactEmail}
                                    onChangeText={setContactEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View>
                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. +27 11 123 4567"
                                    placeholderTextColor="#a0aec0"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View>
                                <Text style={styles.label}>Website</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="https://www.yourschool.com"
                                    placeholderTextColor="#a0aec0"
                                    value={website}
                                    onChangeText={setWebsite}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Logo Upload */}
                            <View>
                                <Text style={styles.label}>School Logo</Text>
                                <TouchableOpacity
                                    style={styles.uploadArea}
                                    onPress={handleLogoUpload}
                                    disabled={uploadingLogo}
                                    activeOpacity={0.7}
                                >
                                    {uploadingLogo ? (
                                        <>
                                            <ActivityIndicator size="large" color="#4a90d9" style={{ marginBottom: 8 }} />
                                            <Text style={styles.uploadText}>Uploading logo...</Text>
                                        </>
                                    ) : logoUri ? (
                                        <>
                                            <Image
                                                source={{ uri: logoUri }}
                                                style={styles.logoPreview}
                                                resizeMode="cover"
                                            />
                                            <Text style={styles.uploadText}>Tap to change logo</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="cloud-upload-outline" size={40} color="#4a90d9" style={{ marginBottom: 8 }} />
                                            <Text style={styles.uploadText}>Click to upload school logo</Text>
                                            <Text style={styles.uploadHint}>PNG, JPG up to 5MB</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Description */}
                            <View>
                                <Text style={styles.label}>School Description</Text>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="Tell us about your school..."
                                    placeholderTextColor="#a0aec0"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmit}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Request</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </ResponsiveScreen>
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
        marginBottom: 28,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2d3748',
        textAlign: 'center',
    },
    subtitle: {
        color: '#718096',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    label: {
        color: '#2d3748',
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 14,
    },
    input: {
        backgroundColor: '#d1dbe8',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#2d3748',
        shadowColor: '#a3b1c6',
        shadowOffset: { width: -3, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    selectInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#d1dbe8',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    uploadArea: {
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(74, 144, 217, 0.3)',
        borderRadius: 20,
        minHeight: 140,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    logoPreview: {
        width: 80,
        height: 80,
        borderRadius: 16,
        marginBottom: 8,
    },
    uploadText: {
        color: '#4a90d9',
        fontWeight: '600',
    },
    uploadHint: {
        color: '#718096',
        fontSize: 12,
        marginTop: 4,
    },
    textArea: {
        backgroundColor: '#d1dbe8',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#2d3748',
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
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
