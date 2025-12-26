import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// A simple component to test that the testing library is working correctly
const TestComponent = () => (
    <View>
        <Text>Hello Testing World</Text>
    </View>
);

test('renders the test component correctly', () => {
    const { getByText } = render(<TestComponent />);

    // Verify that the text exists
    expect(getByText('Hello Testing World')).toBeTruthy();
});
