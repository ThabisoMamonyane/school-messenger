import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width: windowWidth } = Dimensions.get('window');

/**
 * A wrapper component that limits the width of content on web/tablet
 * while remaining full-width on mobile.
 */
export default function ResponsiveScreen({ children, maxWidth = 500, style }) {
    const { colors, isDarkMode } = useTheme();

    if (Platform.OS !== 'web') {
        return <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>{children}</View>;
    }

    return (
        <View style={[styles.webOuter, { backgroundColor: colors.backgroundDark }]}>
            <View
                className={isDarkMode ? 'dark' : ''}
                style={[
                    styles.webInner,
                    { maxWidth, backgroundColor: colors.background },
                    style
                ]}
            >
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webOuter: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e8eef5', // Match app background
    },
    webInner: {
        width: '100%',
        flex: 1,
        backgroundColor: '#e8eef5',
    },
});
