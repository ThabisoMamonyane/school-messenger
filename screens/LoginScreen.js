import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ResponsiveScreen from '../components/ResponsiveScreen';

export default function LoginScreen({ navigation }) {
    const { signIn } = useAuth();
    const { colors, isDarkMode } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
        } catch (error) {
            alert(error.message);
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
                                <View style={[styles.logoContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)', borderColor: colors.border }]}>
                                    <Image
                                        source={isDarkMode
                                            ? require('../assets/Main SC Logo white.png')
                                            : require('../assets/main-logo.png')
                                        }
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                                    Sign in to continue to the school portal.
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

                                <View>
                                    <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            placeholder="Enter your password"
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

                                <TouchableOpacity
                                    className="self-end"
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                >
                                    <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Sign In</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.secondaryButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(74, 144, 217, 0.15)', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(74, 144, 217, 0.3)' }]}
                                    onPress={() => navigation.navigate('SignUp')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Create Account</Text>
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
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#a3b1c6',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
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
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2d3748',
    },
    forgotText: {
        color: '#4a90d9',
        fontWeight: '600',
        fontSize: 14,
    },
    primaryButton: {
        backgroundColor: '#4a90d9',
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
    secondaryButton: {
        backgroundColor: 'rgba(74, 144, 217, 0.15)',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 217, 0.3)',
    },
    secondaryButtonText: {
        color: '#4a90d9',
        fontSize: 17,
        fontWeight: '700',
    },
});
