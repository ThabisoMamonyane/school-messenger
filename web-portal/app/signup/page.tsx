'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from '../page.module.css';
import { logger } from '@/lib/logger';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !fullName) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        logger.info('Auth', `Signup attempt for email: ${email}`);

        try {
            const { error: authError, data } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: fullName,
                        role: 'parent', // Default role
                    },
                },
            });

            if (authError) throw authError;

            if (data.user) {
                logger.info('Auth', `Signup successful for user: ${data.user.id}`);
                setSuccess('Account created! Please check your email to verify your account.');
                // Optional: clear form
                setEmail('');
                setPassword('');
                setFullName('');
            }
        } catch (err: any) {
            logger.error('Auth', 'Signup failed', err);
            setError(err.message || 'Failed to sign up');
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

                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>
                        Join your school community to stay connected.
                    </p>

                    <form onSubmit={handleSignup} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}
                        {success && <div className={styles.error} style={{ backgroundColor: '#f0fff4', borderColor: '#c6f6d5', color: '#2f855a' }}>{success}</div>}

                        <div className={styles.inputGroup}>
                            <label htmlFor="fullName" className={styles.label}>
                                Full Name <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputIcon}>👤</span>
                                <input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

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

                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Password <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <svg className={styles.inputIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={styles.input}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.showPasswordBtn}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className={styles.signupPrompt}>
                        Already have an account? <a href="/">Sign In</a>
                    </div>

                    <div className={styles.termsText}>
                        By creating account you agree to School Messenger<br />
                        <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
                    </div>

                    <div className={styles.footer}>
                        © {new Date().getFullYear()} School Messenger. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
