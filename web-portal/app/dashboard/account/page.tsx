'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const Icons = {
    Trash: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    User: () => <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Warning: () => <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
};

export default function AccountSettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
            setLoading(false);
        };
        fetchUserData();
    }, []);

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            // 1. Call the secure database function to delete user from auth.users
            // This mirrors the mobile AuthContext.js implementation
            const { error } = await supabase.rpc('delete_own_account');

            if (error) throw error;

            // 2. Explicitly sign out to clear local session state
            await supabase.auth.signOut();

            // 3. Redirect to landing page
            window.location.href = '/';
        } catch (err: any) {
            alert('Error deleting account: ' + err.message);
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading account settings...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Account Settings</h1>
            </div>

            <div className={styles.card}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatar}>
                        {profile?.full_name ? profile.full_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : <Icons.User />)}
                    </div>
                    <div>
                        <h2 className={styles.userName}>{profile?.full_name || 'User'}</h2>
                        <p className={styles.userEmail}>{user?.email}</p>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Profile Information</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <label className={styles.label}>Full Name</label>
                            <div className={styles.value}>{profile?.full_name || 'Not set'}</div>
                        </div>
                        <div className={styles.infoItem}>
                            <label className={styles.label}>Email Address</label>
                            <div className={styles.value}>{user?.email}</div>
                        </div>
                    </div>
                </div>

                <div className={styles.dangerZone}>
                    <h3 className={styles.dangerTitle}>Danger Zone</h3>
                    <p className={styles.dangerText}>
                        Once you delete your account, there is no going back. All your data, school memberships,
                        and messages will be permanently removed from our systems.
                    </p>
                    <button className={styles.deleteBtn} onClick={() => setShowDeleteModal(true)}>
                        Delete My Account
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
                    <div className={styles.modal}>
                        <div className={styles.modalIcon}><Icons.Warning /></div>
                        <h2 className={styles.modalTitle}>Delete Account?</h2>
                        <p className={styles.modalText}>
                            Are you absolutely sure? This action is permanent and cannot be undone.
                            You will lose access to all your schools and data.
                        </p>
                        <div className={styles.modalButtons}>
                            <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                                Cancel
                            </button>
                            <button className={styles.confirmDeleteBtn} onClick={handleDeleteAccount} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Yes, Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
