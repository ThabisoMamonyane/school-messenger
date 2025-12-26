import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ResponsiveScreen from '../components/ResponsiveScreen';

export default function SignUpScreen({ navigation }) {
    const { signUp } = useAuth();
    const { colors, isDarkMode } = useTheme();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!fullName || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const { error } = await signUp(email, password, { full_name: fullName });
            if (error) throw error;
            alert('Check your email for the confirmation link!');
            navigation.navigate('Login');
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
                        <View className="flex-1 px-6 justify-center py-8">
                            {/* Back Button */}
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                            >
                                <Ionicons name="chevron-back" size={24} color={colors.primary} />
                                <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
                            </TouchableOpacity>

                            {/* Header */}
                            <View className="mb-8">
                                <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                                    Join the school community today.
                                </Text>
                            </View>

                            {/* Form */}
                            <View className="space-y-4">
                                <View>
                                    <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                        <Ionicons name="person-outline" size={20} color={colors.textMuted} style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={[styles.input, { color: colors.text }]}
                                            placeholder="Enter your full name"
                                            placeholderTextColor={colors.textMuted}
                                            value={fullName}
                                            onChangeText={setFullName}
                                        />
                                    </View>
                                </View>

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
                                            placeholder="Create a password"
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
                                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSignUp}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Create Account</Text>
                                    )}
                                </TouchableOpacity>

                                <View className="flex-row justify-center mt-4">
                                    <Text style={[styles.secondaryText, { color: colors.textMuted }]}>Already have an account? </Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                        <Text style={[styles.linkText, { color: colors.primary }]}>Sign In</Text>
                                    </TouchableOpacity>
                                </View>
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
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backText: {
        color: '#4a90d9',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 8,
    },
    subtitle: {
        color: '#4a5568',
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
    secondaryText: {
        color: '#718096',
        fontSize: 14,
    },
    linkText: {
        color: '#4a90d9',
        fontWeight: '700',
        fontSize: 14,
    },
});
