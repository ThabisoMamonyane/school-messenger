import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

import { usePushNotifications } from '../hooks/usePushNotifications';

import * as Linking from 'expo-linking';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    const { expoPushToken } = usePushNotifications();

    useEffect(() => {
        const fetchProfile = async (session) => {
            if (session?.user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (!error && data) {
                    setProfile(data);
                }
            } else {
                setProfile(null);
            }
        };

        // Check for active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            fetchProfile(session);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            fetchProfile(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
        return () => subscription.unsubscribe();
    }, []);

    // Save Push Token to Database
    useEffect(() => {
        const updatePushToken = async () => {
            if (user && expoPushToken) {
                console.log('Saving push token to database...', expoPushToken);
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ expo_push_token: expoPushToken })
                        .eq('id', user.id);

                    if (error) throw error;
                    console.log('Push token saved successfully.');
                } catch (error) {
                    console.error('Error saving push token:', error);
                    // Alert.alert('Error', 'Failed to save push token');
                }
            }
        };

        updatePushToken();
    }, [user, expoPushToken]);

    const [passwordResetPending, setPasswordResetPending] = useState(false);

    // ...

    // Handle deep links for password reset
    const url = Linking.useURL();

    useEffect(() => {
        if (url) {
            console.log('Deep link received (useURL):', url);
            // Alert.alert('Deep Link Received', url); // Commented out for production

            if (url.includes('access_token')) {
                try {
                    // Extract tokens from hash
                    const hashIndex = url.indexOf('#');
                    if (hashIndex !== -1) {
                        const hash = url.substring(hashIndex + 1);
                        const params = {};
                        hash.split('&').forEach(pair => {
                            const [key, value] = pair.split('=');
                            params[key] = value;
                        });

                        if (params.access_token && params.refresh_token) {
                            // Check the type parameter to distinguish between password reset and email confirmation
                            // type=recovery: password reset flow
                            // type=signup: email confirmation flow
                            const isPasswordReset = params.type === 'recovery';

                            console.log('Deep link type:', params.type, '- Is password reset:', isPasswordReset);

                            // Only set password reset pending for actual password recovery
                            if (isPasswordReset) {
                                console.log('Setting session from password reset deep link...');
                                setPasswordResetPending(true);
                            } else {
                                console.log('Setting session from email confirmation deep link...');
                                setPasswordResetPending(false); // Explicitly clear it for email confirmations
                            }

                            supabase.auth.setSession({
                                access_token: params.access_token,
                                refresh_token: params.refresh_token,
                            }).then(({ error }) => {
                                if (error) throw error;
                                console.log('Session set successfully from deep link');
                                // Alert.alert('Success', isPasswordReset ? 'Please update your password.' : 'Email confirmed! You are now logged in.');
                            }).catch(error => {
                                console.error('Error setting session:', error);
                                if (isPasswordReset) {
                                    setPasswordResetPending(false); // Reset on error
                                }
                                Alert.alert('Error', 'Failed to restore session: ' + error.message);
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error handling deep link:', error);
                }
            }
        }
    }, [url]);

    // ...

    const value = {
        user,
        profile,
        session,
        loading,
        passwordResetPending,
        clearPasswordResetPending: () => setPasswordResetPending(false),
        signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
        signUp: (email, password, data) => supabase.auth.signUp({ email, password, options: { data } }),
        signOut: () => supabase.auth.signOut(),
        // ...
        resetPassword: (email) => {
            const redirectUrl = Linking.createURL('reset-password');
            console.log('Password Reset Redirect URL:', redirectUrl);
            return supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
