'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [message, setMessage] = useState('Verifying your account...');

    useEffect(() => {
        // The supabase client is initialized in lib/supabase.ts
        // It should automatically detect the code/token in the URL hash or query params
        // and exchange it for a session if configured correctly.

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            logger.info('Auth', `Auth state change event in callback: ${event}`);
            if (event === 'SIGNED_IN') {
                logger.info('Auth', 'Verification successful, redirecting to dashboard');
                setMessage('Verification successful! Redirecting...');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } else if (event === 'USER_UPDATED') {
                logger.info('Auth', 'User updated, redirecting to dashboard');
                // Sometimes password recovery triggers this
                setMessage('Account updated. Redirecting...');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            }
        });

        // Fallback check if user is already signed in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                logger.info('Auth', 'User already has session in callback, redirecting');
                setMessage('You are already logged in. Redirecting...');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            } else {
                // Check if there is a hash error
                if (window.location.hash.includes('error=')) {
                    setMessage('Error verifying account. The link may be invalid or expired.');
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                backgroundColor: 'white',
                textAlign: 'center',
                maxWidth: '400px'
            }}>
                <h2 style={{ marginBottom: '1rem', color: '#1a202c' }}>{message}</h2>
                <div style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid #e2e8f0',
                    borderTopColor: '#3182ce',
                    borderRadius: '50%',
                    margin: '0 auto',
                    animation: 'spin 1s linear infinite'
                }} />
                <style jsx global>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
}
