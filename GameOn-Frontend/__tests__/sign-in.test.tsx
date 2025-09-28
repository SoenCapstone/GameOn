// __tests__/sign-in.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SignInScreen from '@/app/(auth)/sign-in';

// --- Mocks ---
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

// Name starts with "mock" so it can be referenced inside jest.mock factory
const mockSignIn = jest.fn();
jest.mock('@/contexts/auth', () => ({
  useAuth: () => ({ signIn: mockSignIn, user: null, loading: false }),
}));

type User = { name: string; birth: string; email: string; pwd: string };

describe('SignInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error for wrong credentials', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([] as User[]));

    const { getByPlaceholderText, getByText, findByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText(/example@example\.com/i), 'nouser@mail.com');
    fireEvent.changeText(getByPlaceholderText(/•+/), 'badpass'); // password input
    fireEvent.press(getByText(/log in/i));

    expect(await findByText(/invalid email or password/i)).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn for matching credentials', async () => {
    const users: User[] = [
      { name: 'Jane', birth: '01/01/2000', email: 'jane@mail.com', pwd: 'secret123' },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(users));

    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText(/example@example\.com/i), 'jane@mail.com');
    fireEvent.changeText(getByPlaceholderText(/•+/), 'secret123');
    fireEvent.press(getByText(/log in/i));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('demo-token'));
  });
});
