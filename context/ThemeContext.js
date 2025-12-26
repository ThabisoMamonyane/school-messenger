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
        background: isDarkMode ? '#1a202c' : '#e8eef5',
        backgroundLight: isDarkMode ? '#2d3748' : '#f0f4f8',
        backgroundDark: isDarkMode ? '#171923' : '#d1dbe8',
        surface: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        surfaceActive: isDarkMode ? 'rgba(66, 153, 225, 0.15)' : 'rgba(74, 144, 217, 0.15)',
        text: isDarkMode ? '#f7fafc' : '#2d3748',
        textLight: isDarkMode ? '#e2e8f0' : '#4a5568',
        textMuted: isDarkMode ? '#a0aec0' : '#718096',
        primary: isDarkMode ? '#63b3ed' : '#4a90d9',
        border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors, colorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
