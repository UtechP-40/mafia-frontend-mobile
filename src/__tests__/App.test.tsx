import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />);
    expect(getByText('Mobile Mafia Game')).toBeTruthy();
  });
});