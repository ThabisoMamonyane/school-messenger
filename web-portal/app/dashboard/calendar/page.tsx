'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { useSchool } from '@/context/SchoolContext';

const Icons = {
    Left: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>,
    Right: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>,
    Plus: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>,
    Trash: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Calendar: () => <svg width="40" height="40" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
};

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Vibrant colors for events
const EVENT_COLORS = [
    { bg: '#3b82f6', text: '#fff' }, // Blue
    { bg: '#ef4444', text: '#fff' }, // Red
    { bg: '#10b981', text: '#fff' }, // Emerald
    { bg: '#f59e0b', text: '#fff' }, // Amber
    { bg: '#8b5cf6', text: '#fff' }, // Violet
    { bg: '#ec4899', text: '#fff' }, // Pink
];

export default function CalendarPage() {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Suspense fallback={<div className={styles.loading}>Loading calendar...</div>}>
                <CalendarContent />
            </Suspense>
        </div>
    );
}

function CalendarContent() {
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');
    const { selectedSchool, selectedRole, loading: schoolLoading } = useSchool();

    // Initialize to the date from URL param, or today
    const initialDate = dateParam ? new Date(dateParam + 'T00:00:00') : new Date();

    const [currentMonth, setCurrentMonth] = useState(initialDate);
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Form
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedSchool]);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user && selectedSchool) {
                const { data: evts } = await supabase
                    .from('school_events')
                    .select('*')
                    .or(`school_id.eq.${selectedSchool.id},is_all_schools.eq.true`);

                setEvents(evts || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Calculate offset based on Monday start (ISO week)
        // getDay() returns 0 for Sunday. We want 0 for Monday.
        // Sun (0) -> 6, Mon (1) -> 0
        let startOffset = firstDay.getDay() - 1;
        if (startOffset < 0) startOffset = 6;

        for (let i = 0; i < startOffset; i++) days.push(null);
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentMonth]);

    const selectedDayEvents = useMemo(() => {
        const dateStr = formatDateToYYYYMMDD(selectedDate);
        return events.filter(e => {
            if (e.event_date === dateStr) return true;
            if (e.end_date) {
                return dateStr >= e.event_date && dateStr <= e.end_date;
            }
            return false;
        });
    }, [events, selectedDate]);

    const handleMonthChange = (dir: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + dir, 1));
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !selectedSchool) return;

        const dateStr = formatDateToYYYYMMDD(selectedDate);

        const { data, error } = await supabase.from('school_events').insert({
            school_id: selectedSchool.id,
            title,
            description: desc,
            event_date: dateStr,
            start_time: startTime || null,
            end_time: endTime || null,
            created_by: user.id
        }).select().single();

        if (!error && data) {
            setEvents([...events, data]);
            setModalOpen(false);
            setTitle(''); setDesc(''); setStartTime(''); setEndTime('');
        } else {
            alert('Failed to create event');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this event?')) return;
        const { error } = await supabase.from('school_events').delete().eq('id', id);
        if (!error) {
            setEvents(events.filter(e => e.id !== id));
        }
    };

    const getEventColor = (evt: any) => {
        if (evt.type === 'public_holiday') return { bg: '#10b981', text: '#fff' }; // Emerald
        if (evt.type === 'school_holiday') return { bg: '#f59e0b', text: '#fff' }; // Amber

        // Deterministic color based on title length + id char code
        const sum = (evt.title?.length || 0) + (evt.id?.charCodeAt(0) || 0);
        return EVENT_COLORS[sum % EVENT_COLORS.length];
    };

    const canEdit = ['admin', 'communications_officer', 'teacher'].includes(selectedRole);
    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
    const isSelected = (d: Date) => d.toDateString() === selectedDate.toDateString();

    return (
        <div className={styles.container}>
            {/* CALENDAR GRID */}
            <div className={styles.calendarColumn}>
                <div className={styles.calendarHeader}>
                    <h2 className={styles.monthTitle}>
                        {mounted ? currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '...'}
                    </h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleMonthChange(-1)} className={styles.navBtn}><Icons.Left /></button>
                        <button onClick={() => handleMonthChange(1)} className={styles.navBtn}><Icons.Right /></button>
                    </div>
                </div>

                <div className={styles.grid}>
                    {WEEKDAYS.map(d => <div key={d} className={styles.headerCell}>{d}</div>)}
                    {daysInMonth.map((date, i) => {
                        if (!date) return <div key={i} className={styles.emptyCell} />;

                        const dateStr = formatDateToYYYYMMDD(date);
                        const dayEvents = events.filter(e => {
                            if (e.event_date === dateStr) return true;
                            if (e.end_date) {
                                return dateStr >= e.event_date && dateStr <= e.end_date;
                            }
                            return false;
                        });
                        const isPublic = dayEvents.some(e => e.type === 'public_holiday');
                        const isSchool = dayEvents.some(e => e.type === 'school_holiday');

                        return (
                            <div
                                key={i}
                                className={`${styles.dayCell} ${isToday(date) ? styles.today : ''} ${isSelected(date) ? styles.selected : ''}`}
                                style={{
                                    backgroundColor: isSelected(date) ? undefined : (isPublic ? '#ecfdf5' : (isSchool && dayEvents.some(e => e.type === 'school_holiday' && e.end_date)) ? '#fffbeb' : undefined)
                                }}
                                onClick={() => setSelectedDate(date)}
                            >
                                <span className={styles.dayNumber}>{date.getDate()}</span>
                                {dayEvents.map(e => {
                                    const color = getEventColor(e);
                                    return (
                                        <div
                                            key={e.id}
                                            className={styles.eventChip}
                                            style={{ backgroundColor: color.bg, color: color.text }}
                                            title={e.title}
                                        >
                                            {e.start_time ? `${e.start_time} ` : ''}{e.title}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* DETAILS SIDEBAR */}
            <div className={styles.detailsColumn}>
                <div className={styles.detailsHeader}>
                    <div className={styles.selectedDateTitle}>
                        {mounted ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : '...'}
                    </div>
                    {canEdit && (
                        <button className={styles.addBtn} onClick={() => setModalOpen(true)}>
                            <Icons.Plus />
                        </button>
                    )}
                </div>

                <div className={styles.eventList}>
                    {selectedDayEvents.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Icons.Calendar />
                            <p>No events scheduled</p>
                        </div>
                    ) : (
                        selectedDayEvents.map(evt => {
                            const color = getEventColor(evt);
                            return (
                                <div key={evt.id} className={styles.eventCard} style={{ borderLeft: `4px solid ${color.bg}` }}>
                                    {canEdit && (
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(evt.id)}>
                                            <Icons.Trash />
                                        </button>
                                    )}
                                    <div className={styles.eventTime}>
                                        <span className={styles.eventColorDot} style={{ background: color.bg }}></span>
                                        {(evt.start_time || evt.end_time) ?
                                            `${evt.start_time || ''} ${evt.end_time ? '- ' + evt.end_time : ''}` :
                                            'All Day'}
                                    </div>
                                    <div className={styles.eventTitle}>{evt.title}</div>
                                    {evt.description && <div className={styles.eventDesc}>{evt.description}</div>}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* MODAL */}
            {modalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}>
                    <div className={styles.modal}>
                        <h3 style={{ marginBottom: 16, fontSize: 20 }}>Add Event</h3>
                        <form onSubmit={handleAddEvent}>
                            <input className={styles.input} placeholder="Event Title" value={title} onChange={e => setTitle(e.target.value)} required />
                            <textarea className={styles.textarea} placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
                            <div className={styles.row}>
                                <input className={styles.input} type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                <input className={styles.input} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                            </div>
                            <div className={styles.actions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.saveBtn}>Save Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
