import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ResponsiveScreen from '../components/ResponsiveScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();

    const Section = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.sectionContent, { color: colors.textMuted }]}>{children}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundLight }]}>
            <ResponsiveScreen maxWidth={800}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="apps" size={24} color={colors.primary} />
                        <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                    <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Last updated: December 2025</Text>

                    <Section title="1. Introduction">
                        Welcome to School Messenger. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you use our application and tell you about your privacy rights and how the law protects you.
                    </Section>

                    <Section title="2. The Data We Collect">
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        {'\n\n'}• Identity Data: Setup details including First Name, Last Name, and Profile Picture.
                        {'\n'}• Contact Data: Email address and School/Group memberships.
                        {'\n'}• Device Data: Device tokens for push notifications.
                        {'\n'}• Usage Data: Information about how you use our app, such as message read receipts.
                    </Section>

                    <Section title="3. How We Use Your Data">
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        {'\n\n'}• To register you as a new user.
                        {'\n'}• To provide communication services between your school and you.
                        {'\n'}• To manage our relationship with you including notifying you about changes.
                        {'\n'}• To deliver relevant content and notifications to you.
                    </Section>

                    <Section title="4. Data Security">
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. Access to your personal data is limited to those employees, agents, contractors and other third parties who have a business need to know.
                    </Section>

                    <Section title="5. Your Legal Rights">
                        Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
                    </Section>

                    <Section title="6. Contact Us">
                        If you have any questions about this privacy policy or our privacy practices, please contact your school administrator or our support team via the Technical Support feature in the app.
                    </Section>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textMuted }]}>
                            © 2025 School Messenger. All rights reserved.
                        </Text>
                    </View>
                </ScrollView>
            </ResponsiveScreen>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 60,
    },
    backText: {
        fontSize: 16,
        marginLeft: 4,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
    },
    lastUpdated: {
        fontSize: 14,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    sectionContent: {
        fontSize: 15,
        lineHeight: 24,
    },
    footer: {
        marginTop: 20,
        marginBottom: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
    },
});
