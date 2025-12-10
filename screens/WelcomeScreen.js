import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen({ navigation }) {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const floatingAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        floatingAnimation.start();

        return () => floatingAnimation.stop();
    }, [floatAnim]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.gradientBg}>
                <View style={styles.contentContainer}>
                    {/* Logo centered on screen with floating animation */}
                    <View style={styles.logoSection}>
                        <Animated.Image
                            source={require('../assets/main-logo.png')}
                            style={[
                                styles.logo,
                                { transform: [{ translateY: floatAnim }] }
                            ]}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Content at bottom */}
                    <View style={styles.bottomSection}>
                        <Text style={styles.tagline}>
                            Your school community, all in one place.
                        </Text>

                        {/* Morphism Button */}
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>
                                Get Started
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row mt-6">
                            <Text style={styles.secondaryText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.linkText}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8eef5',
    },
    gradientBg: {
        flex: 1,
        backgroundColor: '#e8eef5',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    logoSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: 280,
    },
    bottomSection: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 16,
    },
    tagline: {
        fontSize: 16,
        color: '#4a5568',
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 16,
        fontWeight: '500',
    },
    primaryButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 20,
        backgroundColor: '#4a90d9',
        alignItems: 'center',
        justifyContent: 'center',
        // Neumorphic raised effect
        shadowColor: '#3a7bc8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
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
