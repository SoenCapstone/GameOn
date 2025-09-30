import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Silence warnings
jest.spyOn(console, 'warn').mockImplementation(() => {});

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// LinearGradient simple
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children ?? null,
}));

// Icons stub
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return { Ionicons: (p: any) => React.createElement('Icon', p) };
});

// Router replace used after sign up
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Logo
jest.mock('@/constants/images', () => ({ images: { logo: 1 } }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import SignUpScreen from '@/app/(auth)/sign-up';

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.setItem('users', JSON.stringify([]));
});

describe('SignUpScreen', () => {
  it('validates and saves a new user then navigates to sign-in', async () => {
    const { getByPlaceholderText, findByText } = render(<SignUpScreen />);

    // Wait past initial seeding spinner
    const signUpBtn = await findByText('Sign Up');

    fireEvent.changeText(getByPlaceholderText('john doe'), 'Jane Doe');
    fireEvent.changeText(getByPlaceholderText('example@example.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('••••••••••••'), 'secret12');
    fireEvent.changeText(getByPlaceholderText('DD/MM/YYYY'), '01/02/1990');

    fireEvent.press(signUpBtn);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in'));

    const saved = JSON.parse((await AsyncStorage.getItem('users')) as string);
    expect(saved).toEqual([
      { name: 'Jane Doe', pwd: 'secret12', email: 'jane@example.com', birth: '01/02/1990' },
    ]);
  });

  it('shows validation errors for bad inputs', async () => {
    const { getByPlaceholderText, findByText } = render(<SignUpScreen />);

    await findByText('Sign Up'); // wait for CTA to appear

    fireEvent.changeText(getByPlaceholderText('john doe'), 'J'); // too short
    fireEvent.changeText(getByPlaceholderText('example@example.com'), 'invalid'); // bad email
    fireEvent.changeText(getByPlaceholderText('••••••••••••'), '123'); // too short
    fireEvent.changeText(getByPlaceholderText('DD/MM/YYYY'), '31/02/2024'); // invalid date

    fireEvent.press(await findByText('Sign Up'));

    expect(await findByText('Enter your full name')).toBeTruthy();
    expect(await findByText('Enter a valid email')).toBeTruthy();
    expect(await findByText('Min 6 characters')).toBeTruthy();
    // Match your screen’s actual message:
    expect(await findByText('Enter a valid past date')).toBeTruthy();

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
