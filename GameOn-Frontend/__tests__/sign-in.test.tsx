import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Silence noisy warnings
jest.spyOn(console, 'warn').mockImplementation(() => {});

// AsyncStorage official mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Keep LinearGradient simple
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children ?? null,
}));

// Icons: render a stub node
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return { Ionicons: (p: any) => React.createElement('Icon', p) };
});

// Router Link: pass-through
jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children ?? null,
}));

// Mock path MUST match your app's import alias
const mockSignIn = jest.fn();
jest.mock('@/contexts/auth', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

// Logo
jest.mock('@/constants/images', () => ({ images: { logo: 1 } }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import SignInScreen from '@/app/(auth)/sign-in';

beforeEach(async () => {
  jest.clearAllMocks();
  // Seed a valid user
  await AsyncStorage.setItem(
    'users',
    JSON.stringify([{ name: 'Jane', birth: '01/01/1990', email: 'jane@example.com', pwd: 'secret12' }])
  );
});

describe('SignInScreen', () => {
  it('signs in with valid credentials', async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText('example@example.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('**********'), 'secret12');
    fireEvent.press(getByText('Log In'));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('demo-token'));
  });

  it('shows an error with invalid credentials', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText('example@example.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('**********'), 'wrongpass');
    fireEvent.press(getByText('Log In'));

    expect(await findByText('Invalid email or password')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
