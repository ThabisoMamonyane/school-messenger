'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from '../page.module.css';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        // Listen for auth state changes - specifically PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);

            if (event === 'PASSWORD_RECOVERY') {
                // User clicked on the recovery link and token was exchanged
                setIsReady(true);
                setInitializing(false);
            } else if (event === 'SIGNED_IN' && session) {
                // User is already signed in (might happen after recovery)
                setIsReady(true);
                setInitializing(false);
            }
        });

        // Also check if there's already a session (in case event already fired)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsReady(true);
            }
            // After a delay, stop initializing even if no session (might be expired link)
            setTimeout(() => {
                setInitializing(false);
            }, 3000);
        };

        checkSession();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess('Password updated successfully! Redirecting to login...');
            // Sign out after password update so user can log in fresh
            await supabase.auth.signOut();
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    // Show loading spinner while checking auth state
    if (initializing) {
        return (
            <div className={styles.container}>
                <div className={styles.formSection} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #e2e8f0',
                            borderTopColor: '#4a90d9',
                            borderRadius: '50%',
                            margin: '0 auto 1rem',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ color: '#4a5568' }}>Verifying your reset link...</p>
                        <style jsx global>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                </div>
            </div>
        );
    }

    // Show error if not ready (invalid/expired link)
    if (!isReady) {
        return (
            <div className={styles.container}>
                <div className={styles.formSection} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: '#fed7d7',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            fontSize: '24px'
                        }}>⚠️</div>
                        <h2 style={{ color: '#c53030', marginBottom: '0.5rem' }}>Invalid or Expired Link</h2>
                        <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                            This password reset link has expired or is invalid. Please request a new one.
                        </p>
                        <a
                            href="/forgot-password"
                            style={{
                                display: 'inline-block',
                                backgroundColor: '#4a90d9',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 600
                            }}
                        >
                            Request New Link
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.imageSection}>
                <div className={styles.heroContent}>
                    <img src="/logo-white.png" alt="School Messenger" className={styles.heroLogo} />
                </div>
            </div>

            <div className={styles.formSection}>
                <div className={styles.formWrapper}>
                    <div className={styles.logo}>
                        <img src="/logo.png" alt="School Messenger" className={styles.formLogo} />
                    </div>

                    <h1 className={styles.title}>Set New Password</h1>
                    <p className={styles.subtitle}>
                        Please enter your new password below.
                    </p>

                    <form onSubmit={handleUpdatePassword} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}
                        {success && <div className={styles.error} style={{ backgroundColor: '#f0fff4', borderColor: '#c6f6d5', color: '#2f855a' }}>{success}</div>}

                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>
                                New Password <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword" className={styles.label}>
                                Confirm Password <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a90d9', fontSize: 14 }}
                            >
                                {showPassword ? 'Hide Password' : 'Show Password'}
                            </button>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
