'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { useSchool } from '@/context/SchoolContext';

const Icons = {
    School: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    Check: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>,
    Search: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
};

export default function FindSchoolsPage() {
    const { refreshSchools } = useSchool();
    const [schools, setSchools] = useState<any[]>([]);
    const [mySchoolIds, setMySchoolIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [user, setUser] = useState<any>(null);
    const [joiningId, setJoiningId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (!user) return;

            // 1. Fetch all approved schools
            const { data: schoolData, error: schoolError } = await supabase
                .from('schools')
                .select('*')
                .eq('status', 'approved')
                .order('name');

            if (schoolError) throw schoolError;
            setSchools(schoolData || []);

            // 2. Fetch my joined schools
            const { data: memberData, error: memberError } = await supabase
                .from('school_members')
                .select('school_id')
                .eq('user_id', user.id);

            if (memberError) throw memberError;
            setMySchoolIds(memberData?.map(m => m.school_id) || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (schoolId: string, schoolName: string) => {
        if (!user) return;
        setJoiningId(schoolId);
        try {
            const { error } = await supabase
                .from('school_members')
                .insert([
                    {
                        user_id: user.id,
                        school_id: schoolId,
                        role: 'parent'
                    }
                ]);

            if (error) {
                if (error.code === '23505') {
                    alert('You are already a member of this school.');
                } else {
                    throw error;
                }
            } else {
                setMySchoolIds(prev => [...prev, schoolId]);
                // Refresh the global school context to update the sidebar
                await refreshSchools();
            }
        } catch (error: any) {
            alert(error.message || 'Error joining school');
        } finally {
            setJoiningId(null);
        }
    };

    const filteredSchools = schools.filter(school =>
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.province?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className={styles.loading}>Loading schools...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Find Schools</h1>
                <p className={styles.subtitle}>Discover and join your school community to stay updated</p>
            </div>

            <div className={styles.searchBar}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by school name, address, or province..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredSchools.length === 0 ? (
                <div className={styles.empty}>
                    <p>No schools found matching your search.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredSchools.map(school => {
                        const isJoined = mySchoolIds.includes(school.id);
                        const isJoining = joiningId === school.id;

                        return (
                            <div key={school.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.schoolAvatar}>
                                        {school.avatar_url ? (
                                            <img src={school.avatar_url} alt={school.name} className={styles.schoolAvatar} />
                                        ) : (
                                            school.name[0]
                                        )}
                                    </div>
                                    <div className={styles.schoolInfo}>
                                        <h3 className={styles.schoolName}>{school.name}</h3>
                                        <div className={styles.schoolLocation}>
                                            <span>{school.address}</span>
                                            <span>{school.province}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className={styles.description}>
                                    {school.contact_info?.description || "A safe and vibrant learning community focused on student excellence and growth."}
                                </p>

                                <div className={styles.footer}>
                                    {isJoined ? (
                                        <div className={styles.joinedBtn}>
                                            <Icons.Check />
                                            Joined
                                        </div>
                                    ) : (
                                        <button
                                            className={styles.joinBtn}
                                            onClick={() => handleJoin(school.id, school.name)}
                                            disabled={isJoining}
                                        >
                                            {isJoining ? 'Joining...' : 'Join School'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
