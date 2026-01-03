import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { colorScheme, setColorScheme, toggleColorScheme } = useNativeWindColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

    // Persist theme choice
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('user-theme');
                if (savedTheme) {
                    setColorScheme(savedTheme);
                    setIsDarkMode(savedTheme === 'dark');
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
        setColorScheme(newTheme);
        setIsDarkMode(newTheme === 'dark');
        try {
            await AsyncStorage.setItem('user-theme', newTheme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    // Semantic Colors for each mode
    const colors = {
        background: isDarkMode ? '#111827' : '#EFF6FF', // Darker dark bg, Lighter blueish-white light bg
        backgroundLight: isDarkMode ? '#1F2937' : '#F8FAFC',
        backgroundDark: isDarkMode ? '#0F172A' : '#E2E8F0',
        surface: isDarkMode ? '#1F2937' : '#FFFFFF', // Solid dark gray for dark mode cards
        surfaceActive: isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(74, 144, 217, 0.15)',
        text: isDarkMode ? '#F9FAFB' : '#1E293B', // Almost white vs Dark Slate Blue
        textLight: isDarkMode ? '#E5E7EB' : '#475569',
        textMuted: isDarkMode ? '#9CA3AF' : '#64748B',
        primary: isDarkMode ? '#38BDF8' : '#4A90D9', // Sky blue for dark mode
        border: isDarkMode ? '#374151' : '#E2E8F0',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors, colorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
