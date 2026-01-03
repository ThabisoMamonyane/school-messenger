'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { useSchool } from '@/context/SchoolContext';
import { logger } from '@/lib/logger';

const Icons = {
    Send: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
    Attach: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>,
    Chat: () => <svg width="48" height="48" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    Plus: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>,
    Info: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
};

export default function MessagesPage() {
    const { selectedSchool, loading: schoolLoading } = useSchool();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [senderMap, setSenderMap] = useState<any>({});

    // Create Group State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Members Panel State
    const [showInfo, setShowInfo] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const formatMessageDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (date.toDateString() === now.toDateString()) return 'Today';
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

        return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    };

    const fetchConversations = async () => {
        logger.info('Messages', 'fetchConversations started');
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (!user || !selectedSchool) {
            logger.warn('Messages', 'Missing user or school in fetchConversations');
            return;
        }

        // Fetch joined groups for this school
        const { data: memberGroups } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
        const groupIds = memberGroups?.map(m => m.group_id) || [];

        if (groupIds.length > 0) {
            const { data: groups } = await supabase
                .from('groups')
                .select('*')
                .in('id', groupIds)
                .eq('school_id', selectedSchool.id)
                .order('created_at', { ascending: false });
            setConversations(groups || []);
            logger.info('Messages', `${groups?.length || 0} conversations loaded for school: ${selectedSchool.id}`);
        } else {
            setConversations([]);
        }
        setLoading(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async (groupId: string) => {
        logger.info('Messages', `fetchMessages for group: ${groupId}`);
        setMsgLoading(true);
        // 1. Fetch Messages
        const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });

        if (msgs) {
            setMessages(msgs);

            // 2. Fetch Sender Profiles
            const senderIds = Array.from(new Set(msgs.map((m: any) => m.sender_id)));
            if (senderIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', senderIds);

                const map: any = {};
                profiles?.forEach((p: any) => map[p.id] = p);
                setSenderMap((prev: any) => ({ ...prev, ...map }));
            }
        }
        setMsgLoading(false);
        setTimeout(scrollToBottom, 100);
    };

    const subscribeToMessages = (groupId: string) => {
        logger.info('Messages', `Subscribing to real-time messages for group: ${groupId}`);
        const channel = supabase
            .channel(`group_chat:${groupId}`) // Match mobile format
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `group_id=eq.${groupId}`
                },
                async (payload) => {
                    const newMsg = payload.new;

                    // Add to messages list
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg].sort((a, b) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );
                    });

                    // Fetch sender profile if unknown
                    if (newMsg.sender_id) {
                        setSenderMap((prevMap: any) => {
                            if (!prevMap[newMsg.sender_id]) {
                                // Trigger background fetch if not in map
                                supabase
                                    .from('profiles')
                                    .select('id, full_name, avatar_url')
                                    .eq('id', newMsg.sender_id)
                                    .single()
                                    .then(({ data }) => {
                                        if (data) setSenderMap((latest: any) => ({ ...latest, [data.id]: data }));
                                    });
                            }
                            return prevMap;
                        });
                    }
                    setTimeout(scrollToBottom, 50);
                }
            )
            .subscribe((status) => {
                logger.info('Messages', `Realtime status for ${groupId}: ${status}`);
                if (status === 'CHANNEL_ERROR') {
                    logger.error('Messages', `Realtime connection error for group: ${groupId}`);
                }
            });

        return channel;
    };

    const fetchMembers = async (groupId: string) => {
        setMembersLoading(true);
        try {
            // 1. Fetch Members (Raw) - Removed 'id' column
            const { data: memberData, error: memberError } = await supabase
                .from('group_members')
                .select('role, user_id, joined_at')
                .eq('group_id', groupId);

            if (memberError) {
                console.error('Member fetch error:', memberError);
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
        } catch (e) {
            console.error(e);
        }
        finally { setMembersLoading(false); }
    };

    useEffect(() => {
        // Check for groupId in URL query param
        const params = new URLSearchParams(window.location.search);
        const gid = params.get('groupId');
        if (gid) setSelectedGroupId(gid);

        fetchConversations();
    }, [selectedSchool]);

    useEffect(() => {
        let channel: any;
        if (selectedGroupId) {
            fetchMessages(selectedGroupId);
            channel = subscribeToMessages(selectedGroupId);
            fetchMembers(selectedGroupId);
        }
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [selectedGroupId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedGroupId || !user) return;

        logger.info('Messages', 'Sending message', { groupId: selectedGroupId });
        const content = newMessage.trim();
        const temporaryId = Math.random().toString(36).substr(2, 9);

        // Optimistic Update
        const optimisticMsg = {
            id: temporaryId,
            group_id: selectedGroupId,
            sender_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            isOptimistic: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        setTimeout(scrollToBottom, 50);

        const { data, error } = await supabase.from('messages').insert({
            group_id: selectedGroupId,
            sender_id: user.id,
            content: content
        }).select().single();

        if (error) {
            logger.error('Messages', 'Failed to send message', error);
            alert('Failed to send message');
            setMessages(prev => prev.filter(m => m.id !== temporaryId));
            setNewMessage(content);
        } else {
            logger.info('Messages', 'Message sent successfully', { messageId: data.id });
            // Replace optimistic message with real one to get correct ID and Timestamp
            setMessages(prev => prev.map(m => m.id === temporaryId ? data : m));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !selectedSchool || !user) return;
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

            setConversations([group, ...conversations]);
            setSelectedGroupId(group.id);
            setCreateModalOpen(false);
            setName(''); setDesc('');
        } catch (err: any) {
            alert('Error creating group: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedGroup = conversations.find(c => c.id === selectedGroupId);

    return (
        <div className={styles.container}>
            {/* SIDEBAR */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <button className={styles.createBtn} onClick={() => setCreateModalOpen(true)} title="Create Group"><Icons.Plus /></button>
                    <input placeholder="Search groups..." className={styles.searchBox} />
                </div>
                <div className={styles.conversationList}>
                    {conversations.map(c => (
                        <div
                            key={c.id}
                            className={`${styles.conversationItem} ${selectedGroupId === c.id ? styles.selected : ''}`}
                            onClick={() => setSelectedGroupId(c.id)}
                        >
                            <div className={styles.avatar}>
                                {c.name.charAt(0)}
                            </div>
                            <div className={styles.convInfo}>
                                <div className={styles.convName}>{c.name}</div>
                                <div className={styles.convSnippet}>{c.description || 'No description'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CHAT WINDOW */}
            <div className={styles.chatWindow}>
                {selectedGroup ? (
                    <>
                        <div className={styles.chatHeader}>
                            <div>
                                <div className={styles.headerTitle}>{selectedGroup.name}</div>
                                <div className={styles.headerSubtitle}>{messages.length} messages</div>
                            </div>
                            <button
                                className={`${styles.iconBtn} ${showInfo ? styles.active : ''}`}
                                onClick={() => setShowInfo(!showInfo)}
                                title="Group Info"
                            >
                                <Icons.Info />
                            </button>
                        </div>

                        <div className={styles.chatBody}>
                            <div className={styles.messageList}>
                                {messages.map((m, i) => {
                                    const isMe = m.sender_id === user?.id;
                                    const profile = senderMap[m.sender_id];

                                    // Date separator logic
                                    const currentDate = new Date(m.created_at).toDateString();
                                    const prevDate = i > 0 ? new Date(messages[i - 1].created_at).toDateString() : null;
                                    const showSeparator = currentDate !== prevDate;

                                    return (
                                        <div key={m.id} style={{ display: 'contents' }}>
                                            {showSeparator && (
                                                <div className={styles.dateSeparator}>
                                                    <span className={styles.dateSeparatorText}>
                                                        {formatMessageDate(m.created_at)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`${styles.messageRow} ${isMe ? styles.me : ''}`}>
                                                {!isMe && (
                                                    <div className={styles.msgAvatar} title={profile?.full_name}>
                                                        {profile?.full_name?.[0] || '?'}
                                                    </div>
                                                )}
                                                <div className={styles.msgBubble}>
                                                    {!isMe && <div className={styles.senderName}>{profile?.full_name || 'Unknown'}</div>}
                                                    <div className={styles.msgContent}>{m.content}</div>
                                                    <div className={styles.msgTime}>
                                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* INFO SIDEBAR */}
                            {showInfo && (
                                <div className={styles.infoSidebar}>
                                    <div className={styles.infoTitle}>Members ({members.length})</div>
                                    <div className={styles.membersList}>
                                        {members.map(m => (
                                            <div key={m.user_id} className={styles.memberItem}>
                                                <div className={styles.memberAvatar}>
                                                    {m.profile?.full_name?.[0] || 'U'}
                                                </div>
                                                <div className={styles.memberInfo}>
                                                    <div className={styles.memberName}>{m.profile?.full_name || 'Unknown'}</div>
                                                    <div className={styles.memberRole}>{m.role}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <form className={styles.inputArea} onSubmit={handleSend}>
                            <button type="button" className={styles.attachBtn}><Icons.Attach /></button>
                            <input
                                className={styles.input}
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim()}>
                                <Icons.Send />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <Icons.Chat />
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            {createModalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false) }}>
                    <div className={styles.modal}>
                        <h3 style={{ marginBottom: 16, fontSize: 20 }}>Create New Group</h3>
                        <form onSubmit={handleCreate}>
                            <input className={styles.modalInput} placeholder="Group Name" value={name} onChange={e => setName(e.target.value)} required />
                            <textarea className={styles.textarea} placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setCreateModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.saveBtn} disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
