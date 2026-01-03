'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { useSchool } from '@/context/SchoolContext';

const Icons = {
    Camera: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>,
    School: () => <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" opacity="0.3"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
};

export default function SchoolProfilePage() {
    const { selectedSchool, selectedRole, loading: schoolLoading, refreshSchools } = useSchool();
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<any>({
        name: '',
        address: '',
        province: '',
        contact_info: {
            email: '',
            phone: '',
            website: '',
            description: ''
        },
        avatar_url: ''
    });

    useEffect(() => {
        if (selectedSchool) {
            setFormData({
                name: selectedSchool.name || '',
                address: selectedSchool.address || '',
                province: selectedSchool.province || '',
                contact_info: {
                    email: (selectedSchool as any).contact_info?.email || '',
                    phone: (selectedSchool as any).contact_info?.phone || '',
                    website: (selectedSchool as any).contact_info?.website || '',
                    description: (selectedSchool as any).contact_info?.description || ''
                },
                avatar_url: selectedSchool.avatar_url || ''
            });
        }
        // Always set loading to false once we've checked for selectedSchool
        // This prevents infinite loading when schoolLoading is done but selectedSchool is null
        if (!schoolLoading) {
            setLoading(false);
        }
    }, [selectedSchool, schoolLoading]);



    const handleSave = async () => {
        if (!selectedSchool) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('schools')
                .update({
                    name: formData.name,
                    address: formData.address,
                    province: formData.province,
                    contact_info: formData.contact_info,
                    avatar_url: formData.avatar_url
                })
                .eq('id', selectedSchool.id);

            if (error) throw error;

            setEditing(false);
            refreshSchools(); // Refresh schools in context
            alert('School profile updated successfully!');
        } catch (err: any) {
            alert('Error updating profile: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedSchool) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedSchool.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('school-avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('school-avatars')
                .getPublicUrl(fileName);

            setFormData({ ...formData, avatar_url: publicUrl });
            alert('Logo uploaded successfully. Remember to save changes.');
        } catch (err: any) {
            alert('Error uploading logo: ' + err.message);
        }
    };

    if (loading || schoolLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading school profile...</div>;
    if (!selectedSchool) return <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>School not found.</div>;

    const canEdit = selectedRole === 'admin';

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>School Profile</h1>
                <div className={styles.actionButtons}>
                    {canEdit && (
                        editing ? (
                            <>
                                <button className={styles.cancelButton} onClick={() => {
                                    setEditing(false);
                                    setFormData({
                                        name: selectedSchool.name,
                                        address: selectedSchool.address,
                                        province: selectedSchool.province,
                                        contact_info: (selectedSchool as any).contact_info,
                                        avatar_url: selectedSchool.avatar_url
                                    });
                                }}>Cancel</button>
                                <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button className={styles.editButton} onClick={() => setEditing(true)}>Edit Profile</button>
                        )
                    )}
                </div>
            </div>

            <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatarWrapper}>
                        <div className={styles.avatar}>
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt={formData.name} />
                            ) : (
                                <Icons.School />
                            )}
                        </div>
                        {editing && (
                            <label className={styles.uploadOverlay} htmlFor="logoUpload">
                                <Icons.Camera />
                                <input type="file" id="logoUpload" hidden accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        )}
                    </div>
                    {editing ? (
                        <input
                            className={styles.schoolNameInput}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="School Name"
                        />
                    ) : (
                        <h2 className={styles.schoolName}>{selectedSchool.name}</h2>
                    )}
                </div>

                <div className={styles.infoSection}>
                    <div className={styles.infoItem}>
                        <label className={styles.label}>Address</label>
                        {editing ? (
                            <input
                                className={styles.input}
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        ) : (
                            <div className={styles.value}>{selectedSchool.address}</div>
                        )}
                    </div>
                    <div className={styles.infoItem}>
                        <label className={styles.label}>Province / State</label>
                        {editing ? (
                            <input
                                className={styles.input}
                                value={formData.province}
                                onChange={e => setFormData({ ...formData, province: e.target.value })}
                            />
                        ) : (
                            <div className={styles.value}>{selectedSchool.province}</div>
                        )}
                    </div>
                    <div className={styles.infoItem}>
                        <label className={styles.label}>Contact Email</label>
                        {editing ? (
                            <input
                                className={styles.input}
                                value={formData.contact_info.email}
                                onChange={e => setFormData({
                                    ...formData,
                                    contact_info: { ...formData.contact_info, email: e.target.value }
                                })}
                            />
                        ) : (
                            <div className={styles.value}>{(selectedSchool as any).contact_info?.email || 'Not provided'}</div>
                        )}
                    </div>
                    <div className={styles.infoItem}>
                        <label className={styles.label}>Phone Number</label>
                        {editing ? (
                            <input
                                className={styles.input}
                                value={formData.contact_info.phone}
                                onChange={e => setFormData({
                                    ...formData,
                                    contact_info: { ...formData.contact_info, phone: e.target.value }
                                })}
                            />
                        ) : (
                            <div className={styles.value}>{(selectedSchool as any).contact_info?.phone || 'Not provided'}</div>
                        )}
                    </div>
                    <div className={styles.infoItem}>
                        <label className={styles.label}>Website</label>
                        {editing ? (
                            <input
                                className={styles.input}
                                value={formData.contact_info.website}
                                onChange={e => setFormData({
                                    ...formData,
                                    contact_info: { ...formData.contact_info, website: e.target.value }
                                })}
                            />
                        ) : (
                            <div className={styles.value}>{(selectedSchool as any).contact_info?.website || 'Not provided'}</div>
                        )}
                    </div>
                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                        <label className={styles.label}>About School</label>
                        {editing ? (
                            <textarea
                                className={`${styles.input} ${styles.textArea}`}
                                value={formData.contact_info.description}
                                onChange={e => setFormData({
                                    ...formData,
                                    contact_info: { ...formData.contact_info, description: e.target.value }
                                })}
                            />
                        ) : (
                            <div className={styles.value} style={{ whiteSpace: 'pre-wrap', fontWeight: 'normal', lineHeight: '1.6' }}>
                                {(selectedSchool as any).contact_info?.description || 'No description provided.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
