import React from 'react';
import Animated, { SlideInRight, SlideOutLeft, FadeOut } from 'react-native-reanimated';

export default function PageTransition({ children }) {
    return (
        <Animated.View
            style={{ flex: 1 }}
            entering={SlideInRight.duration(300)}
            exiting={FadeOut.duration(200)}
        >
            {children}
        </Animated.View>
    );
}
