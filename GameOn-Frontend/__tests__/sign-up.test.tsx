import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import SignUpScreen from '@/app/(auth)/sign-up';

// Quiet noisy logs in Jest
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Pass-through gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children ?? null,
}));

// Icons stub
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return { Ionicons: (p: any) => React.createElement('Icon', p) };
});

// Router replace()
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Logo
jest.mock('@/constants/images', () => ({ images: { logo: 1 } }));

// Auto-press Alert "OK" button (wherever it is)
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  const okBtn = buttons?.find(b => String(b.text).toLowerCase() === 'ok') ?? buttons?.[0];
  okBtn?.onPress?.();
  return 0 as any;
});

beforeEach(async () => {
  jest.clearAllMocks();

  // Make DOB (captured at render) be in the past by the time we submit.
  // Render happens at 2025-01-01, submit happens when "today" is 2025-01-02.
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

  await AsyncStorage.setItem('users', JSON.stringify([]));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SignUpScreen', () => {
  it('creates an account, saves it, and navigates to sign-in', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignUpScreen />);

    const cta = await findByText('Sign Up');

    // Fill fields
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('john doe'), 'Jane Doe');
      fireEvent.changeText(getByPlaceholderText('example@example.com'), 'jane@example.com');
      fireEvent.changeText(getByPlaceholderText('••••••••••••'), 'secret12');
    });

    // Advance "today" so DOB (set at render time) is now in the past
    jest.setSystemTime(new Date('2025-01-02T00:00:00.000Z'));

    await act(async () => {
      fireEvent.press(cta);
    });

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in')
    );

    const saved = JSON.parse((await AsyncStorage.getItem('users')) as string);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: 'Jane Doe',
      email: 'jane@example.com',
      pwd: 'secret12',
    });
    expect(typeof saved[0].birth).toBe('string'); // stored DOB
  });

  it('shows validation errors for bad inputs and does not navigate', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignUpScreen />);

    const cta = await findByText('Sign Up');

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('john doe'), 'J'); // too short -> your UI shows "required"
      fireEvent.changeText(getByPlaceholderText('example@example.com'), 'invalid');
      fireEvent.changeText(getByPlaceholderText('••••••••••••'), '123');
      fireEvent.press(cta);
    });

    // Expect the messages your UI actually renders
    expect(await findByText('Full name is required')).toBeTruthy();
    expect(await findByText('Email is required')).toBeTruthy();
    expect(await findByText('Password is required')).toBeTruthy();

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
