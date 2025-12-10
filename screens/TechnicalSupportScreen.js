import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function TechnicalSupportScreen({ navigation }) {
    const { user, profile } = useAuth();
    const [issueType, setIssueType] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const issueTypes = [
        { id: 'bug', label: 'Bug Report', icon: 'bug-outline' },
        { id: 'feature', label: 'Feature Request', icon: 'bulb-outline' },
        { id: 'account', label: 'Account Issue', icon: 'person-outline' },
        { id: 'school', label: 'School Related', icon: 'school-outline' },
        { id: 'other', label: 'Other', icon: 'help-circle-outline' },
    ];

    const handleSubmit = async () => {
        if (!issueType) {
            Alert.alert('Error', 'Please select an issue type');
            return;
        }
        if (!subject.trim()) {
            Alert.alert('Error', 'Please enter a subject');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Error', 'Please describe your issue');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('support_tickets')
                .insert([
                    {
                        user_id: user.id,
                        user_email: user.email,
                        user_name: profile?.full_name || user.email,
                        issue_type: issueType,
                        subject: subject.trim(),
                        description: description.trim(),
                        status: 'open'
                    }
                ]);

            if (error) throw error;

            Alert.alert(
                'Ticket Submitted',
                'Thank you for your feedback! Our support team will review your issue and get back to you soon.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error submitting ticket:', error);
            Alert.alert('Error', 'Failed to submit support ticket. Please try again or contact us directly.');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSupport = () => {
        Linking.openURL('mailto:support@schoolmessenger.com?subject=Support Request');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#4a90d9" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Technical Support</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="help-buoy-outline" size={28} color="#4a90d9" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoTitle}>Need Help?</Text>
                            <Text style={styles.infoText}>
                                Submit a support ticket and our team will assist you as soon as possible.
                            </Text>
                        </View>
                    </View>

                    {/* Issue Type Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Issue Type</Text>
                        <View style={styles.issueTypeGrid}>
                            {issueTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.issueTypeButton,
                                        issueType === type.id && styles.issueTypeButtonActive
                                    ]}
                                    onPress={() => setIssueType(type.id)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={type.icon}
                                        size={24}
                                        color={issueType === type.id ? '#ffffff' : '#4a90d9'}
                                    />
                                    <Text style={[
                                        styles.issueTypeText,
                                        issueType === type.id && styles.issueTypeTextActive
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Subject */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Subject</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Brief summary of your issue"
                            placeholderTextColor="#a0aec0"
                            value={subject}
                            onChangeText={setSubject}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or relevant information..."
                            placeholderTextColor="#a0aec0"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="send-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                                <Text style={styles.submitButtonText}>Submit Ticket</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Email Support Option */}
                    <TouchableOpacity
                        style={styles.emailButton}
                        onPress={handleEmailSupport}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="mail-outline" size={20} color="#4a90d9" style={{ marginRight: 8 }} />
                        <Text style={styles.emailButtonText}>Email Us Directly</Text>
                    </TouchableOpacity>

                    {/* FAQ Section */}
                    <View style={styles.faqSection}>
                        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

                        <View style={styles.faqItem}>
                            <Ionicons name="chevron-forward" size={16} color="#4a90d9" />
                            <Text style={styles.faqText}>How do I join a school?</Text>
                        </View>
                        <View style={styles.faqItem}>
                            <Ionicons name="chevron-forward" size={16} color="#4a90d9" />
                            <Text style={styles.faqText}>How do I reset my password?</Text>
                        </View>
                        <View style={styles.faqItem}>
                            <Ionicons name="chevron-forward" size={16} color="#4a90d9" />
                            <Text style={styles.faqText}>Why am I not receiving notifications?</Text>
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
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
        fontSize: 20,
        fontWeight: '700',
        color: '#2d3748',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 217, 0.2)',
    },
    infoIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(74, 144, 217, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#4a5568',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 12,
    },
    issueTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    issueTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 217, 0.2)',
    },
    issueTypeButtonActive: {
        backgroundColor: '#4a90d9',
        borderColor: '#4a90d9',
    },
    issueTypeText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
    },
    issueTypeTextActive: {
        color: '#ffffff',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#d1dbe8',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#2d3748',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    textArea: {
        backgroundColor: '#d1dbe8',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#2d3748',
        minHeight: 140,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    submitButton: {
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
    submitButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(163, 177, 198, 0.3)',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#718096',
        fontSize: 14,
    },
    emailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(74, 144, 217, 0.3)',
    },
    emailButtonText: {
        color: '#4a90d9',
        fontSize: 16,
        fontWeight: '600',
    },
    faqSection: {
        marginTop: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    faqTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 12,
    },
    faqItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    faqText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4a5568',
    },
});
