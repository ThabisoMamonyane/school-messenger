'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { useSchool } from '@/context/SchoolContext';
import { logger } from '@/lib/logger';

const Icons = {
    Schools: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Users: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Calendar: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    Megaphone: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></svg>,
    Message: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>,
    Settings: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
    Shield: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    Trophy: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 21h8m-4-4v4M7 4h10M5 4v3a5 5 0 0010 0V4M19 4v3a5 5 0 01-10 0V4" /></svg>,
    ArrowRight: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
    ArrowLeft: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12h-14M12 19l-7-7 7-7" /></svg>
};

export default function DashboardPage() {
    const router = useRouter();
    const { selectedSchool, selectedRole, loading: schoolLoading } = useSchool();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAppAdmin, setIsAppAdmin] = useState(false);

    // Platform stats for App Admin
    const [platformStats, setPlatformStats] = useState({ schools: 0, pending: 0, users: 0 });
    const [pendingSchools, setPendingSchools] = useState<any[]>([]);

    // Data states for School View
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [myGroups, setMyGroups] = useState<any[]>([]);
    const [quickMessages, setQuickMessages] = useState<any[]>([]);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    // Calendar strip state
    const [startDate, setStartDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [calendarDays, setCalendarDays] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            logger.info('Dashboard', 'fetchData started');
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // 1. Check if user is App Admin
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_app_admin')
                    .eq('id', user.id)
                    .single();

                if (profile?.is_app_admin) {
                    setIsAppAdmin(true);
                    // Fetch Platform Stats
                    const { count: sCount } = await supabase.from('schools').select('*', { count: 'exact', head: true });
                    const { count: pCount } = await supabase.from('schools').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                    const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

                    setPlatformStats({
                        schools: sCount || 0,
                        pending: pCount || 0,
                        users: uCount || 0
                    });

                    // Fetch Pending Schools
                    const { data: pSchools } = await supabase
                        .from('schools')
                        .select('*')
                        .eq('status', 'pending')
                        .order('created_at', { ascending: false })
                        .limit(3);
                    setPendingSchools(pSchools || []);
                    logger.info('Dashboard', 'App Admin data loaded', {
                        schools: sCount,
                        pending: pCount,
                        users: uCount
                    });
                } else if (selectedSchool) {
                    logger.info('Dashboard', `Fetching data for school: ${selectedSchool.name} (${selectedSchool.id})`, {
                        role: selectedRole
                    });
                    // 2. Use selected school from context
                    const sId = selectedSchool.id;

                    // 3. Fetch Announcements
                    const { data: annData } = await supabase
                        .from('announcements')
                        .select('*, author:author_id(full_name)')
                        .eq('school_id', sId)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (annData && annData.length > 0) {
                        const authorIds = annData.map(a => a.author_id);
                        const { data: rolesData } = await supabase
                            .from('school_members')
                            .select('user_id, role')
                            .eq('school_id', sId)
                            .in('user_id', authorIds);

                        const roleMap = (rolesData || []).reduce((acc: any, curr) => {
                            acc[curr.user_id] = curr.role;
                            return acc;
                        }, {});

                        const enrichedAnns = annData.map(a => ({
                            ...a,
                            author_role: roleMap[a.author_id] || 'Staff'
                        }));
                        setAnnouncements(enrichedAnns);
                        logger.debug('Dashboard', `${enrichedAnns.length} announcements loaded`);
                    } else {
                        setAnnouncements([]);
                    }

                    // 4. Fetch Events
                    const rangeStart = new Date(startDate);
                    rangeStart.setDate(rangeStart.getDate() - 14);
                    const rangeEnd = new Date(startDate);
                    rangeEnd.setDate(rangeEnd.getDate() + 30);

                    const { data: eventData } = await supabase
                        .from('school_events')
                        .select('*')
                        .eq('school_id', sId)
                        .gte('event_date', rangeStart.toISOString().split('T')[0])
                        .lte('event_date', rangeEnd.toISOString().split('T')[0])
                        .order('event_date', { ascending: true });
                    setUpcomingEvents(eventData || []);
                }

                // 5. Fetch Groups and Messages for current school & role
                if (selectedSchool) {
                    const isAdmin = selectedRole?.toLowerCase() === 'admin';
                    let groupIds: string[] = [];

                    if (isAdmin) {
                        // Admins see all groups in the school
                        const { data: adminGroups } = await supabase
                            .from('groups')
                            .select('id, name, description')
                            .eq('school_id', selectedSchool.id)
                            .limit(4);

                        setMyGroups(adminGroups || []);
                        groupIds = adminGroups?.map(g => g.id) || [];
                    } else {
                        // Others see only joined groups in THIS school
                        const { data: memberGroups } = await supabase
                            .from('group_members')
                            .select('group_id, groups!inner(school_id)')
                            .eq('user_id', user.id)
                            .eq('groups.school_id', selectedSchool.id);

                        groupIds = memberGroups?.map(g => g.group_id) || [];

                        if (groupIds.length > 0) {
                            const { data: joinedGroups } = await supabase
                                .from('groups')
                                .select('*')
                                .in('id', groupIds)
                                .limit(4);
                            setMyGroups(joinedGroups || []);
                        } else {
                            setMyGroups([]);
                        }
                    }

                    if (groupIds.length > 0) {
                        // Fetch Total Unread Messages for these groups
                        const { count: totalMsgCount } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .in('group_id', groupIds);

                        // Fetch Quick Messages for Display
                        const { data: qMsgs } = await supabase
                            .from('messages')
                            .select(`
                                *,
                                sender:profiles(full_name, avatar_url),
                                group:groups(name)
                            `)
                            .in('group_id', groupIds)
                            .order('created_at', { ascending: false })
                            .limit(4);

                        setQuickMessages(qMsgs || []);
                        setTotalUnreadCount(totalMsgCount || 0);
                    } else {
                        setQuickMessages([]);
                        setTotalUnreadCount(0);
                    }
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [startDate, selectedSchool]);

    useEffect(() => {
        if (!isAppAdmin) generateCalendarStrip();
    }, [startDate, selectedDate, isAppAdmin]);

    const generateCalendarStrip = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const fullDate = d.toISOString().split('T')[0];
            days.push({
                date: d.getDate(),
                day: d.toLocaleDateString('en-US', { weekday: 'long' }),
                fullDate: fullDate,
                active: fullDate === selectedDate
            });
        }
        setCalendarDays(days);
    };

    const handlePrevWeek = () => {
        const newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() - 7);
        setStartDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() + 7);
        setStartDate(newDate);
        logger.info('Dashboard', 'Calendar navigated forward');
    };

    const handleDateSelect = (fullDate: string) => {
        setSelectedDate(fullDate);
    };

    if (loading) return <div style={{ padding: 40, color: '#4a90d9', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', fontSize: '1.2rem', fontWeight: 600 }}>Loading Portal...</div>;

    // --- SHARED HEADER ---
    const DashboardHeader = () => (
        <div className={styles.dashboardHeader}>
            <div>
                <h1 className={styles.dateTitle}>
                    Hello, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
                </h1>
                <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                    Welcome back to your school management workspace.
                </p>
            </div>
            <div className={styles.totalHours}>
                <div className={styles.hoursLabel}>{startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                <div className={styles.hoursValue}>{new Date().toLocaleDateString()}</div>
            </div>
        </div>
    );


    // --- App Admin View ---
    if (isAppAdmin) {
        return (
            <div className={styles.adminHome}>
                <DashboardHeader />

                <div className={styles.gridContainer}>
                    <div className={styles.mainColumn}>
                        <div className={styles.announcementCard} style={{
                            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                            padding: '40px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Platform Control Center</h2>
                                <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.6, maxWidth: 400, marginBottom: 24 }}>
                                    You are managing the global School Messenger ecosystem. Monitor registrations and system status here.
                                </p>
                                <button
                                    className={styles.adminActionBtn}
                                    style={{ width: 'auto', padding: '12px 28px', background: 'white', color: '#7c3aed', border: 'none' }}
                                    onClick={() => router.push('/dashboard/admin')}
                                >
                                    Platform Settings
                                </button>
                            </div>
                            <div style={{ fontSize: 120, opacity: 0.1, transform: 'rotate(-10deg)', color: 'white' }}>
                                <Icons.Settings />
                            </div>
                        </div>

                        {/* Recent Requests Widget */}
                        <div className={styles.widgetCard}>
                            <div className={styles.widgetHeader}>
                                <h3 className={styles.widgetTitle}>School Approval Queue</h3>
                                <span className={styles.viewAll} onClick={() => router.push('/dashboard/admin')}>Manage All</span>
                            </div>
                            {pendingSchools.length > 0 ? (
                                pendingSchools.map(school => (
                                    <div key={school.id} className={styles.adminListItem}>
                                        <div className={styles.adminItemAvatar}>{school.name[0]}</div>
                                        <div className={styles.adminItemInfo}>
                                            <div className={styles.adminItemTitle}>{school.name}</div>
                                            <div className={styles.adminItemSub}>{school.address}, {school.province}</div>
                                        </div>
                                        <button className={styles.adminItemBtn} onClick={() => router.push('/dashboard/admin')}>Review</button>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyStateSimple}>The queue is empty! All schools are processed.</div>
                            )}
                        </div>
                    </div>

                    <div className={styles.sideColumn}>
                        <div className={styles.widgetCard} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Admin Tools</h3>
                            <button className={styles.adminActionBtn} onClick={() => router.push('/dashboard/admin')}>
                                Database Explorer
                            </button>
                            <button className={styles.adminActionBtn} onClick={() => router.push('/dashboard/support')} style={{ marginTop: 12 }}>
                                Support Tickets
                            </button>
                        </div>

                        <div className={styles.widgetCard}>
                            <div className={styles.widgetHeader}>
                                <h3 className={styles.widgetTitle}>Quick Messages</h3>
                                {quickMessages.length > 0 && <span className={styles.msgCountBadge}>{quickMessages.length}</span>}
                            </div>
                            {quickMessages.map((msg, i) => (
                                <div key={i} className={styles.messageItem} onClick={() => router.push(`/dashboard/messages?groupId=${msg.group_id}`)} style={{ cursor: 'pointer' }}>
                                    <div className={styles.msgAvatar}>{msg.sender?.full_name?.[0] || '?'}</div>
                                    <div className={styles.msgContent}>
                                        <div className={styles.msgName}>
                                            {msg.sender?.full_name || 'System'}
                                            <span className={styles.msgTime}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={styles.msgPreview}>
                                            <span style={{ fontWeight: 700, color: '#4a90d9' }}>{msg.group?.name}:</span> {msg.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <DashboardHeader />

            <div className={styles.gridContainer}>
                {/* Main Content Column */}
                <div className={styles.mainColumn}>
                    {/* Hero Banner Space */}
                    <div className={styles.announcementCard} style={{
                        background: 'linear-gradient(135deg, #4a90d9 0%, #3b82f6 100%)',
                        padding: '40px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Achieve Greatness Today</h2>
                            <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.6, maxWidth: 400, marginBottom: 24 }}>
                                You are doing great! Stay consistent with your groups and announcements to keep your school community thriving.
                            </p>
                            <button
                                className={styles.adminActionBtn}
                                style={{ width: 'auto', padding: '12px 28px', background: 'white', color: '#3b82f6', border: 'none' }}
                                onClick={() => router.push('/dashboard/find-schools')}
                            >
                                Explore Schools
                            </button>
                        </div>
                        <div style={{ fontSize: 130, opacity: 0.15, transform: 'rotate(15deg) translateY(-10px)', position: 'relative', zIndex: 1, color: 'white' }}>
                            <Icons.Trophy />
                        </div>
                    </div>

                    {/* Calendar Strip Container */}
                    <div className={styles.calendarStripContainer}>
                        <div className={styles.calendarHeader}>
                            <h3 className={styles.monthDisplay}>{startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                        </div>
                        <div className={styles.calendarWidget}>
                            <button className={styles.navButton} onClick={handlePrevWeek}><Icons.ArrowLeft /></button>
                            {calendarDays.map((d, i) => {
                                const dayEvents = upcomingEvents.filter(e => e.event_date === d.fullDate);
                                const count = dayEvents.length;
                                return (
                                    <div
                                        key={i}
                                        className={`${styles.dayColumn} ${d.active ? styles.active : ''}`}
                                        onClick={() => handleDateSelect(d.fullDate)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.dateNumber}>{d.date}</div>
                                        <div className={styles.dayName}>{d.day.substring(0, 3)}</div>
                                        {count > 0 && <div className={styles.classCount}>{count} Events</div>}
                                    </div>
                                );
                            })}
                            <button className={styles.navButton} onClick={handleNextWeek}><Icons.ArrowRight /></button>
                        </div>
                    </div>

                    {/* Event Preview Section */}
                    <div className={styles.eventPreviewSection}>
                        {upcomingEvents.filter(e => e.event_date === selectedDate).length > 0 ? (
                            <div className={styles.eventPreviewList}>
                                {upcomingEvents.filter(e => e.event_date === selectedDate).map((event, idx) => (
                                    <div
                                        key={idx}
                                        className={styles.eventPreviewCard}
                                        onClick={() => router.push(`/dashboard/calendar?date=${event.event_date}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.eventTimeBadge}>
                                            <Icons.Calendar /> {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div className={styles.eventPreviewContent}>
                                            <h4 className={styles.eventPreviewTitle}>{event.title}</h4>
                                            {event.description && <p className={styles.eventPreviewText}>{event.description}</p>}
                                        </div>
                                        <div className={styles.eventStatus}>
                                            <span className={styles.statusPill}>Upcoming</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyEvents}>
                                <div className={styles.emptyEventsIcon}><Icons.Calendar /></div>
                                <p>No events scheduled for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                            </div>
                        )}
                    </div>

                    {/* My Groups - Now taking more space */}
                    {/* Bottom Stats & Groups Grid */}
                    <div className={styles.bottomGrid}>
                        {/* Active Groups */}
                        <div className={styles.widgetCard} style={{ marginTop: 0 }}>
                            <div className={styles.widgetHeader}>
                                <h3 className={styles.widgetTitle}>Active Groups</h3>
                                <span className={styles.viewAll} onClick={() => router.push('/dashboard/groups')}>View All</span>
                            </div>
                            {myGroups.length > 0 ? (
                                <div className={styles.courseCard} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', cursor: 'pointer', marginBottom: 0 }} onClick={() => router.push('/dashboard/groups')}>
                                    <div className={styles.courseOverlay} />
                                    <div className={styles.courseContent}>
                                        <span className={styles.cardTag} style={{ background: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>Primary</span>
                                        <h4 style={{ fontSize: 18, fontWeight: 800 }}>{myGroups[0].name}</h4>
                                        <p style={{ opacity: 0.8, fontSize: 13 }}>{myGroups[0].description || 'Your active school community'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.emptyStateSimple}>You haven't joined any groups yet.</div>
                            )}
                        </div>

                        {/* Stats Pie Chart */}
                        <div className={styles.statsChartCard}>
                            <div className={styles.widgetHeader}>
                                <h3 className={styles.widgetTitle}>Activity Overview</h3>
                            </div>
                            <div className={styles.chartContainer}>
                                <div className={styles.pieChartWrapper}>
                                    <svg viewBox="0 0 100 100" className={styles.pieChart}>
                                        {(() => {
                                            const stats = [
                                                { label: 'Groups', value: myGroups.length, color: '#3b82f6' },
                                                { label: 'Events', value: upcomingEvents.length, color: '#f59e0b' },
                                                { label: 'News', value: announcements.length, color: '#ec4899' },
                                                { label: 'Messages', value: quickMessages.length, color: '#22c55e' }
                                            ];
                                            const total = stats.reduce((acc, s) => acc + s.value, 0);
                                            let currentOffset = 0;

                                            return stats.map((s, i) => {
                                                if (total === 0) return null;
                                                const percentage = (s.value / total) * 100;
                                                const offset = currentOffset;
                                                currentOffset += percentage;

                                                return (
                                                    <circle
                                                        key={i}
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        className={`${styles.pieSegment} ${hoveredCategory === s.label ? styles.active : ''}`}
                                                        stroke={s.color}
                                                        strokeDasharray={`${percentage} ${100 - percentage}`}
                                                        strokeDashoffset={-offset}
                                                        pathLength="100"
                                                        onMouseEnter={() => setHoveredCategory(s.label)}
                                                        onMouseLeave={() => setHoveredCategory(null)}
                                                    />
                                                );
                                            });
                                        })()}
                                    </svg>
                                    <div className={styles.chartCenterText}>
                                        <span className={styles.chartTotalValue}>
                                            {hoveredCategory
                                                ? [
                                                    { label: 'Groups', value: myGroups.length },
                                                    { label: 'Events', value: upcomingEvents.length },
                                                    { label: 'News', value: announcements.length },
                                                    { label: 'Messages', value: quickMessages.length }
                                                ].find(s => s.label === hoveredCategory)?.value
                                                : (myGroups.length + upcomingEvents.length + announcements.length + quickMessages.length)
                                            }
                                        </span>
                                        <span className={styles.chartTotalLabel}>
                                            {hoveredCategory || 'Items'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.chartLegend}>
                                    {[
                                        { label: 'Groups', value: myGroups.length, color: '#3b82f6' },
                                        { label: 'Events', value: upcomingEvents.length, color: '#f59e0b' },
                                        { label: 'News', value: announcements.length, color: '#ec4899' },
                                        { label: 'Messages', value: quickMessages.length, color: '#22c55e' }
                                    ].map((s, i) => (
                                        <div
                                            key={i}
                                            className={`${styles.legendItem} ${hoveredCategory === s.label ? styles.active : ''}`}
                                            onMouseEnter={() => setHoveredCategory(s.label)}
                                            onMouseLeave={() => setHoveredCategory(null)}
                                        >
                                            <div className={styles.legendColor} style={{ background: s.color }} />
                                            <span className={styles.legendLabel}>{s.label}</span>
                                            <span className={styles.legendValue}>{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Column */}
                <div className={styles.sideColumn}>
                    {/* Latest Announcements */}
                    <div className={styles.widgetCard}>
                        <div className={styles.widgetHeader}>
                            <h3 className={styles.widgetTitle}>Announcements</h3>
                            <span className={styles.viewAll} onClick={() => router.push('/dashboard/announcements')}>View All</span>
                        </div>
                        {announcements.length > 0 ? (
                            <div className={styles.announcementListCompact}>
                                {announcements.slice(0, 3).map((ann, i) => (
                                    <div key={i} className={styles.announcementListItem} onClick={() => router.push('/dashboard/announcements')}>
                                        <div className={styles.annListItemHeader}>
                                            <span className={styles.annAuthor}>{ann.author_role || 'Staff'}</span>
                                            <span className={styles.annDate}>{new Date(ann.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className={styles.annTitleCompact}>{ann.title}</h4>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyStateSimple}>No news today.</div>
                        )}
                    </div>

                    {/* Recent Chats */}
                    <div className={styles.widgetCard}>
                        <div className={styles.widgetHeader}>
                            <h3 className={styles.widgetTitle}>Recent Chats</h3>
                            {totalUnreadCount > 0 && <span className={styles.msgCountBadge}>{totalUnreadCount}</span>}
                        </div>
                        {quickMessages.length > 0 ? (
                            quickMessages.map((msg, i) => (
                                <div key={i} className={styles.messageItem} onClick={() => router.push(`/dashboard/messages?groupId=${msg.group_id}`)} style={{ cursor: 'pointer' }}>
                                    <div className={styles.msgAvatar}>{msg.sender?.full_name?.[0] || 'U'}</div>
                                    <div className={styles.msgContent}>
                                        <div className={styles.msgName}>
                                            {msg.sender?.full_name || 'User'}
                                            <span className={styles.msgTime}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className={styles.msgPreview}>{msg.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyStateSimple}>No active chats.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
