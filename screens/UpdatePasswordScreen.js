import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function UpdatePasswordScreen({ navigation }) {
    const { clearPasswordResetPending } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Clear pending state on unmount to prevent loops
    React.useEffect(() => {
        return () => {
            clearPasswordResetPending();
        };
    }, []);

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            Alert.alert(
                'Success',
                'Your password has been updated successfully.',
                [{
                    text: 'OK',
                    onPress: () => {
                        clearPasswordResetPending();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                    }
                }]
            );
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1 }}>
                    <View className="flex-1 px-6 justify-center">
                        <View className="items-center mb-10">
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../assets/main-logo.png')}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>Set New Password</Text>
                            <Text style={styles.subtitle}>
                                Please enter your new password below.
                            </Text>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text style={styles.label}>New Password</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#718096" style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#a0aec0"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#718096" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#718096" style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm new password"
                                        placeholderTextColor="#a0aec0"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleUpdatePassword}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Update Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        backgroundColor: '#e8eef5',
    },
    logoContainer: {
        width: 140,
        height: 140,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 8,
    },
    subtitle: {
        color: '#4a5568',
        textAlign: 'center',
        fontSize: 15,
    },
    label: {
        color: '#2d3748',
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1dbe8',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#a3b1c6',
        shadowOffset: { width: -3, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2d3748',
    },
    primaryButton: {
        backgroundColor: '#4a90d9',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
});
