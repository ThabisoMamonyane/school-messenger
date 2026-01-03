import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ResponsiveScreen from '../components/ResponsiveScreen';

export default function ForgotPasswordScreen({ navigation }) {
    const { resetPassword } = useAuth();
    const { colors, isDarkMode } = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const { error } = await resetPassword(email);
            if (error) throw error;

            Alert.alert(
                'Check your email',
                'We have sent a password reset link to your email address.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
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
                            {/* Header */}
                            <View className="items-center mb-10">
                                <View style={[styles.logoContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)', borderColor: isDarkMode ? colors.border : 'rgba(255, 255, 255, 0.9)' }]}>
                                    <Image
                                        source={isDarkMode
                                            ? require('../assets/Main SC Logo white.png')
                                            : require('../assets/main-logo.png')
                                        }
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
                                <Text style={[styles.subtitle, { color: colors.textLight }]}>
                                    Enter your email address and we'll send you a link to reset your password.
                                </Text>
                            </View>

                            {/* Form */}
                            <View className="space-y-4">
                                <View>
                                    <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            placeholder="Enter your email"
                                            placeholderTextColor={colors.textMuted}
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Text style={[styles.backButtonText, { color: colors.textLight }]}>Back to Login</Text>
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
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        paddingHorizontal: 16,
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
        marginTop: 16,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
    backButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
