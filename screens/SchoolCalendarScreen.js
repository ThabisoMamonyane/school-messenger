import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import ResponsiveScreen from '../components/ResponsiveScreen';

export default function SchoolCalendarScreen({ route, navigation }) {
    const { school, role } = route.params;
    const { user } = useAuth();
    const { colors, isDarkMode } = useTheme();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventStartTime, setEventStartTime] = useState('');
    const [eventEndTime, setEventEndTime] = useState('');
    const [saving, setSaving] = useState(false);

    const canManageEvents = role === 'admin' || role === 'communications_officer';

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [school.id])
    );

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('school_events')
                .select('*')
                .eq('school_id', school.id)
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        return { daysInMonth, startingDay };
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    };

    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => e.event_date === dateStr);
    };

    const hasEvents = (date) => {
        return getEventsForDate(date).length > 0;
    };

    // Navigation
    const goToPrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    // Modal handlers
    const openAddModal = () => {
        setEditingEvent(null);
        setEventTitle('');
        setEventDescription('');
        setEventDate(selectedDate.toISOString().split('T')[0]);
        setEventStartTime('');
        setEventEndTime('');
        setModalVisible(true);
    };

    const openEditModal = (event) => {
        setEditingEvent(event);
        setEventTitle(event.title);
        setEventDescription(event.description || '');
        setEventDate(event.event_date);
        setEventStartTime(event.start_time || '');
        setEventEndTime(event.end_time || '');
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingEvent(null);
    };

    const handleSaveEvent = async () => {
        if (!eventTitle.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        if (!eventDate) {
            Alert.alert('Error', 'Please enter a date');
            return;
        }

        setSaving(true);
        try {
            if (editingEvent) {
                // Update
                const { error } = await supabase
                    .from('school_events')
                    .update({
                        title: eventTitle.trim(),
                        description: eventDescription.trim() || null,
                        event_date: eventDate,
                        start_time: eventStartTime || null,
                        end_time: eventEndTime || null,
                    })
                    .eq('id', editingEvent.id);

                if (error) throw error;
                Alert.alert('Success', 'Event updated');
            } else {
                // Insert
                const { error } = await supabase
                    .from('school_events')
                    .insert({
                        school_id: school.id,
                        title: eventTitle.trim(),
                        description: eventDescription.trim() || null,
                        event_date: eventDate,
                        start_time: eventStartTime || null,
                        end_time: eventEndTime || null,
                        created_by: user.id,
                    });

                if (error) throw error;
                Alert.alert('Success', 'Event created');
            }
            closeModal();
            fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert('Error', 'Failed to save event');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEvent = (event) => {
        Alert.alert(
            'Delete Event',
            `Are you sure you want to delete "${event.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('school_events')
                                .delete()
                                .eq('id', event.id);
                            if (error) throw error;
                            fetchEvents();
                        } catch (error) {
                            console.error('Error deleting event:', error);
                            Alert.alert('Error', 'Failed to delete event');
                        }
                    },
                },
            ]
        );
    };

    // Render calendar grid
    const renderCalendarGrid = () => {
        const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
        const days = [];
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Week day headers
        const headers = weekDays.map((day) => (
            <View key={day} style={styles.calendarCell}>
                <Text style={[styles.weekDayText, { color: colors.textMuted }]}>{day}</Text>
            </View>
        ));

        // Empty cells before first day
        for (let i = 0; i < startingDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const dateHasEvents = hasEvents(date);

            days.push(
                <TouchableOpacity
                    key={day}
                    style={styles.calendarCell}
                    onPress={() => setSelectedDate(date)}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.dayInner,
                        isSelected && { backgroundColor: '#4a90d9' },
                        isToday && !isSelected && { borderWidth: 2, borderColor: '#4a90d9' }
                    ]}>
                        <Text style={[
                            styles.dayText,
                            { color: isSelected ? '#fff' : colors.text },
                            isToday && !isSelected && { color: '#4a90d9', fontWeight: '800' }
                        ]}>
                            {day}
                        </Text>
                        {dateHasEvents && !isSelected && (
                            <View style={styles.eventDot} />
                        )}
                        {dateHasEvents && isSelected && (
                            <View style={[styles.eventDot, { backgroundColor: '#fff' }]} />
                        )}
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <View>
                <View style={styles.calendarRow}>{headers}</View>
                <View style={styles.calendarGrid}>{days}</View>
            </View>
        );
    };

    const selectedDateEvents = getEventsForDate(selectedDate);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ResponsiveScreen maxWidth={800}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>School Calendar</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Month Navigator */}
                    <View style={[styles.monthNav, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
                            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.monthText, { color: colors.text }]}>{formatMonthYear(currentMonth)}</Text>
                        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Calendar Grid */}
                    <View style={[styles.calendarContainer, { backgroundColor: colors.surface }]}>
                        {renderCalendarGrid()}
                    </View>

                    {/* Events for Selected Date */}
                    <View style={[styles.eventsSection]}>
                        <View style={styles.eventsSectionHeader}>
                            <Text style={[styles.eventsTitle, { color: colors.text }]}>
                                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </Text>
                            {canManageEvents && (
                                <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
                                    <LinearGradient
                                        colors={['#4a90d9', '#5486E9']}
                                        style={styles.addBtnGradient}
                                    >
                                        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>

                        {selectedDateEvents.length === 0 ? (
                            <View style={[styles.noEvents, { backgroundColor: colors.surface }]}>
                                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.textMuted} style={{ opacity: 0.5 }} />
                                <Text style={[styles.noEventsText, { color: colors.textMuted }]}>No events on this day</Text>
                            </View>
                        ) : (
                            selectedDateEvents.map((event, index) => (
                                <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.surface, borderLeftColor: index % 2 === 0 ? '#4a90d9' : '#9D85FC' }]}>
                                    <View style={styles.eventInfo}>
                                        <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                                        {event.description && (
                                            <Text style={[styles.eventDescription, { color: colors.textMuted }]} numberOfLines={2}>{event.description}</Text>
                                        )}
                                        <View style={styles.eventMetaRow}>
                                            {(event.start_time || event.end_time) && (
                                                <View style={styles.eventTimeRow}>
                                                    <MaterialCommunityIcons name="clock-outline" size={14} color={colors.primary} />
                                                    <Text style={[styles.eventTime, { color: colors.textMuted }]}>
                                                        {event.start_time || '--:--'} - {event.end_time || '--:--'}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    {canManageEvents && (
                                        <View style={styles.eventActions}>
                                            <TouchableOpacity onPress={() => openEditModal(event)} style={styles.actionBtn}>
                                                <MaterialCommunityIcons name="pencil-outline" size={20} color="#4a90d9" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteEvent(event)} style={styles.actionBtn}>
                                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ff6b6b" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Add/Edit Modal */}
                <Modal
                    visible={modalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={closeModal}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingEvent ? 'Edit Event' : 'Add Event'}
                            </Text>

                            <TextInput
                                style={[styles.input, { backgroundColor: isDarkMode ? '#2d3748' : '#f7fafc', color: colors.text, borderColor: colors.border }]}
                                placeholder="Event Title"
                                placeholderTextColor={colors.textMuted}
                                value={eventTitle}
                                onChangeText={setEventTitle}
                            />
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#2d3748' : '#f7fafc', color: colors.text, borderColor: colors.border }]}
                                placeholder="Description (optional)"
                                placeholderTextColor={colors.textMuted}
                                value={eventDescription}
                                onChangeText={setEventDescription}
                                multiline
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: isDarkMode ? '#2d3748' : '#f7fafc', color: colors.text, borderColor: colors.border }]}
                                placeholder="Date (YYYY-MM-DD)"
                                placeholderTextColor={colors.textMuted}
                                value={eventDate}
                                onChangeText={setEventDate}
                            />
                            <View style={styles.timeRow}>
                                <TextInput
                                    style={[styles.input, styles.timeInput, { backgroundColor: isDarkMode ? '#2d3748' : '#f7fafc', color: colors.text, borderColor: colors.border }]}
                                    placeholder="Start (HH:MM)"
                                    placeholderTextColor={colors.textMuted}
                                    value={eventStartTime}
                                    onChangeText={setEventStartTime}
                                />
                                <TextInput
                                    style={[styles.input, styles.timeInput, { backgroundColor: isDarkMode ? '#2d3748' : '#f7fafc', color: colors.text, borderColor: colors.border }]}
                                    placeholder="End (HH:MM)"
                                    placeholderTextColor={colors.textMuted}
                                    value={eventEndTime}
                                    onChangeText={setEventEndTime}
                                />
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity onPress={closeModal} style={[styles.modalBtn, styles.cancelBtn]}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSaveEvent} style={[styles.modalBtn, styles.saveBtn]} disabled={saving}>
                                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ResponsiveScreen>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerBtn: { padding: 4 },
    scrollView: { flex: 1, padding: 16 },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    navButton: { padding: 8 },
    monthText: { fontSize: 18, fontWeight: '700' },
    calendarContainer: {
        padding: 12,
        borderRadius: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    calendarRow: { flexDirection: 'row', marginBottom: 8 },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calendarCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
    },
    weekDayText: { fontSize: 12, fontWeight: '600' },
    dayInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    dayText: { fontSize: 14, fontWeight: '500' },
    eventDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4a90d9',
        marginTop: 2,
    },
    eventsSection: {
        marginBottom: 100,
    },
    eventsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    eventsTitle: { fontSize: 18, fontWeight: '800' },
    addBtnGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noEvents: {
        alignItems: 'center',
        paddingVertical: 40,
        borderRadius: 16,
    },
    noEventsText: { marginTop: 12, fontSize: 14 },
    eventCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    eventInfo: { flex: 1 },
    eventMetaRow: { marginTop: 6 },
    eventTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    eventDescription: { fontSize: 13, marginBottom: 4, lineHeight: 18 },
    eventTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    eventTime: { fontSize: 12, fontWeight: '500' },
    eventActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12 },
    actionBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    timeRow: { flexDirection: 'row', gap: 12 },
    timeInput: { flex: 1 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
    modalBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    cancelBtn: { backgroundColor: '#e2e8f0' },
    cancelBtnText: { color: '#4a5568', fontWeight: '600', fontSize: 16 },
    saveBtn: { backgroundColor: '#4a90d9' },
    saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
