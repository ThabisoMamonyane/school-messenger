import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import ResponsiveScreen from '../components/ResponsiveScreen';

export default function UpdatePasswordScreen({ navigation }) {
    const { clearPasswordResetPending } = useAuth();
    const { colors, isDarkMode } = useTheme();
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ResponsiveScreen maxWidth={450}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={{ flexGrow: 1 }}>
                        <View className="flex-1 px-6 justify-center">
                            <View className="items-center mb-10">
                                <View style={[styles.logoContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)', borderColor: isDarkMode ? colors.border : 'rgba(255, 255, 255, 0.9)' }]}>
                                    <Image
                                        source={require('../assets/main-logo.png')}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[styles.title, { color: colors.text }]}>Set New Password</Text>
                                <Text style={[styles.subtitle, { color: colors.textLight }]}>
                                    Please enter your new password below.
                                </Text>
                            </View>

                            <View className="space-y-4">
                                <View>
                                    <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            placeholder="Enter new password"
                                            placeholderTextColor={colors.textMuted}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View>
                                    <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            placeholder="Confirm new password"
                                            placeholderTextColor={colors.textMuted}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
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
    },
    logoContainer: {
        width: 140,
        height: 140,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 15,
    },
    label: {
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    primaryButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
});
