'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { useSchool } from '@/context/SchoolContext';
import { logger } from '@/lib/logger';

// Simple Icons
const Icons = {
    Paperclip: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>,
    Plus: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>,
    X: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>,
    Upload: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
    File: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Trash: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Mail: () => <svg width="48" height="48" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
};

const CATEGORIES = ['General', 'News', 'Academic', 'Sport', 'Letters', 'Homework'];

export default function AnnouncementsPage() {
    const { selectedSchool, selectedRole, loading: schoolLoading } = useSchool();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);

    // View State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [file, setFile] = useState<File | null>(null);
    const [sendPush, setSendPush] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, [selectedSchool]);

    const fetchData = async () => {
        logger.info('Announcements', 'fetchData started');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user && selectedSchool) {
                // Fetch Announcements
                const { data: anns } = await supabase
                    .from('announcements')
                    .select('*, author:author_id(full_name)')
                    .eq('school_id', selectedSchool.id)
                    .order('created_at', { ascending: false });

                setAnnouncements(anns || []);
                logger.info('Announcements', `${anns?.length || 0} announcements loaded for school: ${selectedSchool.id}`);
                if (anns && anns.length > 0) {
                    setSelectedId(anns[0].id);
                } else {
                    setSelectedId(null);
                }
            }
        } catch (error) {
            logger.error('Announcements', 'Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived State: Filtered List
    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(a => {
            const matchesCategory = filterCategory === 'All' || a.category === filterCategory;
            const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [announcements, filterCategory, searchQuery]);

    // Derived State: Selected Item
    const selectedAnnouncement = useMemo(() => {
        return announcements.find(a => a.id === selectedId);
    }, [announcements, selectedId]);

    // Valid Categories (for top bar)
    const availableCategories = useMemo(() => {
        const counts: Record<string, number> = { 'All': announcements.length };
        announcements.forEach(a => {
            counts[a.category] = (counts[a.category] || 0) + 1;
        });
        return ['All', ...CATEGORIES].map(c => ({
            name: c,
            count: counts[c] || 0
        })).filter(c => c.name === 'All' || c.count > 0);
    }, [announcements]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !selectedSchool || !user) return;

        logger.info('Announcements', 'Creating new announcement', { title, category, hasFile: !!file, sendPush });
        setSubmitting(true);
        try {
            let attachmentUrl = null;
            let attachmentName = null;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${selectedSchool.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('announcement-attachments')
                    .upload(filePath, file);

                if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

                const { data: urlData } = supabase.storage
                    .from('announcement-attachments')
                    .getPublicUrl(filePath);

                attachmentUrl = urlData.publicUrl;
                attachmentName = file.name;
            }

            const { data: announcement, error } = await supabase
                .from('announcements')
                .insert({
                    school_id: selectedSchool.id,
                    title,
                    content,
                    category,
                    author_id: user.id,
                    attachment_url: attachmentUrl,
                    attachment_name: attachmentName,
                    sent_via_push: sendPush
                })
                .select('*, author:author_id(full_name)')
                .single();

            if (error) throw error;

            logger.info('Announcements', 'Announcement inserted successfully', { id: announcement.id });

            if (sendPush) {
                await sendPushNotification(announcement);
            }

            const newList = [announcement, ...announcements];
            setAnnouncements(newList);
            setSelectedId(announcement.id); // Select the new one
            closeModal();
        } catch (error: any) {
            logger.error('Announcements', 'Error creating announcement', error);
            alert(error.message || 'Error creating announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const sendPushNotification = async (announcement: any) => {
        const { data: members } = await supabase
            .from('school_members')
            .select('user_id')
            .eq('school_id', selectedSchool?.id);

        if (!members || members.length === 0) return;

        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('expo_push_token')
            .in('id', userIds)
            .not('expo_push_token', 'is', null);

        if (!profiles || profiles.length === 0) return;

        const tokens = profiles.map(p => p.expo_push_token).filter(t => t);
        const messages = tokens.map(token => ({
            to: token,
            sound: 'default',
            title: announcement.title,
            body: announcement.content.substring(0, 100) + '...',
            data: { announcementId: announcement.id },
        }));

        // Chunking for safety (Expo limits)
        const chunks = [];
        for (let i = 0; i < messages.length; i += 100) {
            chunks.push(messages.slice(i, i + 100));
        }

        for (const chunk of chunks) {
            try {
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(chunk),
                });
            } catch (pushError) {
                console.error('Error sending push chunk:', pushError);
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTitle('');
        setContent('');
        setCategory('General');
        setFile(null);
        setSendPush(false);
    };

    const triggerFileSelect = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const canCreate = ['admin', 'communications_officer', 'teacher'].includes(selectedRole);

    if (loading) return <div className={styles.loading}>Loading announcements...</div>;

    return (
        <div className={styles.container}>
            {/* 1. Header & Filters */}
            <div className={styles.headerRow}>
                <div className={styles.categoryBar}>
                    {availableCategories.map(cat => (
                        <button
                            key={cat.name}
                            className={`${styles.categoryCard} ${filterCategory === cat.name ? styles.active : ''}`}
                            onClick={() => setFilterCategory(cat.name)}
                        >
                            <span className={styles.catName}>{cat.name}</span>
                            <span className={styles.catCount}>{cat.count} items</span>
                        </button>
                    ))}
                </div>
                {canCreate && (
                    <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
                        <Icons.Plus />
                        New Announcement
                    </button>
                )}
            </div>

            {/* 2. Main Content Area (Email Layout) */}
            <div className={styles.contentArea}>

                {/* Left Column: List */}
                <div className={styles.listColumn}>
                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            placeholder="Search items..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {filteredAnnouncements.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No items found</div>
                    ) : (
                        filteredAnnouncements.map(ann => (
                            <div
                                key={ann.id}
                                className={`${styles.listItem} ${selectedId === ann.id ? styles.selected : ''}`}
                                onClick={() => setSelectedId(ann.id)}
                            >
                                <div className={styles.itemHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                                        <span className={styles.itemSubject}>{ann.title}</span>
                                        {ann.attachment_url && (
                                            <span style={{ color: '#64748b', display: 'flex' }} title="Has attachment">
                                                <Icons.Paperclip />
                                            </span>
                                        )}
                                    </div>
                                    <span className={styles.itemDate}>
                                        {new Date(ann.created_at).toLocaleString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            hour12: true
                                        })}
                                    </span>
                                </div>
                                <div className={styles.itemPreview}>
                                    {ann.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right Column: Detail */}
                <div className={styles.detailColumn}>
                    {selectedAnnouncement ? (
                        <>
                            <div className={styles.detailHeader}>
                                <div className={styles.detailMeta}>
                                    <div className={styles.metaLeft}>
                                        <div className={styles.detailAvatar}>
                                            {(() => {
                                                const name = selectedAnnouncement.author_id === user?.id
                                                    ? (user.user_metadata?.full_name || selectedAnnouncement.author?.full_name)
                                                    : selectedAnnouncement.author?.full_name;
                                                return (name || 'A')[0];
                                            })()}
                                        </div>
                                        <div>
                                            <div className={styles.metaAuthor}>
                                                {selectedAnnouncement.author_id === user?.id
                                                    ? (user.user_metadata?.full_name || selectedAnnouncement.author?.full_name || 'Me')
                                                    : (selectedAnnouncement.author?.full_name || 'School Staff')}
                                            </div>
                                            <div className={styles.metaRole}>
                                                To: <span style={{ fontWeight: 600 }}>Everyone</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.detailDate}>
                                        {new Date(selectedAnnouncement.created_at).toLocaleDateString(undefined, {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>

                                <h1 className={styles.detailTitle}>{selectedAnnouncement.title}</h1>
                                <span
                                    className={styles.detailBadge}
                                    style={{
                                        backgroundColor: getCategoryColor(selectedAnnouncement.category).bg,
                                        color: getCategoryColor(selectedAnnouncement.category).text
                                    }}
                                >
                                    {selectedAnnouncement.category}
                                </span>
                            </div>

                            <div className={styles.detailBody}>
                                {selectedAnnouncement.content}
                            </div>

                            {selectedAnnouncement.attachment_url && (
                                <div className={styles.attachmentBox}>
                                    <Icons.File />
                                    <a
                                        href={selectedAnnouncement.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.attachLink}
                                    >
                                        {selectedAnnouncement.attachment_name || 'View Attachment'}
                                    </a>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptySelection}>
                            <Icons.Mail />
                            <p>Select an announcement to read</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>New Announcement</h2>
                        <form onSubmit={handleCreate}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Title</label>
                                <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., School Sports Day" required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Category</label>
                                <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Content</label>
                                <textarea className={styles.textarea} value={content} onChange={e => setContent(e.target.value)} placeholder="Type details..." required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Attachment</label>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                                {!file ? (
                                    <div className={styles.uploadArea} onClick={triggerFileSelect}>
                                        <Icons.Upload />
                                        <span>Click to upload a file</span>
                                        <span style={{ fontSize: 12, opacity: 0.7 }}>PDF, Word, Images (Max 10MB)</span>
                                    </div>
                                ) : (
                                    <div className={styles.filePreview}>
                                        <div className={styles.fileName}><Icons.File />{file.name}</div>
                                        <button type="button" className={styles.removeFile} onClick={() => setFile(null)}><Icons.Trash /></button>
                                    </div>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <div className={styles.toggleRow}>
                                    <div className={styles.toggleLabel}><h4>Send Push Notification</h4><p>Notify all parents immediately</p></div>
                                    <label className={styles.switch}><input type="checkbox" checked={sendPush} onChange={e => setSendPush(e.target.checked)} /><span className={styles.slider}></span></label>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                                <button type="submit" className={styles.submitBtn} disabled={submitting}>{submitting ? 'Posting...' : 'Post Announcement'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function getCategoryColor(category: string) {
    switch (category?.toLowerCase()) {
        case 'sport': return { bg: '#dcfce7', text: '#166534' };
        case 'academic': return { bg: '#e0e7ff', text: '#3730a3' };
        case 'news': return { bg: '#fee2e2', text: '#991b1b' };
        case 'alert': return { bg: '#fef9c3', text: '#854d0e' };
        default: return { bg: '#f3f4f6', text: '#4b5563' };
    }
}
