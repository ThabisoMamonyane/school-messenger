'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { useSchool } from '@/context/SchoolContext';

const Icons = {
    Plus: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>,
    Trash: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Users: () => <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" opacity="0.3"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
};

export default function StaffPage() {
    const { selectedSchool, loading: schoolLoading } = useSchool();
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Auth context
    const [user, setUser] = useState<any>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('teacher');
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const roles = [
        { value: 'teacher', label: 'Teacher', class: styles.roleTeacher },
        { value: 'admin', label: 'Admin', class: styles.roleAdmin },
        { value: 'communications_officer', label: 'Comm. Officer', class: styles.roleComm },
        { value: 'support_staff', label: 'Support Staff', class: styles.roleStaff }
    ];

    useEffect(() => {
        init();
    }, [selectedSchool]);

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (!user) return;

        if (selectedSchool) {
            fetchStaff(selectedSchool.id);
        } else {
            setLoading(false);
        }
    };

    const fetchStaff = async (sid: string) => {
        setLoading(true);
        try {
            // Fetch all non-parent members
            const { data, error } = await supabase
                .from('school_members')
                .select('id, role, user_id, profiles ( id, full_name, email, avatar_url )')
                .eq('school_id', sid)
                .neq('role', 'parent');

            if (error) throw error;
            setStaff(data || []);
        } catch (e) {
            console.error('Error fetching staff:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !selectedSchool) return;
        setSubmitting(true);

        try {
            // 1. Find user by email
            const { data: profile, error: searchError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('email', email.toLowerCase().trim())
                .single();

            if (searchError || !profile) {
                alert('User not found. They must have an account first.');
                return;
            }

            // 2. Add as school member
            const { error: insertError } = await supabase
                .from('school_members')
                .insert([{
                    school_id: selectedSchool.id,
                    user_id: profile.id,
                    role: selectedRole
                }]);

            if (insertError) {
                if (insertError.code === '23505') alert('This user is already a member of this school.');
                else throw insertError;
            } else {
                setModalOpen(false);
                setEmail('');
                fetchStaff(selectedSchool.id);
            }
        } catch (err: any) {
            alert('Error adding staff: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveStaff = async (member: any) => {
        if (member.role === 'admin') {
            alert('Cannot remove an Admin for security reasons.');
            return;
        }

        if (!confirm(`Are you sure you want to remove ${member.profiles?.full_name || 'this staff member'}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('school_members')
                .delete()
                .eq('id', member.id);

            if (error) throw error;
            setStaff(staff.filter(s => s.id !== member.id));
        } catch (e: any) {
            alert('Error removing staff: ' + e.message);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Manage Staff</h1>
                <button className={styles.addButton} onClick={() => setModalOpen(true)}>
                    <Icons.Plus /> Add Staff Member
                </button>
            </div>

            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search staff by name or email..."
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <div className="loader">Loading staff...</div>
                </div>
            ) : staff.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><Icons.Users /></div>
                    <p>No staff members found.</p>
                </div>
            ) : (
                <div className={styles.staffGrid}>
                    {staff.filter(member =>
                        (member.profiles?.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                        (member.profiles?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                    ).map((member) => {
                        const roleObj = roles.find(r => r.value === member.role);
                        return (
                            <div key={member.id} className={styles.staffCard}>
                                <div className={styles.avatar}>
                                    {member.profiles?.full_name?.[0] || 'U'}
                                </div>
                                <div className={styles.info}>
                                    <div className={styles.name}>{member.profiles?.full_name || 'Unknown User'}</div>
                                    <div className={styles.email}>{member.profiles?.email}</div>
                                    <span className={`${styles.roleBadge} ${roleObj?.class || ''}`}>
                                        {roleObj?.label || member.role}
                                    </span>
                                </div>
                                {member.role !== 'admin' && (
                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => handleRemoveStaff(member)}
                                        title="Remove Staff"
                                    >
                                        <Icons.Trash />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Staff Modal */}
            {modalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>Add Staff Member</h2>
                        <p className={styles.modalSubtitle}>Invite a user by email to join your school staff.</p>

                        <form onSubmit={handleAddStaff}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email Address</label>
                                <input
                                    className={styles.input}
                                    type="email"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Select Role</label>
                                <div className={styles.roleGrid}>
                                    {roles.map((r) => (
                                        <div
                                            key={r.value}
                                            className={`${styles.roleOption} ${selectedRole === r.value ? styles.roleOptionActive : ''}`}
                                            onClick={() => setSelectedRole(r.value)}
                                        >
                                            {r.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                                    {submitting ? 'Adding...' : 'Add Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
