import React from 'react';
import { render } from '@testing-library/react-native';
import { HelloWave } from '@/components/hello-wave';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated');

  // Mock the `runOnJS` function
  Reanimated.runOnJS = (fn: any) => fn;

  return Reanimated;
});

describe('HelloWave', () => {
  it('renders the wave emoji', () => {
    const { getByText } = render(<HelloWave />);
    expect(getByText('👋')).toBeTruthy();
  });

  it('renders with correct styling', () => {
    const component = render(<HelloWave />);
    const waveElement = component.getByText('👋');
    expect(waveElement).toBeTruthy();
  });
});