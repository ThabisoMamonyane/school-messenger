'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { useSchool } from '@/context/SchoolContext';

const Icons = {
    Plus: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>,
    School: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    Trash: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Upload: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
};

export default function MySchoolsPage() {
    const { refreshSchools } = useSchool();
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAppAdmin, setIsAppAdmin] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form state
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [province, setProvince] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [description, setDescription] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Detail modal state
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (!user) return;

        // 1. Check if user is App Admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_app_admin')
            .eq('id', user.id)
            .single();

        const adminStatus = profile?.is_app_admin || false;
        setIsAppAdmin(adminStatus);

        if (adminStatus) {
            // 2. Fetch ALL schools for App Admin with Owner profiles
            const { data, error } = await supabase
                .from('schools')
                .select(`
                    *,
                    owner:profiles!owner_id (
                        full_name,
                        email
                    )
                `)
                .order('name', { ascending: true });

            if (error) console.error('Error fetching all schools:', error);
            else {
                // Map to a consistent format
                const formatted = (data || []).map(s => ({
                    id: s.id,
                    role: 'App Admin',
                    schools: s,
                    owner: s.owner // Extract owner profile
                }));
                setSchools(formatted);
            }
        } else {
            // 3. Fetch membered schools for normal users
            const { data: memberData, error: memberError } = await supabase
                .from('school_members')
                .select(`
                    id,
                    role,
                    schools (
                        *,
                        owner:profiles!owner_id (
                            full_name,
                            email
                        )
                    )
                `)
                .eq('user_id', user.id);

            // 4. Also fetch schools the user OWNS (including pending ones)
            const { data: ownedData, error: ownedError } = await supabase
                .from('schools')
                .select(`
                    *,
                    owner:profiles!owner_id (
                        full_name,
                        email
                    )
                `)
                .eq('owner_id', user.id);

            if (memberError) console.error('Error fetching member schools:', memberError);
            if (ownedError) console.error('Error fetching owned schools:', ownedError);

            // Format member schools
            const memberSchools = (memberData || []).map(m => {
                const schoolData = Array.isArray(m.schools) ? m.schools[0] : m.schools;
                return {
                    ...m,
                    schools: schoolData,
                    owner: schoolData?.owner
                };
            });

            // Format owned schools (ones user created but might not have membership for)
            const ownedSchools = (ownedData || []).map(s => ({
                id: `owned-${s.id}`,
                role: 'owner',
                schools: s,
                owner: s.owner
            }));

            // Merge and deduplicate (prefer member entry if exists)
            const memberSchoolIds = new Set(memberSchools.map(m => m.schools?.id));
            const uniqueOwnedSchools = ownedSchools.filter(o => !memberSchoolIds.has(o.schools?.id));

            setSchools([...memberSchools, ...uniqueOwnedSchools]);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name || !address || !province || !email) return;
        setSubmitting(true);

        try {
            let avatarUrl = selectedSchool?.avatar_url || null;

            // 1. Upload Logo if a new one is selected
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('school-avatars')
                    .upload(fileName, logoFile);

                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('school-avatars').getPublicUrl(fileName);
                avatarUrl = publicUrl;
            }

            if (isEditing && editingId) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('schools')
                    .update({
                        name,
                        address,
                        province,
                        contact_info: { email, phone, website, description },
                        avatar_url: avatarUrl
                    })
                    .eq('id', editingId);

                if (updateError) throw updateError;
            } else {
                // CREATE
                const { data: school, error: schoolError } = await supabase
                    .from('schools')
                    .insert([{
                        name,
                        address,
                        province,
                        contact_info: { email, phone, website, description },
                        owner_id: user.id,
                        status: 'pending',
                        avatar_url: avatarUrl
                    }])
                    .select()
                    .single();

                if (schoolError) throw schoolError;

                // Add user as admin in school_members
                await supabase.from('school_members').insert([{
                    school_id: school.id,
                    user_id: user.id,
                    role: 'admin'
                }]);

                await refreshSchools();
            }

            setModalOpen(false);
            setIsEditing(false);
            setEditingId(null);
            resetForm();
            fetchData();

            // Show success confirmation for new registrations
            if (!isEditing) {
                setShowSuccess(true);
            }
        } catch (err: any) {
            alert('Error saving school: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (schoolId: string, schoolName: string) => {
        if (!confirm(`Are you sure you want to delete ${schoolName}? This action is permanent.`)) return;

        try {
            const { error } = await supabase.from('schools').delete().eq('id', schoolId);
            if (error) throw error;
            fetchData();
        } catch (err: any) {
            alert('Error deleting school: ' + err.message);
        }
    };

    const handleLeaveSchool = async (membershipId: string, schoolName: string) => {
        if (!confirm(`Are you sure you want to leave ${schoolName}?`)) return;

        try {
            const { error } = await supabase.from('school_members').delete().eq('id', membershipId);
            if (error) throw error;
            await refreshSchools();
            fetchData();
            setSelectedSchool(null);
        } catch (err: any) {
            alert('Error leaving school: ' + err.message);
        }
    };

    const resetForm = () => {
        setName(''); setAddress(''); setProvince(''); setEmail(''); setPhone(''); setWebsite(''); setDescription(''); setLogoFile(null);
    };

    const handleEditClick = (school: any) => {
        setIsEditing(true);
        setEditingId(school.id);
        setName(school.name || '');
        setAddress(school.address || '');
        setProvince(school.province || '');
        setEmail(school.contact_info?.email || '');
        setPhone(school.contact_info?.phone || '');
        setWebsite(school.contact_info?.website || '');
        setDescription(school.contact_info?.description || '');
        setLogoFile(null);
        setModalOpen(true);
        setSelectedSchool(null); // Close the detail modal
    };

    const toggleSchoolStatus = async (schoolId: string, currentStatus: string) => {
        if (!isAppAdmin) return;
        setUpdatingStatus(true);
        const newStatus = currentStatus === 'disabled' ? 'approved' : 'disabled';

        try {
            const { error } = await supabase
                .from('schools')
                .update({ status: newStatus })
                .eq('id', schoolId);

            if (error) throw error;

            // Update local state
            setSchools(prev => prev.map(item => {
                if (item.schools.id === schoolId) {
                    return { ...item, schools: { ...item.schools, status: newStatus } };
                }
                return item;
            }));

            if (selectedSchool && selectedSchool.id === schoolId) {
                setSelectedSchool({ ...selectedSchool, status: newStatus });
            }
        } catch (err: any) {
            alert('Error updating school status: ' + err.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Schools</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {!isAppAdmin && (
                        <button className={styles.addButton} style={{ background: 'white', color: '#4a90d9', border: '1.5px solid #4a90d9', boxShadow: 'none' }} onClick={() => window.location.href = '/dashboard/find-schools'}>
                            <Icons.Plus /> Find School to Join
                        </button>
                    )}
                    <button className={styles.addButton} onClick={() => { setIsEditing(false); resetForm(); setModalOpen(true); }}>
                        <Icons.Plus /> Register New School
                    </button>
                </div>
            </div>

            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder={isAppAdmin ? "Search platform's schools database..." : "Search your schools..."}
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading schools...</div>
            ) : schools.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 48, marginBottom: 20 }}>🏫</div>
                    <p style={{ marginTop: 16, color: '#64748b', fontSize: 18, fontWeight: 500 }}>
                        {isAppAdmin ? "The school database is empty." : "You haven't joined any schools yet."}
                    </p>
                    {!isAppAdmin && (
                        <button
                            className={styles.addButton}
                            style={{ marginTop: 24, padding: '12px 32px', margin: '0 auto' }}
                            onClick={() => window.location.href = '/dashboard/find-schools'}
                        >
                            Find a School to Join
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.grid}>
                    {schools.filter(item =>
                        item.schools.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.schools.address.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((item) => (
                        <div
                            key={item.id}
                            className={`${styles.schoolCard} ${item.schools.status === 'disabled' ? styles.disabled : ''}`}
                            onClick={() => setSelectedSchool({ ...item.schools, owner: item.owner, membershipId: item.id, userRole: item.role })}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.avatar}>
                                    {item.schools.avatar_url ? (
                                        <img src={item.schools.avatar_url} alt={item.schools.name} />
                                    ) : (
                                        item.schools.name[0]
                                    )}
                                </div>
                                <div className={styles.info}>
                                    <h3 className={styles.name}>{item.schools.name}</h3>
                                    <p className={styles.address}>{item.schools.address}, {item.schools.province}</p>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                                        <span className={styles.tag}>{item.role}</span>
                                        {item.schools.status === 'pending' && (
                                            <span className={styles.pendingBadge}>Pending Approval</span>
                                        )}
                                        {item.schools.status === 'approved' && (
                                            <span className={styles.approvedBadge}>Approved</span>
                                        )}
                                        {item.schools.status === 'disabled' && (
                                            <span className={styles.disabledBadge}>Disabled</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                {item.schools.owner_id === user?.id && !isAppAdmin && (
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.schools.id, item.schools.name);
                                        }}
                                        title="Delete School"
                                    >
                                        <Icons.Trash />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Register Modal */}
            {modalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
                    <div className={styles.modal}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                            {isEditing ? 'Edit School Profile' : 'Register Your School'}
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: 24 }}>
                            {isEditing ? 'Update the details for your institution.' : 'Enter the details of your institution to get started.'}
                        </p>

                        <form onSubmit={handleSave}>
                            <div className={styles.formGrid}>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>School Name*</label>
                                    <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. St. James Academy" required />
                                </div>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>Address*</label>
                                    <input className={styles.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="Full street address" required />
                                </div>
                                <div>
                                    <label className={styles.label}>Province/State*</label>
                                    <input className={styles.input} value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. CA" required />
                                </div>
                                <div>
                                    <label className={styles.label}>Admin Email*</label>
                                    <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@school.com" required />
                                </div>
                                <div>
                                    <label className={styles.label}>Phone Number</label>
                                    <input className={styles.input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +27 11 123 4567" />
                                </div>
                                <div>
                                    <label className={styles.label}>Website</label>
                                    <input className={styles.input} type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://www.yourschool.com" />
                                </div>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>School Logo</label>
                                    <div className={styles.uploadArea} onClick={() => document.getElementById('logoInput')?.click()}>
                                        <input id="logoInput" type="file" hidden accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                                        <div className={styles.uploadIcon}><Icons.Upload /></div>
                                        <p className={styles.uploadText}>{logoFile ? logoFile.name : 'Click to select an image'}</p>
                                    </div>
                                </div>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>Description</label>
                                    <textarea className={styles.input} style={{ height: 80 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief about the school..." />
                                </div>
                            </div>

                            <div className={styles.btnGroup}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                                    {submitting ? 'Saving...' : (isEditing ? 'Update Profile' : 'Register School')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Confirmation Modal */}
            {showSuccess && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowSuccess(false)}>
                    <div className={styles.modal} style={{ textAlign: 'center', maxWidth: 450 }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: '#dcfce7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            fontSize: 40
                        }}>
                            ✓
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#166534' }}>
                            Registration Submitted!
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
                            Your school registration request has been submitted successfully.
                            An App Administrator will review your application and you will be notified once approved.
                        </p>
                        <button
                            className={styles.saveBtn}
                            onClick={() => setShowSuccess(false)}
                            style={{ width: '100%' }}
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedSchool && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setSelectedSchool(null)}>
                    <div className={styles.modal}>
                        <div className={styles.detailHeader}>
                            <div className={styles.detailAvatar}>
                                {selectedSchool.avatar_url ? (
                                    <img src={selectedSchool.avatar_url} alt={selectedSchool.name} />
                                ) : (
                                    selectedSchool.name[0]
                                )}
                            </div>
                            <div className={styles.detailTitle}>
                                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{selectedSchool.name}</h2>
                                <p style={{ color: '#64748b' }}>{selectedSchool.address}</p>
                            </div>
                        </div>

                        <div className={styles.detailGrid}>
                            <div className={styles.detailItem}>
                                <label className={styles.label}>Province</label>
                                <p className={styles.detailValue}>{selectedSchool.province}</p>
                            </div>
                            <div className={styles.detailItem}>
                                <label className={styles.label}>Status</label>
                                <span className={selectedSchool.status === 'disabled' ? styles.disabledBadgeLarge : styles.activeBadgeLarge}>
                                    {selectedSchool.status || 'Active'}
                                </span>
                            </div>
                            <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                                <label className={styles.label}>Description</label>
                                <p className={styles.detailValue}>{selectedSchool.contact_info?.description || 'No description available.'}</p>
                            </div>
                        </div>

                        {selectedSchool.owner && (
                            <div className={styles.ownerSection}>
                                <h4 className={styles.ownerTitle}>School Creator / Owner</h4>
                                <div className={styles.ownerInfo}>
                                    <div className={styles.ownerBadge}>
                                        {selectedSchool.owner.full_name?.[0] || '?'}
                                    </div>
                                    <div>
                                        <p className={styles.ownerName}>{selectedSchool.owner.full_name || 'Unknown'}</p>
                                        <p className={styles.ownerEmail}>{selectedSchool.owner.email || 'No email provided'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles.btnGroup}>
                            <button className={styles.cancelBtn} onClick={() => setSelectedSchool(null)}>Close</button>

                            {!isAppAdmin && (selectedSchool.userRole === 'admin' || selectedSchool.owner_id === user?.id) && (
                                <button
                                    className={styles.saveBtn}
                                    onClick={() => handleEditClick(selectedSchool)}
                                >
                                    Edit Profile
                                </button>
                            )}

                            {isAppAdmin && (
                                <button
                                    className={selectedSchool.status === 'disabled' ? styles.saveBtn : styles.dangerBtn}
                                    onClick={() => toggleSchoolStatus(selectedSchool.id, selectedSchool.status)}
                                    disabled={updatingStatus}
                                >
                                    {updatingStatus ? 'Updating...' : (selectedSchool.status === 'disabled' ? 'Enable School' : 'Disable School')}
                                </button>
                            )}

                            {!isAppAdmin && selectedSchool.owner_id === user?.id && (
                                <button
                                    className={styles.dangerBtn}
                                    onClick={() => {
                                        handleDelete(selectedSchool.id, selectedSchool.name);
                                        setSelectedSchool(null);
                                    }}
                                >
                                    Delete School
                                </button>
                            )}

                            {!isAppAdmin && selectedSchool.owner_id !== user?.id && (
                                <button
                                    className={styles.dangerBtn}
                                    onClick={() => handleLeaveSchool(selectedSchool.membershipId, selectedSchool.name)}
                                >
                                    Leave School
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
