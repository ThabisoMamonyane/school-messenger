'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useSchool } from '@/context/SchoolContext';
import { logger } from '@/lib/logger';

const Icons = {
    Plus: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>,
    Group: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    Chat: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
    Trash: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    UserPlus: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>,
};

export default function GroupsPage() {
    const router = useRouter();
    const { selectedSchool, selectedRole, loading: schoolLoading } = useSchool();
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);

    const [user, setUser] = useState<any>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Detail State
    const [members, setMembers] = useState<any[]>([]);
    const [memberLoading, setMemberLoading] = useState(false);

    // Forms
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [searchEmail, setSearchEmail] = useState(''); // Keep for backward compat or remove
    const [searching, setSearching] = useState(false);

    // Enhanced Selection State
    const [schoolMembers, setSchoolMembers] = useState<any[]>([]);
    const [modalSearch, setModalSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [fetchingMembers, setFetchingMembers] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, [selectedSchool]);

    useEffect(() => {
        if (selectedGroupId) {
            fetchMembers(selectedGroupId);
        }
    }, [selectedGroupId]);

    useEffect(() => {
        if (addMemberModalOpen && selectedSchool) {
            fetchSchoolMembers();
        }
    }, [addMemberModalOpen, selectedSchool]);

    const fetchGroups = async () => {
        logger.info('Groups', 'fetchGroups started');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user && selectedSchool) {
                const isAdmin = ['admin'].includes(selectedRole);
                let grpsData;

                if (isAdmin) {
                    // Admins see all groups in the school
                    const { data, error } = await supabase
                        .from('groups')
                        .select('*')
                        .eq('school_id', selectedSchool.id)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    grpsData = data;
                } else {
                    // others only see joined groups
                    const { data: memberGroups, error: mgError } = await supabase
                        .from('group_members')
                        .select('group_id')
                        .eq('user_id', user.id);

                    if (mgError) throw mgError;

                    const groupIds = memberGroups?.map(m => m.group_id) || [];

                    if (groupIds.length > 0) {
                        const { data, error } = await supabase
                            .from('groups')
                            .select('*')
                            .in('id', groupIds)
                            .eq('school_id', selectedSchool.id)
                            .order('created_at', { ascending: false });

                        if (error) throw error;
                        grpsData = data;
                    } else {
                        grpsData = [];
                    }
                }

                setGroups(grpsData || []);
                logger.info('Groups', `${grpsData?.length || 0} groups loaded for school: ${selectedSchool.id}`);
                if (grpsData && grpsData.length > 0 && !selectedGroupId) {
                    setSelectedGroupId(grpsData[0].id);
                } else if (!grpsData || grpsData.length === 0) {
                    setSelectedGroupId(null);
                }
            }
        } catch (e) {
            logger.error('Groups', 'Fetch Groups Exception', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async (groupId: string) => {
        setMemberLoading(true);
        try {
            // 1. Fetch Members (Raw) - Removed 'id' column
            const { data: memberData, error: memberError } = await supabase
                .from('group_members')
                .select('role, user_id, joined_at')
                .eq('group_id', groupId);

            if (memberError) {
                logger.error('Groups', `Member fetch error for group: ${groupId}`, memberError);
                setMembers([]);
                return;
            }

            if (!memberData || memberData.length === 0) {
                setMembers([]);
                return;
            }

            // 2. Fetch Profiles manually
            const userIds = memberData.map(m => m.user_id);
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url')
                .in('id', userIds);

            if (profileError) console.error('Profile fetch error:', profileError);

            // 3. Merge
            const profileMap = new Map((profiles || []).map(p => [p.id, p]));

            const merged = memberData.map(m => ({
                ...m,
                profile: profileMap.get(m.user_id) || null
            }));

            // 4. Sort
            const sorted = merged.sort((a, b) => {
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                const nameA = a.profile?.full_name || '';
                const nameB = b.profile?.full_name || '';
                return nameA.localeCompare(nameB);
            });

            setMembers(sorted);

        } catch (err) {
            console.error('Member fetch exception:', err);
        } finally {
            setMemberLoading(false);
        }
    };

    const fetchSchoolMembers = async () => {
        if (!selectedSchool) return;
        setFetchingMembers(true);
        try {
            // 1. Fetch memberships
            const { data: members, error: memberError } = await supabase
                .from('school_members')
                .select('user_id, role')
                .eq('school_id', selectedSchool.id);

            if (memberError) throw memberError;
            if (!members) return;

            // 2. Fetch profiles
            const uids = members.map(m => m.user_id);
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url')
                .in('id', uids);

            if (profileError) throw profileError;

            // 3. Merge
            const profileMap = new Map((profiles || []).map(p => [p.id, p]));
            const merged = members.map(m => ({
                ...m,
                profile: profileMap.get(m.user_id) || null
            }));

            setSchoolMembers(merged.sort((a, b) => (a.profile?.full_name || '').localeCompare(b.profile?.full_name || '')));
        } catch (err) {
            console.error('Error fetching school members:', err);
        } finally {
            setFetchingMembers(false);
        }
    };

    const handleAddSelectedMember = async (targetUser: any) => {
        if (!selectedGroupId) return;
        logger.info('Groups', 'Adding member to group', { groupId: selectedGroupId, userId: targetUser.user_id });
        setSearching(true);
        try {
            const { error: insertError } = await supabase
                .from('group_members')
                .insert({
                    group_id: selectedGroupId,
                    user_id: targetUser.user_id,
                    role: 'member'
                });

            if (insertError) {
                if (insertError.code === '23505') alert(`${targetUser.profile?.full_name} is already in this group.`);
                else throw insertError;
            } else {
                fetchMembers(selectedGroupId);
                // We keep modal open if they want to add more? 
                // Decision: Close it for clarity, or update list. 
                // User said "show profiles ... connected to school", implies a list.
                // Let's just update the list state to show they are joined.
            }
        } catch (err: any) {
            logger.error('Groups', 'Error adding member', err);
            alert('Error adding member: ' + err.message);
        } finally {
            setSearching(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !selectedSchool) return;
        logger.info('Groups', 'Creating new group', { name, schoolId: selectedSchool.id });
        setSubmitting(true);

        try {
            const { data: group, error } = await supabase
                .from('groups')
                .insert({
                    school_id: selectedSchool.id,
                    name,
                    description: desc,
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            await supabase.from('group_members').insert({
                group_id: group.id,
                user_id: user.id,
                role: 'admin'
            });

            setGroups([group, ...groups]);
            setSelectedGroupId(group.id);
            setCreateModalOpen(false);
            setName(''); setDesc('');
        } catch (err: any) {
            alert('Error creating group: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveMember = async (userIdToRemove: string) => {
        if (!confirm('Remove this member?')) return;
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', selectedGroupId)
            .eq('user_id', userIdToRemove);

        if (!error) {
            logger.info('Groups', 'Member removed', { groupId: selectedGroupId, userId: userIdToRemove });
            setMembers(members.filter(m => m.user_id !== userIdToRemove));
        } else {
            logger.error('Groups', 'Failed to remove member', error);
            alert('Failed to remove member: ' + error.message);
        }
    };

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const isSchoolAdmin = ['admin', 'communications_officer', 'teacher'].includes(selectedRole);

    // Check if current user is group admin
    const isGroupAdmin = useMemo(() => {
        if (!user || !selectedGroup) return false;
        if (selectedGroup.created_by === user.id) return true;
        return members.some(m => m.user_id === user.id && m.role === 'admin');
    }, [user, selectedGroup, members]);

    const filteredSchoolMembers = useMemo(() => {
        return schoolMembers.filter(m => {
            const matchesSearch = (m.profile?.full_name || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
                (m.profile?.email || '').toLowerCase().includes(modalSearch.toLowerCase());
            const matchesRole = roleFilter === 'all' || m.role === roleFilter;
            // Also hide people already in the group
            const notInGroup = !members.some(gm => gm.user_id === m.user_id);
            return matchesSearch && matchesRole && notInGroup;
        });
    }, [schoolMembers, modalSearch, roleFilter, members]);

    return (
        <div className={styles.container}>
            {/* LEFT: LIST */}
            <div className={styles.listColumn}>
                <div className={styles.columnHeader}>
                    <h2 className={styles.title}>All Groups</h2>
                    {isSchoolAdmin && (
                        <button className={styles.createBtn} onClick={() => setCreateModalOpen(true)}>
                            <Icons.Plus />
                        </button>
                    )}
                </div>
                <div className={styles.groupList}>
                    {groups.map(g => (
                        <div
                            key={g.id}
                            className={`${styles.groupCard} ${selectedGroupId === g.id ? styles.selected : ''}`}
                            onClick={() => setSelectedGroupId(g.id)}
                        >
                            <div className={styles.groupIcon}>
                                <Icons.Chat />
                            </div>
                            <div className={styles.groupInfo}>
                                <div className={styles.groupName}>{g.name}</div>
                                <div className={styles.groupDesc}>{g.description || 'No description'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: DETAILS */}
            <div className={styles.detailColumn}>
                {selectedGroup ? (
                    <>
                        <div className={styles.detailHeader}>
                            <div style={{ flex: 1 }}>
                                <h1 className={styles.detailName}>{selectedGroup.name}</h1>
                                <p className={styles.detailDesc}>{selectedGroup.description || 'Welcome to this group.'}</p>
                                <button
                                    className={styles.chatLinkBtn}
                                    onClick={() => router.push(`/dashboard/messages?groupId=${selectedGroup.id}`)}
                                    style={{
                                        marginTop: 12,
                                        padding: '8px 16px',
                                        borderRadius: 8,
                                        background: '#4a90d9',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}
                                >
                                    <Icons.Chat /> Start Chat
                                </button>
                            </div>
                            {isGroupAdmin && (
                                <button className={styles.addBtn} onClick={() => setAddMemberModalOpen(true)} title="Add Member">
                                    <Icons.UserPlus />
                                </button>
                            )}
                        </div>

                        <div className={styles.sectionTitle}>Members ({members.length})</div>

                        {memberLoading ? <div style={{ padding: 24, color: '#94a3b8' }}>Loading members...</div> : (
                            <div className={styles.membersGrid}>
                                {members.map(m => (
                                    <div key={m.user_id} className={styles.memberCard}>
                                        <div className={styles.memberAvatar}>
                                            {m.profile?.full_name?.[0] || 'U'}
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div className={styles.memberName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {m.profile?.full_name || 'Unknown User'}
                                            </div>
                                            <div className={styles.memberRole}>{m.role || 'Member'}</div>
                                        </div>
                                        {(isGroupAdmin && m.role !== 'admin') && (
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleRemoveMember(m.user_id)}
                                                style={{ position: 'static', marginLeft: 4 }}
                                            >
                                                <Icons.Trash />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <Icons.Group />
                        <p>Select a group to manage details</p>
                    </div>
                )}
            </div>

            {/* CREATE GROUP MODAL */}
            {createModalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false) }}>
                    <div className={styles.modal}>
                        <h3 style={{ marginBottom: 16, fontSize: 20 }}>Create New Group</h3>
                        <form onSubmit={handleCreate}>
                            <input className={styles.input} placeholder="Group Name (e.g. Science Club)" value={name} onChange={e => setName(e.target.value)} required />
                            <textarea className={styles.textarea} placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />

                            <div className={styles.actions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setCreateModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD MEMBER MODAL */}
            {addMemberModalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setAddMemberModalOpen(false) }}>
                    <div className={`${styles.modal} ${styles.largeModal}`}>
                        <h3 style={{ marginBottom: 8, fontSize: 24, fontWeight: 900 }}>Add Members</h3>
                        <p style={{ marginBottom: 24, fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                            Select registered school members to add to <strong>{selectedGroup.name}</strong>.
                        </p>

                        <div className={styles.modalContent}>
                            <div className={styles.searchBox}>
                                <input
                                    className={styles.modalInput}
                                    placeholder="Search by name or email..."
                                    value={modalSearch}
                                    onChange={e => setModalSearch(e.target.value)}
                                />
                            </div>

                            <div className={styles.filterPills}>
                                {['all', 'admin', 'teacher', 'communications_officer', 'parent'].map(role => (
                                    <button
                                        key={role}
                                        className={`${styles.pill} ${roleFilter === role ? styles.activePill : ''}`}
                                        onClick={() => setRoleFilter(role)}
                                    >
                                        {role === 'all' ? 'All Members' : role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            <div className={styles.selectionList}>
                                {fetchingMembers ? (
                                    <div className={styles.listEmpty}>Loading school members...</div>
                                ) : filteredSchoolMembers.length === 0 ? (
                                    <div className={styles.listEmpty}>No members found matching filters.</div>
                                ) : (
                                    filteredSchoolMembers.map(m => (
                                        <div key={m.user_id} className={styles.selectionRow}>
                                            <div className={styles.memberAvatar}>
                                                {m.profile?.full_name?.[0] || 'U'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className={styles.memberName}>{m.profile?.full_name}</div>
                                                <div className={styles.memberRole}>{m.role} • {m.profile?.email}</div>
                                            </div>
                                            <button
                                                className={styles.rowAddBtn}
                                                onClick={() => handleAddSelectedMember(m)}
                                                disabled={searching}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className={styles.actions} style={{ marginTop: 24 }}>
                            <button type="button" className={styles.saveBtn} onClick={() => setAddMemberModalOpen(false)}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
