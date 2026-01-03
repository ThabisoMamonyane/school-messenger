'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const Icons = {
    Schools: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Users: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Tickets: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" /></svg>,
    Check: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>,
    X: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>,
    Alert: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    Search: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
    ChevronDown: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ schools: 0, pending: 0, users: 0 });
    const [pendingSchools, setPendingSchools] = useState<any[]>([]);
    const [approvedSchools, setApprovedSchools] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stats
            const { count: sCount } = await supabase.from('schools').select('*', { count: 'exact', head: true });
            const { count: pCount } = await supabase.from('schools').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            setStats({
                schools: sCount || 0,
                pending: pCount || 0,
                users: uCount || 0
            });

            // 2. Fetch Pending Schools
            const { data: pData } = await supabase
                .from('schools')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            setPendingSchools(pData || []);

            // 3. Fetch Approved Schools
            const { data: aData } = await supabase
                .from('schools')
                .select('*')
                .eq('status', 'approved')
                .order('name', { ascending: true });

            setApprovedSchools(aData || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: 'approved' | 'rejected') => {
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('schools')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            setPendingSchools(prev => prev.filter(s => s.id !== id));
            setStats(prev => ({
                ...prev,
                pending: prev.pending - 1,
                schools: status === 'approved' ? prev.schools : prev.schools // count doesn't change on approve as it was already in 'schools' table
            }));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessingId(null);
            setSelectedSchool(null); // Close modal after action
        }
    };

    if (loading) return <div className={styles.loading}>Loading Platform Dashboard...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Platform Management</h1>
                <p className={styles.subtitle}>System-level oversight and approvals</p>
            </div>

            {/* Stats Overview */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.blue}`}>
                        <Icons.Schools />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Schools</span>
                        <h2 className={styles.statValue}>{stats.schools}</h2>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.orange}`}>
                        <Icons.Alert />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Pending Approval</span>
                        <h2 className={styles.statValue}>{stats.pending}</h2>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.iconBox} ${styles.green}`}>
                        <Icons.Users />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Users</span>
                        <h2 className={styles.statValue}>{stats.users}</h2>
                    </div>
                </div>
            </div>

            {/* Approved Schools Search */}
            <div className={styles.searchSection}>
                <div className={styles.searchContainer}>
                    <div className={styles.searchInputWrapper}>
                        <div className={styles.searchIcon}><Icons.Search /></div>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search approved schools..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                        />
                        {searchQuery && (
                            <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>
                                <Icons.X />
                            </button>
                        )}
                    </div>

                    {showResults && searchQuery && (
                        <div className={styles.searchResults}>
                            {approvedSchools.filter(s =>
                                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                s.address.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length > 0 ? (
                                approvedSchools.filter(s =>
                                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    s.address.toLowerCase().includes(searchQuery.toLowerCase())
                                ).map(school => (
                                    <div key={school.id} className={styles.searchResultItem}>
                                        <div className={styles.schoolAvatarSmall}>{school.name[0]}</div>
                                        <div className={styles.searchResultInfo}>
                                            <div className={styles.searchResultName}>{school.name}</div>
                                            <div className={styles.searchResultAddress}>{school.address}, {school.province}</div>
                                        </div>
                                        <span className={styles.approvedBadge}>Approved</span>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.noResults}>No schools matching "{searchQuery}"</div>
                            )}
                        </div>
                    )}
                </div>
                {showResults && searchQuery && (
                    <div className={styles.searchBackdrop} onClick={() => setShowResults(false)} />
                )}
            </div>

            {/* Pending Requests Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Pending School Registrations</h2>
                    <span className={styles.badge}>{pendingSchools.length} requests</span>
                </div>

                {pendingSchools.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Icons.Check />
                        <p>All school registration requests have been processed.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>School Name</th>
                                    <th>Location</th>
                                    <th>Date Requested</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingSchools.map(school => (
                                    <tr key={school.id} onClick={() => setSelectedSchool(school)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div className={styles.schoolCell}>
                                                <div className={styles.schoolAvatar}>
                                                    {school.name[0]}
                                                </div>
                                                <span className={styles.schoolName}>{school.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.locationCell}>
                                                {school.address}, {school.province}
                                            </div>
                                        </td>
                                        <td>{new Date(school.created_at).toLocaleDateString()}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.rejectBtn}
                                                    onClick={(e) => { e.stopPropagation(); handleAction(school.id, 'rejected'); }}
                                                    disabled={processingId === school.id}
                                                >
                                                    <Icons.X />
                                                    Reject
                                                </button>
                                                <button
                                                    className={styles.approveBtn}
                                                    onClick={(e) => { e.stopPropagation(); handleAction(school.id, 'approved'); }}
                                                    disabled={processingId === school.id}
                                                >
                                                    {processingId === school.id ? '...' : <><Icons.Check /> Approve</>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* School Detail Preview Modal */}
            {selectedSchool && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setSelectedSchool(null)}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalAvatar}>
                                {selectedSchool.avatar_url ? (
                                    <img src={selectedSchool.avatar_url} alt={selectedSchool.name} />
                                ) : (
                                    selectedSchool.name[0]
                                )}
                            </div>
                            <div>
                                <h2 className={styles.modalTitle}>{selectedSchool.name}</h2>
                                <span className={styles.pendingBadge}>Pending Approval</span>
                            </div>
                        </div>

                        <div className={styles.detailGrid}>
                            <div className={styles.detailItem}>
                                <label>Address</label>
                                <p>{selectedSchool.address}</p>
                            </div>
                            <div className={styles.detailItem}>
                                <label>Province/State</label>
                                <p>{selectedSchool.province}</p>
                            </div>
                            <div className={styles.detailItem}>
                                <label>Contact Email</label>
                                <p>{selectedSchool.contact_info?.email || 'Not provided'}</p>
                            </div>
                            <div className={styles.detailItem}>
                                <label>Date Requested</label>
                                <p>{new Date(selectedSchool.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            {selectedSchool.contact_info?.description && (
                                <div className={styles.detailItemFull}>
                                    <label>Description</label>
                                    <p>{selectedSchool.contact_info.description}</p>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setSelectedSchool(null)}>
                                Close
                            </button>
                            <button
                                className={styles.rejectBtnLarge}
                                onClick={() => handleAction(selectedSchool.id, 'rejected')}
                                disabled={processingId === selectedSchool.id}
                            >
                                <Icons.X /> Reject Request
                            </button>
                            <button
                                className={styles.approveBtnLarge}
                                onClick={() => handleAction(selectedSchool.id, 'approved')}
                                disabled={processingId === selectedSchool.id}
                            >
                                {processingId === selectedSchool.id ? 'Processing...' : <><Icons.Check /> Approve School</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
