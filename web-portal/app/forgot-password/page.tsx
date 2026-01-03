'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from '../page.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (authError) throw authError;

            setSuccess('Check your email for the password reset link.');
            setEmail('');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Left Side - Hero Image */}
            <div className={styles.imageSection}>
                <div className={styles.heroContent}>
                    <img
                        src="/logo-white.png"
                        alt="School Messenger"
                        className={styles.heroLogo}
                    />
                </div>
            </div>

            {/* Right Side - Form */}
            <div className={styles.formSection}>
                <div className={styles.formWrapper}>
                    <div className={styles.logo}>
                        <img src="/logo.png" alt="School Messenger" className={styles.formLogo} />
                    </div>

                    <h1 className={styles.title}>Forgot Password?</h1>
                    <p className={styles.subtitle}>
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    <form onSubmit={handleReset} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}
                        {success && <div className={styles.error} style={{ backgroundColor: '#f0fff4', borderColor: '#c6f6d5', color: '#2f855a' }}>{success}</div>}

                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Email <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputIcon}>@</span>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Example@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Sending Link...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <div className={styles.signupPrompt}>
                        Remember your password? <a href="/">Sign In</a>
                    </div>

                    <div className={styles.footer}>
                        © {new Date().getFullYear()} School Messenger. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
