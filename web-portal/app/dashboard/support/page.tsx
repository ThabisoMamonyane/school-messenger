'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const Icons = {
    Bug: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21a9 9 0 01-9-9 9 9 0 019-9 9 9 0 019 9 9 9 0 01-9 9z" /><path d="M2.5 12h5m9 0h5m-9.5 7l-2 2.5m4-2.5l2 2.5m-4-14l-2-2.5m4 2.5l2-2.5" /></svg>,
    Feature: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    Account: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    School: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    Help: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m0 4h.01" /></svg>,
    Send: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
    Mail: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Buoy: () => <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24m-4.24-9.9l4.24-4.24m-14.14 14.14l4.24-4.24" /></svg>,
};

const issueTypes = [
    { id: 'bug', label: 'Bug Report', icon: <Icons.Bug /> },
    { id: 'feature', label: 'Feature Request', icon: <Icons.Feature /> },
    { id: 'account', label: 'Account Issue', icon: <Icons.Account /> },
    { id: 'school', label: 'School Related', icon: <Icons.School /> },
    { id: 'other', label: 'Other', icon: <Icons.Help /> },
];

export default function TechnicalSupportPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [issueType, setIssueType] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(data);
            }
        };
        getUserData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!issueType || !subject || !description || !user) return;

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

            alert('Support ticket submitted successfully! Our team will get back to you soon.');
            setIssueType('');
            setSubject('');
            setDescription('');
        } catch (err: any) {
            alert('Error submitting ticket: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Technical Support</h1>
            </div>

            <div className={styles.card}>
                <div className={styles.infoSection}>
                    <div className={styles.infoIcon}><Icons.Buoy /></div>
                    <div>
                        <h2 className={styles.infoTitle}>Need Help?</h2>
                        <p className={styles.infoText}>Submit a support ticket and our team will assist you as soon as possible.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.formSection}>
                    <div>
                        <label className={styles.label}>Issue Type</label>
                        <div className={styles.issueTypeGrid}>
                            {issueTypes.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    className={`${styles.typeButton} ${issueType === type.id ? styles.activeType : ''}`}
                                    onClick={() => setIssueType(type.id)}
                                >
                                    {type.icon}
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={styles.label}>Subject</label>
                        <input
                            className={styles.input}
                            placeholder="Brief summary of your issue"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className={styles.label}>Description</label>
                        <textarea
                            className={`${styles.input} ${styles.textArea}`}
                            placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or relevant information..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading || !issueType}>
                        {loading ? 'Submitting...' : <><Icons.Send /> Submit Ticket</>}
                    </button>
                </form>

                <div className={styles.divider}>
                    <div className={styles.line}></div>
                    <span className={styles.dividerText}>or</span>
                    <div className={styles.line}></div>
                </div>

                <button
                    className={styles.emailBtn}
                    onClick={() => window.location.href = 'mailto:support@schoolmessenger.com?subject=Support Request'}
                >
                    <Icons.Mail /> Email Us Directly
                </button>

                <div className={styles.faqSection}>
                    <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
                    <div className={styles.faqGrid}>
                        <div className={styles.faqItem}>
                            <p className={styles.faqQuestion}>How do I join a school?</p>
                            <p className={styles.faqAnswer}>You can find schools in the 'Find Schools' section and request to join. Once an admin approves your request, you'll be able to see school updates.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <p className={styles.faqQuestion}>How do I reset my password?</p>
                            <p className={styles.faqAnswer}>On the login screen, click 'Forgot Password'. Follow the instructions sent to your email to set a new password securely.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <p className={styles.faqQuestion}>Why am I not receiving notifications?</p>
                            <p className={styles.faqAnswer}>Check your device's notification settings and ensure School Messenger has permission to send push notifications. Also, verify that your email is correctly set in your profile.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
