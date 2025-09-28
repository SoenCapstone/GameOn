// __tests__/sign-up.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SignUpScreen from '@/app/(auth)/sign-up';

// --- Mocks ---
// Use the official AsyncStorage Jest mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// LinearGradient -> simple View so tests don't need native module
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

// Vector icons can cause setState warnings; mock them to a no-op
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// Router mock (variable name starts with "mock" so it's allowed in factory)
const mockRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default storage value: empty users array (stringified)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
  });

  it('shows validation errors for bad email and DOB', async () => {
    const { getByPlaceholderText, findByText } = render(<SignUpScreen />);

    // Wait for the CTA to appear (initial ActivityIndicator will disappear)
    const cta = await findByText(/sign up/i);

    // Fill invalid values
    fireEvent.changeText(getByPlaceholderText(/john doe/i), 'j');                 // too short
    fireEvent.changeText(getByPlaceholderText(/•+/), '123');                      // too short
    fireEvent.changeText(getByPlaceholderText(/example@example\.com/i), 'nope');  // invalid email
    fireEvent.changeText(getByPlaceholderText(/dd\/mm\/yyyy/i), '32/13/2027');    // invalid date

    // Submit
    fireEvent.press(cta);

    // Expect Yup validation messages
    expect(await findByText(/enter your full name/i)).toBeTruthy();
    expect(await findByText(/min 6 characters/i)).toBeTruthy();
    expect(await findByText(/enter a valid email/i)).toBeTruthy();
    // Format or past-date (schema may surface either first)
    expect(
      await findByText(/use dd\/mm\/yyyy|enter a valid past date/i)
    ).toBeTruthy();

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('saves user and navigates to sign-in on success', async () => {
    const { getByPlaceholderText, findByText } = render(<SignUpScreen />);

    const cta = await findByText(/sign up/i);

    // Fill valid values
    fireEvent.changeText(getByPlaceholderText(/john doe/i), 'John Smith');
    fireEvent.changeText(getByPlaceholderText(/•+/), 'secret123');
    fireEvent.changeText(getByPlaceholderText(/example@example\.com/i), 'john@mail.com');
    fireEvent.changeText(getByPlaceholderText(/dd\/mm\/yyyy/i), '10/03/2001');

    fireEvent.press(cta);

    // AsyncStorage should be called with the updated list
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalled());

    // Check we saved the new user into 'users'
    const call = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
      (c: any[]) => c[0] === 'users'
    );
    const saved = JSON.parse(call[1]);
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'John Smith',
          email: 'john@mail.com',
          birth: '10/03/2001',
          pwd: 'secret123',
        }),
      ])
    );

    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/sign-in');
  });
});
